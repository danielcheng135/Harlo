import { HARLO_MODELS, getOpenAIClient } from "@/lib/ai/openai";
import type { AgentAnswerProfile } from "@/lib/ai/rag";
import type { IntegrationActionType, IntegrationProviderKey } from "@/lib/integrations/types";
import type { LeadCaptureField } from "@/lib/lead-fields";
import type { KnowledgeChunk } from "@/lib/types";

export type AgentPlannerReplyType =
  | "answer"
  | "collect_fields"
  | "run_action"
  | "answer_with_action"
  | "fallback";

export type AgentVisitorGoal =
  | "book_appointment"
  | "request_quote"
  | "service_request"
  | "ask_question"
  | "human_follow_up"
  | "unknown";

export type AgentPlannerAction = {
  type: IntegrationActionType;
  provider?: IntegrationProviderKey;
};

export type AgentPlannerResult = {
  replyType: AgentPlannerReplyType;
  visitorGoal: AgentVisitorGoal;
  confidence: number;
  messageToVisitor: string;
  missingFields: string[];
  nextAction?: AgentPlannerAction;
};

export type AvailablePlannerAction = {
  provider: IntegrationProviderKey;
  actionType: IntegrationActionType;
  label: string;
  requiredFields: string[];
};

type PlannerMessage = {
  role: string;
  content: string;
};

const REPLY_TYPES = new Set<AgentPlannerReplyType>([
  "answer",
  "collect_fields",
  "run_action",
  "answer_with_action",
  "fallback"
]);

const VISITOR_GOALS = new Set<AgentVisitorGoal>([
  "book_appointment",
  "request_quote",
  "service_request",
  "ask_question",
  "human_follow_up",
  "unknown"
]);

export async function planAgentNextStep({
  latestMessage,
  conversationMessages,
  chunks,
  leadFields,
  availableActions,
  agent
}: {
  latestMessage: string;
  conversationMessages: PlannerMessage[];
  chunks: KnowledgeChunk[];
  leadFields: LeadCaptureField[];
  availableActions: AvailablePlannerAction[];
  agent: AgentAnswerProfile;
}): Promise<AgentPlannerResult> {
  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: HARLO_MODELS.planner,
    instructions: buildPlannerInstructions(),
    input: [
      `Agent profile:\n${JSON.stringify(agent)}`,
      `Lead fields:\n${JSON.stringify(leadFields.filter((field) => field.enabled).map(({ key, label, type, prompt }) => ({ key, label, type, prompt })))}`,
      `Available actions:\n${JSON.stringify(availableActions)}`,
      `Knowledge snippets:\n${JSON.stringify(chunks.map((chunk) => ({ title: chunk.sourceTitle, content: chunk.content.slice(0, 900) })))}`,
      "Recent conversation:",
      conversationMessages.map((message) => `${message.role}: ${message.content}`).join("\n") || "none",
      `Visitor latest message:\n${latestMessage}`
    ].join("\n\n"),
    max_output_tokens: 450
  });

  return normalizePlannerResult(response.output_text);
}

function buildPlannerInstructions() {
  return [
    "You are Harlo's agent planner for a business website chatbot.",
    "Choose the next best step for the widget. Do not execute tools; only return a plan.",
    "Prefer answering from knowledge when the visitor is asking an informational question.",
    "When the visitor wants booking, quote, service, callback, or human follow-up, identify missing required fields before choosing an action.",
    "Choose a nextAction only if one of the available actions directly fits the visitor goal.",
    "If no action fits, collect lead fields or return a helpful fallback.",
    "Return only JSON with this shape:",
    "{\"replyType\":\"answer\",\"visitorGoal\":\"ask_question\",\"confidence\":0.8,\"messageToVisitor\":\"short visitor-facing message\",\"missingFields\":[],\"nextAction\":{\"type\":\"show_booking_link\",\"provider\":\"calendly\"}}",
    "replyType must be one of: answer, collect_fields, run_action, answer_with_action, fallback.",
    "visitorGoal must be one of: book_appointment, request_quote, service_request, ask_question, human_follow_up, unknown.",
    "missingFields must contain lead field keys, not labels.",
    "messageToVisitor must be concise and ready to show in the widget.",
    "Do not invent field values, provider names, prices, or availability."
  ].join("\n");
}

function normalizePlannerResult(value: string): AgentPlannerResult {
  try {
    const parsed = JSON.parse(value) as Partial<AgentPlannerResult>;
    const replyType = parsed.replyType && REPLY_TYPES.has(parsed.replyType) ? parsed.replyType : "fallback";
    const visitorGoal = parsed.visitorGoal && VISITOR_GOALS.has(parsed.visitorGoal) ? parsed.visitorGoal : "unknown";
    const messageToVisitor = typeof parsed.messageToVisitor === "string" && parsed.messageToVisitor.trim()
      ? parsed.messageToVisitor.trim()
      : "I can help with that. Could you share a little more detail?";
    const confidence = typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.3;
    const missingFields = Array.isArray(parsed.missingFields)
      ? parsed.missingFields.filter((field): field is string => typeof field === "string" && field.trim().length > 0)
      : [];
    const nextAction = normalizePlannerAction(parsed.nextAction);

    return {
      replyType,
      visitorGoal,
      confidence,
      messageToVisitor,
      missingFields,
      ...(nextAction ? { nextAction } : {})
    };
  } catch {
    return {
      replyType: "fallback",
      visitorGoal: "unknown",
      confidence: 0,
      messageToVisitor: "I can help with that. Could you share a little more detail?",
      missingFields: []
    };
  }
}

function normalizePlannerAction(action: unknown): AgentPlannerAction | null {
  if (!action || typeof action !== "object") {
    return null;
  }

  const record = action as Record<string, unknown>;
  const type = typeof record.type === "string" ? record.type : null;

  if (!isIntegrationActionType(type)) {
    return null;
  }

  return {
    type,
    provider: isIntegrationProvider(record.provider) ? record.provider : undefined
  };
}

function isIntegrationActionType(value: string | null): value is IntegrationActionType {
  return value === "show_booking_link" ||
    value === "submit_service_request" ||
    value === "send_webhook" ||
    value === "send_notification" ||
    value === "create_crm_contact";
}

function isIntegrationProvider(value: unknown): value is IntegrationProviderKey {
  return value === "calendly" ||
    value === "housecallpro" ||
    value === "jobber" ||
    value === "zapier" ||
    value === "slack" ||
    value === "hubspot";
}
