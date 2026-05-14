export const AGENT_TYPES = ["support", "sales", "custom"] as const;

export type AgentType = (typeof AGENT_TYPES)[number];

export type AgentTemplate = {
  type: AgentType;
  label: string;
  badge: string;
  description: string;
  defaultDescription: string;
  systemInstructions: string;
  handoffInstructions: string;
};

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    type: "support",
    label: "Customer Support Agent",
    badge: "Support",
    description: "Best for answering repeat questions, policies, services, and setup details.",
    defaultDescription: "Answers common website questions with approved business knowledge.",
    systemInstructions: "Prioritize accurate, source-grounded answers. Resolve the visitor's question first, keep responses concise, and only offer a handoff when the visitor asks for a quote, booking, callback, appointment, consultation, or human follow-up.",
    handoffInstructions: "When a visitor needs a person, collect the configured lead details and summarize the question, page context, and any urgency for the team."
  },
  {
    type: "sales",
    label: "Sales Agent",
    badge: "Sales",
    description: "Best for qualifying high-intent visitors and turning questions into useful leads.",
    defaultDescription: "Qualifies interested visitors and captures lead context for follow-up.",
    systemInstructions: "Help visitors understand fit, pricing, services, and next steps. Answer from approved business knowledge, look for buying intent, and guide qualified visitors toward a useful follow-up without being pushy.",
    handoffInstructions: "When a visitor shows purchase intent, collect the configured lead details and summarize fit, timeline, need, and the original question."
  },
  {
    type: "custom",
    label: "Custom Agent",
    badge: "Custom",
    description: "Best when this agent needs a blended role or a more specific operating style.",
    defaultDescription: "Handles a custom mix of support, qualification, and routing.",
    systemInstructions: "Follow the configured role closely. Stay grounded in approved business knowledge, be concise, and ask clarifying questions when the visitor's need is ambiguous.",
    handoffInstructions: "Use the configured lead details and include the conversation context the team needs to respond quickly."
  }
];

export function normalizeAgentType(value: unknown): AgentType {
  return value === "sales" || value === "custom" ? value : "support";
}

export function getAgentTemplate(type: unknown) {
  const normalizedType = normalizeAgentType(type);
  return AGENT_TEMPLATES.find((template) => template.type === normalizedType) ?? AGENT_TEMPLATES[0];
}

export function getAgentTypeForGoal(goal: "support" | "lead_capture" | "both"): AgentType {
  if (goal === "lead_capture") {
    return "sales";
  }

  if (goal === "both") {
    return "custom";
  }

  return "support";
}
