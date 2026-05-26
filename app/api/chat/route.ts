import { NextRequest } from "next/server";
import {
  getInvalidEmailReply,
  leadQuestionFromMessages
} from "@/lib/ai/lead-capture";
import { classifyVisitorIntent, type VisitorIntent } from "@/lib/ai/intent";
import { extractLeadDraftWithModel } from "@/lib/ai/lead-field-extraction";
import {
  planAgentNextStep,
  type AgentPlannerNextStep,
  type AgentPlannerResult,
  type AvailablePlannerAction
} from "@/lib/ai/planner";
import { generateAnswer, retrieveKnowledgeChunks } from "@/lib/ai/rag";
import { normalizeAgentType, type AgentType } from "@/lib/agents";
import { attemptAutoRecharge, isAutoRechargeFailureReason } from "@/lib/billing/auto-recharge";
import { sendAutoRechargeFailedEmail, sendCreditLimitEmail } from "@/lib/billing/notifications";
import { getCreditUsageStatus, recordAssistantMessageUsage } from "@/lib/billing/usage";
import {
  getConnectedCalendlyBookingAction,
  getConnectedHubSpotContactAction,
  getConnectedJobberLeadAction,
  getEnabledIntegrationActionsForBot,
  runIntegrationAction,
  type EnabledIntegrationAction
} from "@/lib/integrations/actions";
import type { IntegrationActionPayload, IntegrationActionResult } from "@/lib/integrations/types";
import {
  buildConfiguredLeadReply,
  configuredLeadMetadata,
  isConfiguredLeadComplete,
  normalizeLeadFields,
  type LeadCaptureField
} from "@/lib/lead-fields";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { ChatRequest } from "@/lib/types";
import { widgetCorsPreflight, widgetJson } from "@/lib/widget/cors";
import { isAllowedWidgetOrigin } from "@/lib/widget/config";

