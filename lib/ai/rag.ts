import type { KnowledgeChunk } from "@/lib/types";
import { HARLO_MODELS, getOpenAIClient } from "@/lib/ai/openai";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { VisitorIntent } from "@/lib/ai/intent";

type MatchKnowledgeChunkRow = {
  id: string;
  bot_id: string;
  source_id: string;
  source_title: string;
  content: string;
  similarity: number;
};

type RawKnowledgeChunkRow = {
  id: string;
  bot_id: string;
  source_id: string;
  content: string;
  metadata: {
    source_name?: string;
  } | null;
  knowledge_sources: {
    name: string;
  } | null;
};

const STOP_WORDS = new Set([
  "a",
  "about",
  "an",
  "and",
  "are",
  "do",
  "does",
  "for",
  "how",
  "i",
  "is",
  "me",
  "much",
  "of",
  "our",
  "the",
  "to",
  "what",
  "your"
]);

export async function embedText(input: string) {
  const openai = getOpenAIClient();
  const result = await openai.embeddings.create({
    model: HARLO_MODELS.embedding,
    input
  });

  return result.data[0]?.embedding ?? [];
}

export async function retrieveKnowledgeChunks({
  botId,
  query,
  matchCount = 8,
  similarityThreshold = 0.42
}: {
  botId: string;
  query: string;
  matchCount?: number;
  similarityThreshold?: number;
}): Promise<KnowledgeChunk[]> {
  const embedding = await embedText(query);
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_bot_id: botId,
    query_embedding: `[${embedding.join(",")}]`,
    match_count: matchCount,
    similarity_threshold: similarityThreshold
  });

  if (error) {
    throw new Error(error.message);
  }

  const vectorMatches = ((data ?? []) as MatchKnowledgeChunkRow[]).map((chunk) => ({
    id: chunk.id,
    botId: chunk.bot_id,
    sourceId: chunk.source_id,
    sourceTitle: chunk.source_title,
    content: chunk.content,
    similarity: chunk.similarity
  }));

  if (vectorMatches.length > 0) {
    return vectorMatches;
  }

  return retrieveKeywordFallbackChunks({ botId, query, matchCount });
}

export function buildAnswerInstructions(chunks: KnowledgeChunk[]) {
  const context = chunks
    .map((chunk, index) => `Source ${index + 1}: ${chunk.sourceTitle}\n${chunk.content}`)
    .join("\n\n");

  return [
    "You are Harlo, a calm and helpful AI chatbot for a business website.",
    "Answer only from the provided business context.",
    "Focus on resolving the visitor's question before suggesting a handoff.",
    "If the context is insufficient, briefly say you do not have that detail and invite the visitor to ask another question. Only ask for contact details if the visitor asks for a quote, callback, appointment, booking, or human follow-up.",
    "Keep answers concise, direct, and useful.",
    "When listing prices, services, hours, or steps, use short markdown bullets. Every list item must start with '- '.",
    "Never start an answer with a bullet list. Always write one short sentence first explaining what the bullets are, such as \"Here are the services:\" or \"Here are the starting prices:\".",
    "End each answer with one short contextual next step. If the business context contains a useful related topic the visitor has not just received, offer it naturally, such as pricing after services or hours after pricing. If there is no useful related topic left, ask whether they have any other questions.",
    "Do not offer contact capture as the default next step. Only offer a quote, callback, appointment, booking, consultation, or team follow-up when the visitor's question or the business context makes that next step directly relevant.",
    "If the visitor says yes, ok, okay, sure, do that, or similar, interpret it as accepting the most recent offered follow-up in the recent conversation. If two options were offered, answer the first unanswered option.",
    `Business context:\n${context}`
  ].join("\n\n");
}

export async function generateAnswer({
  question,
  chunks,
  conversationContext,
  intent
}: {
  question: string;
  chunks: KnowledgeChunk[];
  conversationContext?: string;
  intent?: VisitorIntent;
}) {
  if (intent === "decline_offer" || intent === "unclear") {
    return generateConversationalAnswer({
      question,
      conversationContext,
      intent
    });
  }

  if (isUnclearQuestion(question) && !isContextualConfirmation(question, conversationContext)) {
    return generateConversationalAnswer({
      question,
      conversationContext,
      intent: "unclear"
    });
  }

  if (chunks.length === 0) {
    return "Sorry, I do not have enough information to answer that confidently yet. Could you ask another way, or share what you need help with?";
  }

  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: HARLO_MODELS.answer,
    instructions: buildAnswerInstructions(chunks),
    input: conversationContext
      ? `Recent conversation:\n${conversationContext}\n\nVisitor's latest message:\n${question}`
      : question,
    max_output_tokens: 450
  });

  return ensureListIntro(response.output_text.trim(), question);
}

