import { HARLO_MODELS, getOpenAIClient } from "@/lib/ai/openai";

export type VisitorIntent =
  | "answer_or_question"
  | "accept_follow_up"
  | "decline_offer"
  | "provide_contact_info"
  | "request_human_follow_up"
  | "unclear";

type IntentResult = {
  intent: VisitorIntent;
  confidence: number;
};

const VALID_INTENTS = new Set<VisitorIntent>([
  "answer_or_question",
  "accept_follow_up",
  "decline_offer",
  "provide_contact_info",
  "request_human_follow_up",
  "unclear"
]);

export async function classifyVisitorIntent({
  message,
  conversationContext
}: {
  message: string;
  conversationContext?: string;
}): Promise<IntentResult> {
  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: HARLO_MODELS.classify,
    instructions: [
      "Classify the visitor's latest message for a business website chatbot.",
      "Use the recent conversation to understand short replies like ok, yes, no thanks, or I'm alright.",
      "The latest message has priority over older conversation. Do not let stale earlier messages change the meaning of a clear new question.",
      "Return only JSON with this shape: {\"intent\":\"answer_or_question\",\"confidence\":0.92}.",
      "Intent meanings:",
      "answer_or_question: the visitor asks a new question or gives a normal conversational reply that should be answered.",
      "accept_follow_up: the visitor accepts a specific follow-up the assistant just offered, such as prices, hours, services, booking details, or quote help.",
      "decline_offer: the visitor declines an offer or says they are all set.",
      "provide_contact_info: the visitor is providing name, email, property size, date, or other lead details.",
      "request_human_follow_up: the visitor asks for a quote, callback, booking, appointment, consultation, or human follow-up.",
      "unclear: the visitor's message cannot be understood even with context.",
      "Questions about cost, pricing, services, hours, availability, locations, policies, or business details are answer_or_question unless the visitor explicitly asks a person to follow up.",
      "Do not classify a decline like \"I am alright\" or \"no thanks\" as contact info."
    ].join("\n"),
    input: [
      conversationContext ? `Recent conversation:\n${conversationContext}` : "Recent conversation: none",
      `Visitor latest message:\n${message}`
    ].join("\n\n"),
    max_output_tokens: 80
  });

  try {
    const parsed = JSON.parse(response.output_text) as Partial<IntentResult>;
    const intent = parsed.intent && VALID_INTENTS.has(parsed.intent) ? parsed.intent : "answer_or_question";
    const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.5;

    return { intent, confidence };
  } catch {
    return { intent: "answer_or_question", confidence: 0 };
  }
}