export function OPTIONS(request: NextRequest) {
  return widgetCorsPreflight(request);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ChatRequest & { testOnly?: boolean };

  if (!body.botId || !body.message) {
    return widgetJson(request, { error: "botId and message are required." }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: bot, error: botError } = await supabase
    .from("bots")
    .select("id, organization_id, agent_type, description, system_instructions, handoff_instructions, lead_capture_fields, allowed_domains")
    .eq("id", body.botId)
    .eq("status", "active")
    .single();

  if (botError || !bot) {
    return widgetJson(request, { error: "Chatbot not found." }, { status: 404 });
  }

  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  const allowedDomains = Array.isArray(bot.allowed_domains) ? bot.allowed_domains.filter((domain): domain is string => typeof domain === "string") : [];

  if (!body.testOnly && !isAllowedWidgetOrigin({ allowedDomains }, origin)) {
    return widgetJson(request, { error: "Widget domain is not allowed." }, { status: 403 });
  }

  const botId = bot.id;
  const organizationId = bot.organization_id;
  const leadFields = normalizeLeadFields(bot.lead_capture_fields);
  const agent = {
    type: normalizeAgentType(bot.agent_type),
    description: typeof bot.description === "string" ? bot.description : "",
    systemInstructions: typeof bot.system_instructions === "string" ? bot.system_instructions : "",
    handoffInstructions: typeof bot.handoff_instructions === "string" ? bot.handoff_instructions : ""
  };

  if (body.testOnly) {
    let creditUsage = await getCreditUsageStatus(supabase, organizationId);
    let autoRechargeSkipped: string | null = null;
    let autoRechargePaymentIntentId: string | null = null;

    if (!creditUsage.canReply && creditUsage.reason === "limit_reached") {
      const autoRecharge = await attemptAutoRecharge({ supabase, organizationId });
      autoRechargeSkipped = autoRecharge.skipped;
      autoRechargePaymentIntentId = autoRecharge.paymentIntentId ?? null;

      if (autoRecharge.recharged) {
        creditUsage = await getCreditUsageStatus(supabase, organizationId);
      }
    }

    if (!creditUsage.canReply) {
      return widgetJson(request, {
        conversationId: "dashboard-test",
        answer: getCreditLimitReply(creditUsage.reason),
        fallback: false,
        leadCaptured: false,
        billingLimitReached: true,
        autoRechargeSkipped,
        autoRechargePaymentIntentId,
        retrieval: []
      });
    }

    const chunks = await retrieveKnowledgeChunks({
      botId,
      organizationId,
      query: body.message
    });
    const answer = await generateAnswer({
      question: body.message,
      chunks,
      conversationContext: "",
      intent: "answer_or_question",
      agent
    });
    await recordAssistantMessageUsage({
      supabase,
      organizationId,
      botId,
      conversationId: null,
      messageId: null,
      metadata: {
        source: "dashboard_test"
      }
    });

    return widgetJson(request, {
      conversationId: "dashboard-test",
      answer,
      fallback: chunks.length === 0,
      leadCaptured: false,
      retrieval: chunks.map((chunk) => ({
        sourceTitle: chunk.sourceTitle,
        similarity: chunk.similarity
      }))
    });
  }

  let conversationId = await getExistingConversationId({
    supabase,
    conversationId: body.conversationId,
    organizationId,
    botId
  });

  if (!conversationId) {
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        organization_id: organizationId,
        bot_id: botId,
        visitor_id: body.visitor?.anonymousId,
        page_url: body.visitor?.pageUrl
      })
      .select("id")
      .single();

    if (conversationError || !conversation) {
      return widgetJson(request, { error: conversationError?.message ?? "Could not create conversation." }, { status: 500 });
    }

    conversationId = conversation.id;
  }

  if (!conversationId) {
    return widgetJson(request, { error: "Could not initialize conversation." }, { status: 500 });
  }

  const activeConversationId = conversationId;

  async function saveAssistantReply(content: string, metadata: Record<string, unknown>, options: { recordUsage?: boolean } = {}) {
    const { data: assistantMessage, error: assistantMessageError } = await supabase.from("messages").insert({
      conversation_id: activeConversationId,
      role: "assistant",
      content,
      metadata
    }).select("id").single();

    if (assistantMessageError || !assistantMessage) {
      return widgetJson(request, { error: assistantMessageError?.message ?? "Could not save assistant message." }, { status: 500 });
    }

    if (options.recordUsage !== false) {
      await recordAssistantMessageUsage({
        supabase,
        organizationId,
        botId,
        conversationId: activeConversationId,
        messageId: assistantMessage.id
      });
    }

    return null;
  }

  const { error: visitorMessageError } = await supabase.from("messages").insert({
    conversation_id: activeConversationId,
    role: "user",
    content: body.message,
    metadata: {
      page_url: body.visitor?.pageUrl,
      referrer: body.visitor?.referrer
    }
  });

  if (visitorMessageError) {
    return widgetJson(request, { error: visitorMessageError.message }, { status: 500 });
  }

  let creditUsage = await getCreditUsageStatus(supabase, organizationId);
  let autoRechargeSkipped: string | null = null;
  let autoRechargePaymentIntentId: string | null = null;

  if (!creditUsage.canReply && creditUsage.reason === "limit_reached") {
    const autoRecharge = await attemptAutoRecharge({ supabase, organizationId });
    autoRechargeSkipped = autoRecharge.skipped;
    autoRechargePaymentIntentId = autoRecharge.paymentIntentId ?? null;

    if (autoRecharge.recharged) {
      creditUsage = await getCreditUsageStatus(supabase, organizationId);
    }
  }

  if (!creditUsage.canReply) {
    const answer = getCreditLimitReply(creditUsage.reason);
    const saveError = await saveAssistantReply(answer, {
      billing_limit_reached: true,
      billing_reason: creditUsage.reason,
      credits_used: creditUsage.creditsUsed,
      credit_limit: creditUsage.creditLimit,
      auto_recharge_skipped: autoRechargeSkipped,
      auto_recharge_payment_intent_id: autoRechargePaymentIntentId
    }, {
      recordUsage: false
    });

    if (saveError) {
      return saveError;
    }

    const billingAlert = isAutoRechargeFailureReason(autoRechargeSkipped)
      ? await sendAutoRechargeFailedEmail({
        supabase,
        organizationId,
        reason: autoRechargeSkipped,
        creditsUsed: creditUsage.creditsUsed,
        creditLimit: creditUsage.creditLimit
      }).catch((error) => {
        console.error("Could not send auto-recharge failure email", error);
        return { sent: false, skipped: "send_failed" };
      })
      : await sendCreditLimitEmail({
        supabase,
        organizationId,
        reason: creditUsage.reason,
        creditsUsed: creditUsage.creditsUsed,
        creditLimit: creditUsage.creditLimit
      }).catch((error) => {
        console.error("Could not send credit limit email", error);
        return { sent: false, skipped: "send_failed" };
      });

    return widgetJson(request, {
      conversationId: activeConversationId,
      answer,
      fallback: false,
      leadCaptured: false,
      billingLimitReached: true,
      billingAlertSent: billingAlert.sent === true,
      autoRechargeSkipped,
      retrieval: []
    });
  }

  const { data: recentMessages } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", activeConversationId)
    .order("created_at", { ascending: false })
    .limit(8);
  const conversationContext = (recentMessages ?? [])
    .reverse()
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");
  const conversationMessages = (recentMessages ?? [])
    .reverse()
    .map((message) => ({
      role: message.role,
      content: message.content
    }));
  const effectiveVisitorMessage = resolveAcceptedFollowUpMessage(body.message, conversationMessages);
  const retrievalQuery = conversationContext
    ? `${conversationContext}\nvisitor latest: ${effectiveVisitorMessage}`
    : effectiveVisitorMessage;
  const [intent, loadedIntegrationActions] = await Promise.all([
    classifyVisitorIntent({
      message: body.message,
      conversationContext
    }),
    getEnabledIntegrationActionsForBot({
      supabase,
      organizationId,
      botId,
      requestUrl: request.url
    })
  ]);
  let integrationActions = loadedIntegrationActions;
  const bookingRequested = hasBookingLanguage(effectiveVisitorMessage);

  if (bookingRequested && !hasCalendlyBookingAction(integrationActions)) {
    const calendlyFallbackAction = await getConnectedCalendlyBookingAction({
      supabase,
      organizationId,
      requestUrl: request.url
    });

    if (calendlyFallbackAction) {
      integrationActions = [calendlyFallbackAction, ...integrationActions];
    }
  }

  if (!hasJobberLeadAction(integrationActions)) {
    const jobberFallbackAction = await getConnectedJobberLeadAction({
      supabase,
      organizationId,
      requestUrl: request.url
    });

    if (jobberFallbackAction) {
      integrationActions = [...integrationActions, jobberFallbackAction];
    }
  }

  if (!hasHubSpotContactAction(integrationActions)) {
    const hubSpotFallbackAction = await getConnectedHubSpotContactAction({
      supabase,
      organizationId,
      requestUrl: request.url
    });

    if (hubSpotFallbackAction) {
      integrationActions = [...integrationActions, hubSpotFallbackAction];
    }
  }

  const chunks = await retrieveKnowledgeChunks({
    botId,
    organizationId,
    query: retrievalQuery
  });

  const [generatedAnswer, plannerResult] = await Promise.all([
    generateAnswer({
      question: effectiveVisitorMessage,
      chunks,
      conversationContext,
      intent: intent.intent,
      agent
    }),
    getPlannerResult({
      latestMessage: effectiveVisitorMessage,
      conversationMessages,
      chunks,
      leadFields,
      actions: integrationActions,
      agent
    })
  ]);
  const decision = decideChatNextStep({
    agentType: agent.type,
    intent: intent.intent,
    message: effectiveVisitorMessage,
    conversationMessages,
    leadFields,
    plannerResult,
    actions: integrationActions,
    bookingRequested
  });
  let answer = generatedAnswer;
  const integrationResults: WidgetIntegrationResult[] = [];
  const widgetActions: WidgetAction[] = [];
  const bookingAction = decision.step === "show_booking"
    ? findBookingAction({
      actions: integrationActions,
      plannerResult,
      message: effectiveVisitorMessage
    })
    : null;

  if (bookingAction) {
    const bookingResult = await runIntegrationAction({
      supabase,
      action: bookingAction,
      requestUrl: request.url,
      payload: buildIntegrationActionPayload({
        organizationId,
        botId,
        conversationId: activeConversationId,
        visitorMessage: effectiveVisitorMessage,
        lead: {},
        sourcePageUrl: body.visitor?.pageUrl
      })
    });
    integrationResults.push({
      provider: bookingAction.provider,
      actionType: bookingAction.actionType,
      status: bookingResult.status,
      externalRecordId: bookingResult.externalRecordId ?? null,
      externalUrl: bookingResult.externalUrl ?? null,
      message: bookingResult.message ?? null,
      error: bookingResult.error ?? null
    });

    if (bookingResult.ok && bookingResult.externalUrl) {
      answer = buildBookingActionAnswer(plannerResult);
      widgetActions.push({
        type: "booking",
        provider: "calendly",
        title: "Book a time",
        description: "Choose an available time in Calendly without leaving this page.",
        buttonLabel: "Open scheduler",
        url: bookingResult.externalUrl
      });
    }
  } else if (decision.step === "show_booking") {
    answer = buildMissingBookingActionAnswer(plannerResult);
  }

  if (widgetActions.length === 0 && shouldRunLeadCaptureDecision(decision)) {
    const { data: leadMessages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", activeConversationId)
      .order("created_at", { ascending: true })
      .limit(50);
    const leadConversationMessages = (leadMessages ?? []).map((message) => ({
      role: message.role,
      content: message.content
    }));
    const userMessages = leadConversationMessages
      .filter((message) => message.role === "user")
      .map((message) => message.content);
    const invalidEmailReply = getInvalidEmailReply(body.message);

    if (invalidEmailReply) {
      const saveError = await saveAssistantReply(invalidEmailReply, {
        lead_partial: true,
        invalid_email: true,
        intent,
        planner: plannerResult,
        decision
      });

      if (saveError) {
        return saveError;
      }

      return widgetJson(request, {
        conversationId: activeConversationId,
        answer: invalidEmailReply,
        fallback: false,
        leadCaptured: false,
        leadCaptureForm: getLeadCaptureFormPayload(leadFields),
        retrieval: []
      });
    }

    const draft = await extractLeadDraftWithModel(leadConversationMessages, leadFields);
    const answer = buildConfiguredLeadReply(draft, leadFields, leadConversationMessages);

    if (isConfiguredLeadComplete(draft, leadFields) && draft.email) {
      const originalQuestion = leadQuestionFromMessages(userMessages, draft.email);
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id, metadata")
        .eq("conversation_id", activeConversationId)
        .maybeSingle();
      const leadPayload = {
        organization_id: organizationId,
        bot_id: botId,
        conversation_id: activeConversationId,
        name: draft.name ?? "Website visitor",
        email: draft.email,
        question: originalQuestion,
        status: "new",
        metadata: configuredLeadMetadata(draft, leadFields)
      };
      let leadId = existingLead?.id ?? null;

      if (existingLead) {
        const { data: updatedLead } = await supabase
          .from("leads")
          .update(leadPayload)
          .eq("id", existingLead.id)
          .select("id")
          .maybeSingle();
        leadId = updatedLead?.id ?? leadId;
      } else {
        const { data: insertedLead } = await supabase
          .from("leads")
          .insert(leadPayload)
          .select("id")
          .single();
        leadId = insertedLead?.id ?? null;
      }

      const leadIntegrationResults = await runLeadCapturedIntegrationActions({
        supabase,
        actions: integrationActions,
        requestUrl: request.url,
        payload: buildIntegrationActionPayload({
          organizationId,
          botId,
          conversationId: activeConversationId,
          leadId,
          visitorMessage: body.message,
          lead: {
            name: draft.name ?? "Website visitor",
            email: draft.email,
            phone: draft.phone ?? null,
            question: originalQuestion,
            metadata: configuredLeadMetadata(draft, leadFields)
          },
          sourcePageUrl: body.visitor?.pageUrl
        })
      });

      const saveError = await saveAssistantReply(answer, {
        lead_captured: true,
        intent,
        planner: plannerResult,
        decision,
        integration_results: leadIntegrationResults
      });

      if (saveError) {
        return saveError;
      }

      return widgetJson(request, {
        conversationId: activeConversationId,
        answer,
        fallback: false,
        leadCaptured: true,
        integrationResults: leadIntegrationResults,
        retrieval: []
      });
    }

    const leadFormIntro = buildLeadCaptureIntro(plannerResult);
    const saveError = await saveAssistantReply(leadFormIntro, {
      lead_partial: true,
      intent,
      planner: plannerResult,
      decision
    });

    if (saveError) {
      return saveError;
    }

    return widgetJson(request, {
      conversationId: activeConversationId,
      answer: leadFormIntro,
      fallback: false,
      leadCaptured: false,
      leadCaptureForm: getLeadCaptureFormPayload(leadFields),
      retrieval: []
    });
  }

  if (decision.step === "clarify" && plannerResult?.messageToVisitor) {
    answer = plannerResult.messageToVisitor;
  }

  const saveError = await saveAssistantReply(answer, {
    fallback: chunks.length === 0,
    intent,
    retrieval: chunks.map((chunk) => ({
      id: chunk.id,
      sourceTitle: chunk.sourceTitle,
      similarity: chunk.similarity
    })),
    planner: plannerResult,
    decision,
    integration_results: integrationResults,
    widget_actions: widgetActions,
    effective_visitor_message: effectiveVisitorMessage === body.message ? null : effectiveVisitorMessage
  });

  if (saveError) {
    return saveError;
  }

  return widgetJson(request, {
    conversationId: activeConversationId,
    answer,
    fallback: chunks.length === 0,
    integrationResults,
    widgetActions,
    retrieval: chunks.map((chunk) => ({
      sourceTitle: chunk.sourceTitle,
      similarity: chunk.similarity
    }))
  });
}