async function generateConversationalAnswer({
  question,
  conversationContext,
  intent
}: {
  question: string;
  conversationContext?: string;
  intent: VisitorIntent;
}) {
  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: HARLO_MODELS.answer,
    instructions: [
      "You are Harlo, a calm and helpful AI chatbot for a business website.",
      "Respond naturally and logically to the visitor's latest message using the recent conversation.",
      "If the visitor declines an offer, acknowledge the decline and leave the door open for another question.",
      "If the visitor is unclear, ask a short clarifying question.",
      "Do not ask for contact details unless the visitor is asking for a quote, booking, appointment, callback, consultation, or human follow-up.",
      "Keep the reply concise."
    ].join("\n"),
    input: [
      conversationContext ? `Recent conversation:\n${conversationContext}` : "Recent conversation: none",
      `Detected intent: ${intent}`,
      `Visitor latest message:\n${question}`
    ].join("\n\n"),
    max_output_tokens: 160
  });

  return response.output_text.trim();
}

function isUnclearQuestion(question: string) {
  const normalized = question.trim();

  if (!normalized) {
    return true;
  }

  if (!/[a-z0-9]/i.test(normalized)) {
    return true;
  }

  const words = normalized.match(/[a-z0-9]+/gi) ?? [];
  const hasMeaningfulWord = words.some((word) => word.length >= 3);

  return normalized.length < 3 || (!hasMeaningfulWord && words.length <= 2);
}

function isContextualConfirmation(question: string, conversationContext?: string) {
  if (!conversationContext) {
    return false;
  }

  const normalized = question.trim().replace(/[.!]+$/g, "");

  if (!/^(?:yes|yeah|yep|sure|ok|okay|please|yes please|yeah please|sure please|do that|yes do that|yes please do that|please do that|that sounds good|sounds good|go ahead|show me|show me that|tell me|tell me more)$/i.test(normalized)) {
    return false;
  }

  return /\b(?:i can also|if you want|would you like|i can share|i can show|i can help with|do you want)\b/i.test(conversationContext);
}

function ensureListIntro(answer: string, question: string) {
  const lines = answer.split("\n");
  const firstContentIndex = lines.findIndex((line) => line.trim().length > 0);

  if (firstContentIndex === -1 || !/^[-*•]\s+/.test(lines[firstContentIndex].trim())) {
    return answer;
  }

  const intro = /\b(price|pricing|cost|quote|charge|fee)\b/i.test(`${question}\n${answer}`)
    ? "Here are the starting prices:"
    : /\b(hour|open|available|availability)\b/i.test(`${question}\n${answer}`)
      ? "Here are the business hours:"
      : "Here are the services:";

  return [intro, ...lines].join("\n");
}

async function retrieveKeywordFallbackChunks({
  botId,
  query,
  matchCount
}: {
  botId: string;
  query: string;
  matchCount: number;
}): Promise<KnowledgeChunk[]> {
  const terms = tokenizeQuery(query);

  if (terms.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("knowledge_chunks")
    .select("id, bot_id, source_id, content, metadata, knowledge_sources(name)")
    .eq("bot_id", botId)
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as RawKnowledgeChunkRow[])
    .map((chunk) => {
      const content = chunk.content.toLowerCase();
      const score = terms.reduce((total, term) => total + (content.includes(term) ? 1 : 0), 0);

      return {
        chunk,
        score
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, matchCount)
    .map(({ chunk, score }) => ({
      id: chunk.id,
      botId: chunk.bot_id,
      sourceId: chunk.source_id,
      sourceTitle: chunk.metadata?.source_name ?? chunk.knowledge_sources?.name ?? "Knowledge source",
      content: chunk.content,
      similarity: score / terms.length
    }));
}

function tokenizeQuery(query: string) {
  const aliases = query
    .toLowerCase()
    .replace(/\b(cost|costs|price|prices|pricing|charge|charges|fee|fees)\b/g, " pricing services starts")
    .replace(/\b(service|services)\b/g, " services cleaning residential office");

  return Array.from(new Set(aliases.match(/[a-z0-9]{3,}/g) ?? [])).filter((term) => !STOP_WORDS.has(term));
}
