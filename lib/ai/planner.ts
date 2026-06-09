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

export type AgentPlannerNextStep =
  | "answer_question"
  | "show_booking"
  | "start_lead_capture"
  | "continue_lead_capture"
  | "create_crm_contact"
  | "handoff"
  | "clarify";

export type AgentPlannerAction = {
  type: IntegrationActionType;
  provider?: IntegrationProviderKey;
};

export type AgentPlannerResult = {
  replyType: AgentPlannerReplyType;
  nextStep: AgentPlannerNextStep;
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

const NEXT_STEPS = new Set<AgentPlannerNextStep>([
  "answer_question",
  "show_booking",
  "start_lead_capture",
  "continue_lead_capture",
  "create_crm_contact",
  "handoff",
  "clarify"
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
    "Choose exactly one nextStep for the widget. Do not execute tools; only return a plan.",
    "Use answer_question for informational questions about services, pricing, hours, locations, policies, features, or what the business does.",
    "Never start lead capture for general questions such as 'what services do you offer?' or 'how much does it cost?' unless the visitor explicitly asks for a quote, callback, human follow-up, or gives contact details.",
    "Use show_booking when the visitor asks to book, schedule, see availability, set an appointment, or book a demo and a show_booking_link action is available.",
    "A context-dependent reply only continues the latest assistant offer. Never choose show_booking when that latest offer was informational, such as comparing plans, explaining pricing, or describing services.",
    "Use start_lead_capture only when the visitor explicitly wants a quote, estimate, callback, contact, sales follow-up, human handoff, or asks the team to reach out.",
    "Use continue_lead_capture only when the assistant recently asked for lead details or the visitor is clearly providing requested contact/project details.",
    "Use create_crm_contact only after required lead fields are present and an available action directly creates a contact.",
    "If confidence is low, choose answer_question or clarify instead of lead capture.",
    "Choose a nextAction only if one of the available actions directly fits the visitor goal.",
    "Return only JSON with this shape:",
    "{\"replyType\":\"answer\",\"nextStep\":\"answer_question\",\"visitorGoal\":\"ask_question\",\"confidence\":0.8,\"messageToVisitor\":\"short visitor-facing message\",\"missingFields\":[],\"nextAction\":{\"type\":\"show_booking_link\",\"provider\":\"calendly\"}}",
    "replyType must be one of: answer, collect_fields, run_action, answer_with_action, fallback.",
    "nextStep must be one of: answer_question, show_booking, start_lead_capture, continue_lead_capture, create_crm_contact, handoff, clarify.",
    "visitorGoal must be one of: book_appointment, request_quote, service_request, ask_question, human_follow_up, unknown.",
    "missingFields must contain lead field keys, not labels.",
    "messageToVisitor must be concise and ready to show in the widget.",
    "Do not use em dashes in messageToVisitor. Use a period, comma, colon, or parentheses instead.",
    "Do not invent field values, provider names, prices, or availability."
  ].join("\n");
}

function normalizePlannerResult(value: string): AgentPlannerResult {
  try {
    const parsed = JSON.parse(extractJsonObject(value)) as Partial<AgentPlannerResult>;
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
    const nextStep = parsed.nextStep && NEXT_STEPS.has(parsed.nextStep)
      ? parsed.nextStep
      : inferPlannerNextStep({ replyType, visitorGoal, nextAction });

    return {
      replyType,
      nextStep,
      visitorGoal,
      confidence,
      messageToVisitor,
      missingFields,
      ...(nextAction ? { nextAction } : {})
    };
  } catch {
    return {
      replyType: "fallback",
      nextStep: "clarify",
      visitorGoal: "unknown",
      confidence: 0,
      messageToVisitor: "I can help with that. Could you share a little more detail?",
      missingFields: []
    };
  }
}

function inferPlannerNextStep({
  replyType,
  visitorGoal,
  nextAction
}: {
  replyType: AgentPlannerReplyType;
  visitorGoal: AgentVisitorGoal;
  nextAction: AgentPlannerAction | null;
}): AgentPlannerNextStep {
  if (nextAction?.type === "show_booking_link") {
    return "show_booking";
  }

  if (nextAction?.type === "create_crm_contact") {
    return "create_crm_contact";
  }

  if (replyType === "collect_fields") {
    return "start_lead_capture";
  }

  if (replyType === "run_action" || replyType === "answer_with_action") {
    return visitorGoal === "book_appointment" ? "show_booking" : "handoff";
  }

  if (replyType === "fallback") {
    return "clarify";
  }

  return "answer_question";
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
    value === "calcom" ||
    value === "jobber" ||
    value === "slack" ||
    value === "hubspot" ||
    value === "mailchimp" ||
    value === "google_sheets";
}