type WidgetIntegrationResult = {
  provider: EnabledIntegrationAction["provider"];
  actionType: EnabledIntegrationAction["actionType"];
  status: IntegrationActionResult["status"];
  externalRecordId: string | null;
  externalUrl: string | null;
  message: string | null;
  error: string | null;
};

type WidgetAction = {
  type: "booking";
  provider: "calendly";
  title: string;
  description: string;
  buttonLabel: string;
  url: string;
};

type ChatRoutingDecision = {
  step: AgentPlannerNextStep;
  confidence: number;
  source: "planner" | "rule";
  reason: string;
};

async function getPlannerResult({
  latestMessage,
  conversationMessages,
  chunks,
  leadFields,
  actions,
  agent
}: {
  latestMessage: string;
  conversationMessages: Array<{ role: string; content: string }>;
  chunks: Parameters<typeof planAgentNextStep>[0]["chunks"];
  leadFields: LeadCaptureField[];
  actions: EnabledIntegrationAction[];
  agent: Parameters<typeof planAgentNextStep>[0]["agent"];
}): Promise<AgentPlannerResult | null> {
  try {
    return await planAgentNextStep({
      latestMessage,
      conversationMessages,
      chunks,
      leadFields,
      availableActions: actions.map(toPlannerAction),
      agent
    });
  } catch (error) {
    console.error("Agent planner failed", error);
    return null;
  }
}

