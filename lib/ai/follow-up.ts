import { HARLO_MODELS, getOpenAIClient } from "@/lib/ai/openai";

export type ContextualFollowUpType =
  | "informational"
  | "booking"
  | "lead_capture"
  | "none";

export type ContextualFollowUpResolution = {
  resolvedMessage: string;
  type: Exclude<ContextualFollowUpType, "none">;
  confidence: number;
};

type ConversationMessage = {
  role: string;
  content: string;
};

type ModelResolution = {
  dependsOnPreviousMessage?: unknown;
  resolvedMessage?: unknown;
  type?: unknown;
  confidence?: unknown;
};

const FOLLOW_UP_TYPES = new Set<ContextualFollowUpType>([
  "informational",
  "booking",
  "lead_capture",
  "none"
]);

export async function resolveContextualFollowUp({
  latestMessage,
  conversationMessages
}: {
  latestMessage: string;
  conversationMessages: ConversationMessage[];
}): Promise<ContextualFollowUpResolution | null> {
  if (!shouldResolveWithContext(latestMessage, conversationMessages)) {
    return null;
  }

  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: HARLO_MODELS.classify,
    instructions: [
      "Resolve a visitor's short or context-dependent reply in a business website chatbot.",
      "Decide whether the latest visitor message depends on the immediately preceding assistant message.",
      "Use only the most recent assistant offer or question. Ignore older offers and any integrations that may be available.",
      "If the visitor accepts an informational offer, rewrite it as an explicit request for that information.",
      "If the visitor accepts a booking offer, rewrite it as an explicit request to book.",
      "If the visitor accepts an offer to share contact details or receive human follow-up, rewrite it as an explicit request for that follow-up.",
      "If the latest message is already independent, is a decline, or does not clearly accept or continue the latest assistant message, set dependsOnPreviousMessage to false.",
      "Do not invent a booking, lead, or topic that the latest assistant did not offer.",
      "Return only JSON with this shape:",
      "{\"dependsOnPreviousMessage\":true,\"resolvedMessage\":\"Please explain the information you just offered.\",\"type\":\"informational\",\"confidence\":0.95}",
      "type must be informational, booking, lead_capture, or none."
    ].join("\n"),
    input: [
      "Recent conversation in chronological order:",
      conversationMessages
        .slice(-8)
        .map((message) => `${message.role}: ${message.content}`)
        .join("\n"),
      `Latest visitor message:\n${latestMessage}`
    ].join("\n\n"),
    max_output_tokens: 180
  });

  return normalizeResolution(response.output_text);
}

function shouldResolveWithContext(
  latestMessage: string,
  conversationMessages: ConversationMessage[]
) {
  const normalized = latestMessage.trim();
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const latestMessageIndex = findLatestVisitorIndex(conversationMessages);

  if (!normalized || normalized.length > 140 || wordCount > 20 || latestMessageIndex <= 0) {
    return false;
  }

  const previousMessage = conversationMessages[latestMessageIndex - 1];

  return previousMessage?.role === "assistant" && previousMessage.content.trim().length > 0;
}

function findLatestVisitorIndex(messages: ConversationMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      return index;
    }
  }

  return -1;
}

function normalizeResolution(value: string): ContextualFollowUpResolution | null {
  try {
    const parsed = JSON.parse(extractJsonObject(value)) as ModelResolution;
    const dependsOnPreviousMessage = parsed.dependsOnPreviousMessage === true;
    const resolvedMessage = typeof parsed.resolvedMessage === "string"
      ? parsed.resolvedMessage.trim()
      : "";
    const type = typeof parsed.type === "string" && FOLLOW_UP_TYPES.has(parsed.type as ContextualFollowUpType)
      ? parsed.type as ContextualFollowUpType
      : "none";
    const confidence = typeof parsed.confidence === "number"
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0;

    if (
      !dependsOnPreviousMessage ||
      !resolvedMessage ||
      type === "none" ||
      confidence < 0.65
    ) {
      return null;
    }

    return {
      resolvedMessage,
      type,
      confidence
    };
  } catch {
    return null;
  }
}

function extractJsonObject(value: string) {
  const trimmed = value.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return trimmed;
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}