function toPlannerAction(action: EnabledIntegrationAction): AvailablePlannerAction {
  return {
    provider: action.provider,
    actionType: action.actionType,
    label: `${action.provider} ${action.actionType.replace(/_/g, " ")}`,
    requiredFields: action.requiredFields
  };
}

function decideChatNextStep({
  agentType,
  intent,
  message,
  conversationMessages,
  leadFields,
  plannerResult,
  actions,
  bookingRequested
}: {
  agentType: AgentType;
  intent: VisitorIntent;
  message: string;
  conversationMessages: Array<{ role: string; content: string }>;
  leadFields: LeadCaptureField[];
  plannerResult: AgentPlannerResult | null;
  actions: EnabledIntegrationAction[];
  bookingRequested: boolean;
}): ChatRoutingDecision {
  const normalizedMessage = message.toLowerCase();
  const hasBookingAction = hasCalendlyBookingAction(actions);
  const generalInformationQuestion = isGeneralInformationQuestion(normalizedMessage);
  const recentAssistantAskedConfiguredField = isAnsweringConfiguredLeadPrompt(conversationMessages, leadFields);
  const lastAssistant = findLastAssistantBeforeLatestVisitor(conversationMessages);
  const recentAssistantOfferedLead = lastAssistant ? assistantOfferedLeadCapture(lastAssistant.content) : false;
  const visitorProvidesLeadLike = visitorProvidesLeadDetails(normalizedMessage, leadFields);

  if (/^\s*lead capture details\s*:/i.test(message)) {
    return {
      step: "continue_lead_capture",
      confidence: 1,
      source: "rule",
      reason: "widget submitted lead capture details"
    };
  }

  if (generalInformationQuestion) {
    return {
      step: "answer_question",
      confidence: 1,
      source: "rule",
      reason: "visitor asked an informational question"
    };
  }

  if (bookingRequested && hasBookingAction) {
    return {
      step: "show_booking",
      confidence: 1,
      source: "rule",
      reason: "visitor asked to book and a booking action is available"
    };
  }

  if (
    plannerResult?.nextStep === "show_booking" &&
    hasBookingAction &&
    plannerResult.confidence >= 0.45
  ) {
    return {
      step: "show_booking",
      confidence: plannerResult.confidence,
      source: "planner",
      reason: "planner selected booking"
    };
  }

  if (recentAssistantAskedConfiguredField && visitorProvidesLeadLike) {
    return {
      step: "continue_lead_capture",
      confidence: 0.9,
      source: "rule",
      reason: "visitor is answering configured lead fields"
    };
  }

  if (intent === "provide_contact_info" && visitorProvidesLeadLike) {
    return {
      step: "continue_lead_capture",
      confidence: 0.88,
      source: "rule",
      reason: "visitor provided contact or project details"
    };
  }

  if (intent === "accept_follow_up" && recentAssistantOfferedLead) {
    return {
      step: "start_lead_capture",
      confidence: 0.82,
      source: "rule",
      reason: "visitor accepted an explicit follow-up offer"
    };
  }

  if (intent === "request_human_follow_up" && !bookingRequested) {
    return {
      step: "start_lead_capture",
      confidence: 0.84,
      source: "rule",
      reason: "visitor explicitly requested human follow-up"
    };
  }

  if (plannerResult && plannerResult.confidence >= 0.7) {
    if (plannerResult.nextStep === "start_lead_capture" || plannerResult.nextStep === "continue_lead_capture") {
      return {
        step: plannerResult.nextStep,
        confidence: plannerResult.confidence,
        source: "planner",
        reason: "planner selected lead capture"
      };
    }

    if (plannerResult.nextStep === "create_crm_contact" && visitorProvidesLeadLike) {
      return {
        step: "create_crm_contact",
        confidence: plannerResult.confidence,
        source: "planner",
        reason: "planner selected CRM contact creation"
      };
    }

    if (plannerResult.nextStep === "handoff" && (agentType === "sales" || intent === "request_human_follow_up")) {
      return {
        step: "handoff",
        confidence: plannerResult.confidence,
        source: "planner",
        reason: "planner selected handoff"
      };
    }

    if (plannerResult.nextStep === "clarify") {
      return {
        step: "clarify",
        confidence: plannerResult.confidence,
        source: "planner",
        reason: "planner needs clarification"
      };
    }
  }

  return {
    step: "answer_question",
    confidence: plannerResult?.confidence ?? 0.7,
    source: plannerResult ? "planner" : "rule",
    reason: "default to answering"
  };
}

function shouldRunLeadCaptureDecision(decision: ChatRoutingDecision) {
  return decision.step === "start_lead_capture" ||
    decision.step === "continue_lead_capture" ||
    decision.step === "create_crm_contact" ||
    decision.step === "handoff";
}

function findBookingAction({
  actions,
  plannerResult,
  message
}: {
  actions: EnabledIntegrationAction[];
  plannerResult: AgentPlannerResult | null;
  message: string;
}) {
  const calendlyAction = actions.find(
    (action) => action.provider === "calendly" && action.actionType === "show_booking_link"
  );

  if (!calendlyAction) {
    return null;
  }

  const plannedBooking =
    plannerResult?.nextAction?.type === "show_booking_link" &&
    (!plannerResult.nextAction.provider || plannerResult.nextAction.provider === "calendly") &&
    plannerResult.confidence >= 0.45;

  if (plannedBooking) {
    return calendlyAction;
  }

  if (plannerResult?.visitorGoal === "book_appointment" && plannerResult.confidence >= 0.5) {
    return calendlyAction;
  }

  if (hasBookingLanguage(message)) {
    return calendlyAction;
  }

  return null;
}

function hasBookingLanguage(message: string) {
  const normalized = message.toLowerCase();

  return (
    /\b(?:book|booking|schedule|appointment|consultation|calendar|availability|openings?|slots?|demo)\b/.test(normalized) ||
    /\b(?:book|schedule|set up|reserve)\b[\s\S]{0,40}\b(?:call|meeting|demo|appointment|consultation|time)\b/.test(normalized) ||
    /\b(?:call|meeting|demo|appointment|consultation)\b[\s\S]{0,40}\b(?:book|schedule|set up|reserve)\b/.test(normalized)
  );
}

function hasCalendlyBookingAction(actions: EnabledIntegrationAction[]) {
  return actions.some(
    (action) => action.provider === "calendly" && action.actionType === "show_booking_link"
  );
}

function hasJobberLeadAction(actions: EnabledIntegrationAction[]) {
  return actions.some(
    (action) => action.provider === "jobber" && action.actionType === "submit_service_request"
  );
}

function hasHubSpotContactAction(actions: EnabledIntegrationAction[]) {
  return actions.some(
    (action) => action.provider === "hubspot" && action.actionType === "create_crm_contact"
  );
}

async function runLeadCapturedIntegrationActions({
  supabase,
  actions,
  requestUrl,
  payload
}: {
  supabase: ReturnType<typeof createSupabaseServiceClient>;
  actions: EnabledIntegrationAction[];
  requestUrl: string;
  payload: IntegrationActionPayload;
}) {
  const leadActions = actions.filter(
    (action) => action.triggerType === "lead_captured" ||
      (action.provider === "jobber" && action.actionType === "submit_service_request") ||
      (action.provider === "hubspot" && action.actionType === "create_crm_contact")
  );

  return Promise.all(
    leadActions.map(async (action) => {
      const result = await runIntegrationAction({
        supabase,
        action,
        requestUrl,
        payload
      });

      return toWidgetIntegrationResult(action, result);
    })
  );
}

function buildIntegrationActionPayload(payload: IntegrationActionPayload): IntegrationActionPayload {
  return {
    ...payload,
    conversationId: payload.conversationId ?? null,
    leadId: payload.leadId ?? null,
    sourcePageUrl: payload.sourcePageUrl ?? null,
    lead: {
      ...payload.lead,
      name: payload.lead.name ?? null,
      email: payload.lead.email ?? null,
      phone: payload.lead.phone ?? null,
      question: payload.lead.question ?? null,
      metadata: payload.lead.metadata ?? {}
    }
  };
}

function toWidgetIntegrationResult(
  action: EnabledIntegrationAction,
  result: IntegrationActionResult
): WidgetIntegrationResult {
  return {
    provider: action.provider,
    actionType: action.actionType,
    status: result.status,
    externalRecordId: result.externalRecordId ?? null,
    externalUrl: result.externalUrl ?? null,
    message: result.message ?? null,
    error: result.error ?? null
  };
}

function buildBookingActionAnswer(plannerResult: AgentPlannerResult | null) {
  const plannedMessage = plannerResult?.messageToVisitor?.trim();

  if (plannedMessage && (plannerResult?.confidence ?? 0) >= 0.45) {
    return plannedMessage;
  }

  return "Absolutely. You can choose an available time below.";
}

function buildMissingBookingActionAnswer(plannerResult: AgentPlannerResult | null) {
  const plannedMessage = plannerResult?.messageToVisitor?.trim();

  if (plannedMessage && (plannerResult?.confidence ?? 0) >= 0.6) {
    return plannedMessage;
  }

  return "I can help with scheduling, but online booking is not connected right now.";
}

function buildLeadCaptureIntro(plannerResult: AgentPlannerResult | null) {
  const plannedMessage = plannerResult?.messageToVisitor?.trim();

  if (plannedMessage && (plannerResult?.confidence ?? 0) >= 0.7) {
    return plannedMessage;
  }

  return "I can collect those details and pass them to the team for follow-up.";
}

function getLeadCaptureFormPayload(fields: LeadCaptureField[]) {
  const enabledFields = fields.filter((field) => field.enabled);

  if (enabledFields.length === 0) {
    return null;
  }

  return {
    title: "Share your details",
    description: "Send these once and the team will have everything they need to follow up.",
    fields: enabledFields.map(({ key, label, type, prompt }) => ({
      key,
      label,
      type,
      required: true,
      prompt
    }))
  };
}

async function getExistingConversationId({
  supabase,
  conversationId,
  organizationId,
  botId
}: {
  supabase: ReturnType<typeof createSupabaseServiceClient>;
  conversationId?: string;
  organizationId: string;
  botId: string;
}) {
  if (!conversationId) {
    return null;
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("organization_id", organizationId)
    .eq("bot_id", botId)
    .maybeSingle();

  return conversation?.id ?? null;
}

function getCreditLimitReply(_reason: "past_due" | "inactive" | "limit_reached" | "ok") {
  return "I cannot answer messages right now. Please contact the business directly for help.";
}

function resolveAcceptedFollowUpMessage(
  message: string,
  conversationMessages: Array<{ role: string; content: string }>
) {
  if (!isShortAcceptance(message)) {
    return message;
  }

  const lastAssistant = findLastAssistantBeforeLatestVisitor(conversationMessages);
  const offeredTopic = lastAssistant ? extractOfferedFollowUpTopic(lastAssistant.content) : null;

  return offeredTopic ?? message;
}

function isShortAcceptance(message: string) {
  return /^(?:yes|yeah|yep|sure|ok|okay|please|yes please|yeah please|sure please|do that|yes do that|yes please do that|please do that|that sounds good|sounds good|go ahead|show me|show me that|tell me|tell me more)$/i.test(
    message.trim()
  );
}

function extractOfferedFollowUpTopic(message: string) {
  const normalized = message.replace(/[’]/g, "'").replace(/\s+/g, " ").trim();
  const specificTopic = getSpecificOfferedTopic(normalized);

  if (specificTopic) {
    return specificTopic;
  }

  const offerMatch = normalized.match(
    /\b(?:if you want,\s*)?(?:i can also|i can|i can help|would you like me to|do you want me to)\s+(.+?)(?:[.!?]|$)/i
  );
  const rawTopic = offerMatch?.[1]?.trim();

  if (!rawTopic || isGenericOffer(rawTopic)) {
    return null;
  }

  return `Please ${rawTopic}.`;
}

function getSpecificOfferedTopic(message: string) {
  if (/\b(?:explain|show|share|tell you about)\b[\s\S]{0,80}\b(?:demo|booking|scheduling)\b[\s\S]{0,60}\b(?:works?|process)\b/i.test(message)) {
    return "Please explain how demo booking works.";
  }

  if (/\b(?:outline|explain|show|share|tell you about)\b[\s\S]{0,80}\b(?:what's|what is) included in each plan\b/i.test(message)) {
    return "Please outline what is included in each plan.";
  }

  if (/\b(?:outline|explain|show|share|tell you about)\b[\s\S]{0,80}\bwhat each plan includes\b/i.test(message)) {
    return "Please outline what each plan includes.";
  }

  return null;
}

function isGenericOffer(topic: string) {
  return /\b(?:help|help with|answer|questions?|anything else|other questions?|what you need)\b/i.test(topic) &&
    !/\b(?:pricing|price|cost|plans?|included|includes|services?|hours|booking|demo|availability)\b/i.test(topic);
}

function isGeneralInformationQuestion(message: string) {
  const asksBookingProcessInfo =
    /\b(?:how|what|explain|show|share|tell me)\b[\s\S]{0,90}\b(?:demo|booking|book|scheduler|scheduling)\b[\s\S]{0,70}\b(?:works?|process)\b/.test(message) ||
    /\b(?:demo|booking|book|scheduler|scheduling)\b[\s\S]{0,70}\b(?:works?|process)\b/.test(message);

  if (asksBookingProcessInfo) {
    return true;
  }

  const asksGeneralInfo =
    /\b(?:what|which|do you|can you|could you|tell me|show me|list)\b[\s\S]{0,80}\b(?:service|services|offer|offers|provide|do)\b/.test(message) ||
    /\b(?:what|which)\b[\s\S]{0,80}\b(?:hours|locations|areas|policies|features)\b/.test(message);
  const asksForNextStep =
    /\b(?:quote|estimate|book|booking|schedule|appointment|consultation|demo|callback|call me|contact me|email me|talk to sales|talk to someone|speak to someone|human|follow up|sign up|buy|start)\b/.test(message);

  return asksGeneralInfo && !asksForNextStep;
}

function visitorProvidesLeadDetails(message: string, fields: LeadCaptureField[]) {
  if (isGeneralInformationQuestion(message)) {
    return false;
  }

  return mentionsConfiguredLeadField(message, fields) ||
    /@|(?:\+?\d[\d\s().-]{6,})|\b(?:my name is|name is|i am|i'm|call me|email me|contact me|company|timeline|budget|date|tomorrow|today|next week|january|february|march|april|may|june|july|august|september|october|november|december|20\d{2}|\d{2,5}\s*(?:sq\s*ft|sqft|square feet|sf))\b/.test(message);
}

function mentionsConfiguredLeadField(message: string, fields: LeadCaptureField[]) {
  if (isGeneralInformationQuestion(message)) {
    return false;
  }

  return fields
    .filter((field) => field.enabled)
    .some((field) => {
      const label = normalizePromptText(field.label);
      const key = normalizePromptText(field.key.replace(/_/g, " "));

      return Boolean(
        (label && new RegExp(`\\b${escapeRegExp(label)}\\b`, "i").test(message)) ||
          (key && new RegExp(`\\b${escapeRegExp(key)}\\b`, "i").test(message))
      );
    });
}

function assistantOfferedLeadCapture(message: string) {
  return /\b(?:quote|estimate|callback|call you|follow up|reach out|send this to|share your details|best email|contact details|pass this along|connect you|someone can help|someone who can help|team can follow up|team follow up)\b/i.test(
    message
  );
}

function isAnsweringConfiguredLeadPrompt(messages: Array<{ role: string; content: string }>, fields: LeadCaptureField[]) {
  const lastAssistant = findLastAssistantBeforeLatestVisitor(messages);

  if (!lastAssistant) {
    return false;
  }

  const enabledFields = fields.filter((field) => field.enabled);
  const normalizedAssistant = normalizePromptText(lastAssistant.content);

  return enabledFields.some((field) => {
    const prompt = normalizePromptText(field.prompt);
    const label = normalizePromptText(field.label);

    return (
      Boolean(prompt && normalizedAssistant.includes(prompt)) ||
      new RegExp(`\\b(?:share|provide|send|what is|what's|what|which)\\b[\\s\\S]{0,120}\\b${escapeRegExp(label)}\\b`, "i").test(
        lastAssistant.content
      )
    );
  });
}

function findLastAssistantBeforeLatestVisitor(messages: Array<{ role: string; content: string }>) {
  let sawLatestVisitor = false;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (!sawLatestVisitor) {
      if (message.role === "user") {
        sawLatestVisitor = true;
      }

      continue;
    }

    if (message.role === "assistant") {
      return message;
    }

    if (message.role === "user") {
      return null;
    }
  }

  return null;
}

function normalizePromptText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
