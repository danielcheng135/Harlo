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
  getConnectedCalcomBookingAction,
  getConnectedCalendlyBookingAction,
  getConnectedHubSpotContactAction,
  getConnectedJobberLeadAction,
  getConnectedMailchimpContactAction,
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

type SupabaseServiceClient = ReturnType<typeof createSupabaseServiceClient>;
type AgentSourceChannel = "website";

export type AgentMessageSource = {
  channel: AgentSourceChannel;
  integrationChannelId?: string | null;
  externalThreadId?: string | null;
  externalSenderId?: string | null;
  externalProfile?: Record<string, unknown> | null;
};

export type AgentMessageResult = {
  conversationId: string;
  answer: string;
  fallback: boolean;
  leadCaptured: boolean;
  billingLimitReached?: boolean;
  billingAlertSent?: boolean;
  autoRechargeSkipped?: string | null;
  autoRechargePaymentIntentId?: string | null;
  assistantMessageSaved: boolean;
  integrationResults?: WidgetIntegrationResult[];
  widgetActions?: WidgetAction[];
  leadCaptureForm?: ReturnType<typeof getLeadCaptureFormPayload>;
  retrieval: Array<{
    sourceTitle: string;
    similarity?: number;
  }>;
};

export type ProcessAgentMessageInput = {
  supabase?: SupabaseServiceClient;
  botId: string;
  message: string;
  requestUrl: string;
  conversationId?: string | null;
  visitor?: {
    anonymousId?: string | null;
    pageUrl?: string | null;
    referrer?: string | null;
  };
  source?: AgentMessageSource;
  aiAutoReply?: boolean;
  leadCaptureEnabled?: boolean;
  leadCaptureMode?: "widget_form" | "conversational";
  messageMetadata?: Record<string, unknown>;
};

export async function processAgentMessage(input: ProcessAgentMessageInput): Promise<AgentMessageResult> {
  const supabase = input.supabase ?? createSupabaseServiceClient();
  const { data: bot, error: botError } = await supabase
    .from("bots")
    .select("id, organization_id, agent_type, description, system_instructions, handoff_instructions, lead_capture_fields")
    .eq("id", input.botId)
    .eq("status", "active")
    .single();

  if (botError || !bot) {
    throw new Error("Chatbot not found.");
  }

  const botId = bot.id;
  const organizationId = bot.organization_id;
  const source = normalizeAgentMessageSource(input.source);
  const leadFields = normalizeLeadFields(bot.lead_capture_fields);
  const leadCaptureEnabled = input.leadCaptureEnabled !== false;
  const leadCaptureMode = input.leadCaptureMode ?? "widget_form";
  const agent = {
    type: normalizeAgentType(bot.agent_type),
    description: typeof bot.description === "string" ? bot.description : "",
    systemInstructions: typeof bot.system_instructions === "string" ? bot.system_instructions : "",
    handoffInstructions: typeof bot.handoff_instructions === "string" ? bot.handoff_instructions : ""
  };

  const conversationId = await getOrCreateConversationId({
    supabase,
    conversationId: input.conversationId ?? undefined,
    organizationId,
    botId,
    visitor: input.visitor,
    source
  });

  if (!conversationId) {
    throw new Error("Could not initialize conversation.");
  }

  const visitorMetadata = {
    page_url: input.visitor?.pageUrl,
    referrer: input.visitor?.referrer,
    source_channel: source.channel,
    integration_channel_id: source.integrationChannelId,
    external_thread_id: source.externalThreadId,
    external_sender_id: source.externalSenderId,
    external_profile: source.externalProfile,
    ...(input.messageMetadata ?? {})
  };

  const { error: visitorMessageError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: input.message,
    metadata: compactRecord(visitorMetadata)
  });

  if (visitorMessageError) {
    throw new Error(visitorMessageError.message);
  }

  if (input.aiAutoReply === false) {
    return {
      conversationId,
      answer: "",
      fallback: false,
      leadCaptured: false,
      assistantMessageSaved: false,
      retrieval: []
    };
  }

  async function saveAssistantReply(content: string, metadata: Record<string, unknown>, options: { recordUsage?: boolean } = {}) {
    const { data: assistantMessage, error: assistantMessageError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content,
      metadata: compactRecord({
        ...metadata,
        source_channel: source.channel,
        integration_channel_id: source.integrationChannelId,
        external_thread_id: source.externalThreadId
      })
    }).select("id").single();

    if (assistantMessageError || !assistantMessage) {
      throw new Error(assistantMessageError?.message ?? "Could not save assistant message.");
    }

    if (options.recordUsage !== false) {
      await recordAssistantMessageUsage({
        supabase,
        organizationId,
        botId,
        conversationId,
        messageId: assistantMessage.id
      });
    }
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
    await saveAssistantReply(answer, {
      billing_limit_reached: true,
      billing_reason: creditUsage.reason,
      credits_used: creditUsage.creditsUsed,
      credit_limit: creditUsage.creditLimit,
      auto_recharge_skipped: autoRechargeSkipped,
      auto_recharge_payment_intent_id: autoRechargePaymentIntentId
    }, {
      recordUsage: false
    });

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

    return {
      conversationId,
      answer,
      fallback: false,
      leadCaptured: false,
      billingLimitReached: true,
      billingAlertSent: billingAlert.sent === true,
      autoRechargeSkipped,
      autoRechargePaymentIntentId,
      assistantMessageSaved: true,
      retrieval: []
    };
  }

  const { data: recentMessages } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
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
  const effectiveVisitorMessage = resolveAcceptedFollowUpMessage(input.message, conversationMessages);
  const retrievalQuery = conversationContext
    ? `${conversationContext}\nvisitor latest: ${effectiveVisitorMessage}`
    : effectiveVisitorMessage;
  const [intent, loadedIntegrationActions] = await Promise.all([
    classifyVisitorIntent({
      message: input.message,
      conversationContext
    }),
    getEnabledIntegrationActionsForBot({
      supabase,
      organizationId,
      botId,
      requestUrl: input.requestUrl
    })
  ]);
  let integrationActions = loadedIntegrationActions;
  const bookingRequested = hasBookingLanguage(effectiveVisitorMessage);

  if (bookingRequested && !hasBookingAction(integrationActions)) {
    const calendlyFallbackAction = await getConnectedCalendlyBookingAction({
      supabase,
      organizationId,
      requestUrl: input.requestUrl
    });
    const calcomFallbackAction = await getConnectedCalcomBookingAction({
      supabase,
      organizationId,
      requestUrl: input.requestUrl
    });

    if (calendlyFallbackAction) {
      integrationActions = [calendlyFallbackAction, ...integrationActions];
    }

    if (calcomFallbackAction) {
      integrationActions = [...integrationActions, calcomFallbackAction];
    }
  }

  if (!hasJobberLeadAction(integrationActions)) {
    const jobberFallbackAction = await getConnectedJobberLeadAction({
      supabase,
      organizationId,
      requestUrl: input.requestUrl
    });

    if (jobberFallbackAction) {
      integrationActions = [...integrationActions, jobberFallbackAction];
    }
  }

  if (!hasHubSpotContactAction(integrationActions)) {
    const hubSpotFallbackAction = await getConnectedHubSpotContactAction({
      supabase,
      organizationId,
      requestUrl: input.requestUrl
    });

    if (hubSpotFallbackAction) {
      integrationActions = [...integrationActions, hubSpotFallbackAction];
    }
  }

  if (!hasMailchimpContactAction(integrationActions)) {
    const mailchimpFallbackAction = await getConnectedMailchimpContactAction({
      supabase,
      organizationId,
      requestUrl: input.requestUrl
    });

    if (mailchimpFallbackAction) {
      integrationActions = [...integrationActions, mailchimpFallbackAction];
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
      requestUrl: input.requestUrl,
      payload: buildIntegrationActionPayload({
        organizationId,
        botId,
        conversationId,
        visitorMessage: effectiveVisitorMessage,
        lead: {},
        sourcePageUrl: input.visitor?.pageUrl ?? null
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
      const bookingOptions = normalizeBookingOptions(bookingResult.metadata?.bookingOptions);

      if (bookingOptions.length > 0) {
        widgetActions.push(...bookingOptions.map((option) => ({
          type: "booking" as const,
          provider: bookingAction.provider,
          title: option.name,
          description: option.durationLabel
            ? `${option.durationLabel} via ${getBookingProviderName(bookingAction.provider)}.`
            : getBookingActionDescription(bookingAction.provider),
          buttonLabel: "Open scheduler",
          url: option.url
        })));
      } else {
        widgetActions.push({
          type: "booking",
          provider: bookingAction.provider,
          title: "Book a time",
          description: getBookingActionDescription(bookingAction.provider),
          buttonLabel: "Open scheduler",
          url: bookingResult.externalUrl
        });
      }
    }
  } else if (decision.step === "show_booking") {
    answer = buildMissingBookingActionAnswer(plannerResult);
  }

  if (widgetActions.length === 0 && leadCaptureEnabled && shouldRunLeadCaptureDecision(decision)) {
    const { data: leadMessages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(50);
    const leadConversationMessages = (leadMessages ?? []).map((message) => ({
      role: message.role,
      content: message.content
    }));
    const userMessages = leadConversationMessages
      .filter((message) => message.role === "user")
      .map((message) => message.content);
    const invalidEmailReply = getInvalidEmailReply(input.message);

    if (invalidEmailReply) {
      await saveAssistantReply(invalidEmailReply, {
        lead_partial: true,
        invalid_email: true,
        intent,
        planner: plannerResult,
        decision
      });

      return {
        conversationId,
        answer: invalidEmailReply,
        fallback: false,
        leadCaptured: false,
        assistantMessageSaved: true,
        leadCaptureForm: leadCaptureMode === "widget_form" ? getLeadCaptureFormPayload(leadFields) : null,
        retrieval: []
      };
    }

    const draft = await extractLeadDraftWithModel(leadConversationMessages, leadFields);
    const configuredLeadReply = buildConfiguredLeadReply(draft, leadFields, leadConversationMessages);

    if (isConfiguredLeadComplete(draft, leadFields) && draft.email) {
      const originalQuestion = leadQuestionFromMessages(userMessages, draft.email);
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id, metadata")
        .eq("conversation_id", conversationId)
        .maybeSingle();
      const leadPayload = {
        organization_id: organizationId,
        bot_id: botId,
        conversation_id: conversationId,
        name: draft.name ?? sourceProfileName(source.externalProfile) ?? "Website visitor",
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
        requestUrl: input.requestUrl,
        payload: buildIntegrationActionPayload({
          organizationId,
          botId,
          conversationId,
          leadId,
          visitorMessage: input.message,
          lead: {
            name: draft.name ?? sourceProfileName(source.externalProfile) ?? "Website visitor",
            email: draft.email,
            phone: draft.phone ?? sourceProfilePhone(source.externalProfile),
            question: originalQuestion,
            metadata: configuredLeadMetadata(draft, leadFields)
          },
          sourcePageUrl: input.visitor?.pageUrl ?? null
        })
      });

      await saveAssistantReply(configuredLeadReply, {
        lead_captured: true,
        intent,
        planner: plannerResult,
        decision,
        integration_results: leadIntegrationResults
      });

      return {
        conversationId,
        answer: configuredLeadReply,
        fallback: false,
        leadCaptured: true,
        assistantMessageSaved: true,
        integrationResults: leadIntegrationResults,
        retrieval: []
      };
    }

    const leadAnswer = leadCaptureMode === "conversational"
      ? configuredLeadReply
      : buildLeadCaptureIntro(plannerResult);
    await saveAssistantReply(leadAnswer, {
      lead_partial: true,
      intent,
      planner: plannerResult,
      decision
    });

    return {
      conversationId,
      answer: leadAnswer,
      fallback: false,
      leadCaptured: false,
      assistantMessageSaved: true,
      leadCaptureForm: leadCaptureMode === "widget_form" ? getLeadCaptureFormPayload(leadFields) : null,
      retrieval: []
    };
  }

  if (decision.step === "clarify" && plannerResult?.messageToVisitor) {
    answer = plannerResult.messageToVisitor;
  }

  await saveAssistantReply(answer, {
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
    effective_visitor_message: effectiveVisitorMessage === input.message ? null : effectiveVisitorMessage
  });

  return {
    conversationId,
    answer,
    fallback: chunks.length === 0,
    leadCaptured: false,
    assistantMessageSaved: true,
    integrationResults,
    widgetActions,
    retrieval: chunks.map((chunk) => ({
      sourceTitle: chunk.sourceTitle,
      similarity: chunk.similarity
    }))
  };
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

type BookingProvider = "calendly" | "calcom";

type BookingIntegrationAction = EnabledIntegrationAction & {
  provider: BookingProvider;
  actionType: "show_booking_link";
};

type WidgetAction = {
  type: "booking";
  provider: BookingProvider;
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

async function getOrCreateConversationId({
  supabase,
  conversationId,
  organizationId,
  botId,
  visitor,
  source
}: {
  supabase: SupabaseServiceClient;
  conversationId?: string;
  organizationId: string;
  botId: string;
  visitor?: ProcessAgentMessageInput["visitor"];
  source: Required<AgentMessageSource>;
}) {
  const existingConversationId = source.channel === "website"
    ? await getExistingWidgetConversationId({ supabase, conversationId, organizationId, botId })
    : await getExistingExternalConversationId({ supabase, organizationId, botId, source });

  if (existingConversationId) {
    return existingConversationId;
  }

  const insertPayload: Record<string, unknown> = {
    organization_id: organizationId,
    bot_id: botId,
    visitor_id: visitor?.anonymousId,
    page_url: visitor?.pageUrl
  };

  if (source.channel !== "website") {
    insertPayload.source_channel = source.channel;
    insertPayload.integration_channel_id = source.integrationChannelId;
    insertPayload.external_thread_id = source.externalThreadId;
    insertPayload.external_sender_id = source.externalSenderId;
    insertPayload.external_profile = source.externalProfile ?? {};
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert(insertPayload)
    .select("id")
    .single();

  if (conversationError || !conversation) {
    throw new Error(conversationError?.message ?? "Could not create conversation.");
  }

  return conversation.id as string;
}

async function getExistingWidgetConversationId({
  supabase,
  conversationId,
  organizationId,
  botId
}: {
  supabase: SupabaseServiceClient;
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

async function getExistingExternalConversationId({
  supabase,
  organizationId,
  botId,
  source
}: {
  supabase: SupabaseServiceClient;
  organizationId: string;
  botId: string;
  source: Required<AgentMessageSource>;
}) {
  if (!source.externalThreadId) {
    return null;
  }

  let query = supabase
    .from("conversations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("bot_id", botId)
    .eq("source_channel", source.channel)
    .eq("external_thread_id", source.externalThreadId);

  if (source.integrationChannelId) {
    query = query.eq("integration_channel_id", source.integrationChannelId);
  }

  const { data: conversation } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return conversation?.id ?? null;
}

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
  const hasAvailableBookingAction = hasBookingAction(actions);
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

  if (bookingRequested && hasAvailableBookingAction) {
    return {
      step: "show_booking",
      confidence: 1,
      source: "rule",
      reason: "visitor asked to book and a booking action is available"
    };
  }

  if (
    plannerResult?.nextStep === "show_booking" &&
    hasAvailableBookingAction &&
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
}): BookingIntegrationAction | null {
  const bookingActions = actions.filter(isBookingAction);
  const plannedProvider = plannerResult?.nextAction?.provider;
  const plannedAction = bookingActions.find((action) => action.provider === plannedProvider);
  const bookingAction = plannedAction ?? bookingActions[0];

  if (!bookingAction) {
    return null;
  }

  const plannedBooking =
    plannerResult?.nextAction?.type === "show_booking_link" &&
    (!plannerResult.nextAction.provider || bookingActions.some((action) => action.provider === plannerResult.nextAction?.provider)) &&
    plannerResult.confidence >= 0.45;

  if (plannedBooking) {
    return bookingAction;
  }

  if (plannerResult?.visitorGoal === "book_appointment" && plannerResult.confidence >= 0.5) {
    return bookingAction;
  }

  if (hasBookingLanguage(message)) {
    return bookingAction;
  }

  return null;
}

function getBookingActionDescription(provider: BookingProvider) {
  if (provider === "calcom") {
    return "Choose an available time in Cal.com without leaving this page.";
  }

  return "Choose an available time in Calendly without leaving this page.";
}

function getBookingProviderName(provider: BookingProvider) {
  return provider === "calcom" ? "Cal.com" : "Calendly";
}

function normalizeBookingOptions(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const name = typeof record.name === "string" && record.name.trim() ? record.name.trim() : null;
      const url = typeof record.url === "string" && record.url.trim() ? record.url.trim() : null;
      const durationLabel = typeof record.durationLabel === "string" && record.durationLabel.trim()
        ? record.durationLabel.trim()
        : null;

      return name && url ? { name, url, durationLabel } : null;
    })
    .filter((item): item is { name: string; url: string; durationLabel: string | null } => Boolean(item));
}

function hasBookingLanguage(message: string) {
  const normalized = message.toLowerCase();

  return (
    /\b(?:book|booking|schedule|appointment|consultation|calendar|availability|openings?|slots?|demo)\b/.test(normalized) ||
    /\b(?:book|schedule|set up|reserve)\b[\s\S]{0,40}\b(?:call|meeting|demo|appointment|consultation|time)\b/.test(normalized) ||
    /\b(?:call|meeting|demo|appointment|consultation)\b[\s\S]{0,40}\b(?:book|schedule|set up|reserve)\b/.test(normalized)
  );
}

function hasBookingAction(actions: EnabledIntegrationAction[]) {
  return actions.some(isBookingAction);
}

function isBookingAction(action: EnabledIntegrationAction): action is BookingIntegrationAction {
  return (action.provider === "calendly" || action.provider === "calcom") &&
    action.actionType === "show_booking_link";
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

function hasMailchimpContactAction(actions: EnabledIntegrationAction[]) {
  return actions.some(
    (action) => action.provider === "mailchimp" && action.actionType === "create_crm_contact"
  );
}

async function runLeadCapturedIntegrationActions({
  supabase,
  actions,
  requestUrl,
  payload
}: {
  supabase: SupabaseServiceClient;
  actions: EnabledIntegrationAction[];
  requestUrl: string;
  payload: IntegrationActionPayload;
}) {
  const leadActions = actions.filter(
    (action) => action.triggerType === "lead_captured" ||
      (action.provider === "jobber" && action.actionType === "submit_service_request") ||
      (action.provider === "hubspot" && action.actionType === "create_crm_contact") ||
      (action.provider === "mailchimp" && action.actionType === "create_crm_contact")
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
    fields: enabledFields.map(({ key, label, type, required, prompt }) => ({
      key,
      label,
      type,
      required,
      prompt
    }))
  };
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
  const normalized = message.replace(/[\u2019]/g, "'").replace(/\s+/g, " ").trim();
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

function normalizeAgentMessageSource(source: AgentMessageSource | undefined): Required<AgentMessageSource> {
  return {
    channel: source?.channel ?? "website",
    integrationChannelId: source?.integrationChannelId ?? null,
    externalThreadId: source?.externalThreadId ?? null,
    externalSenderId: source?.externalSenderId ?? null,
    externalProfile: source?.externalProfile ?? {}
  };
}

function sourceProfileName(profile: Record<string, unknown> | null | undefined) {
  return getString(profile?.name) ?? getString(profile?.username) ?? getString(profile?.handle);
}

function sourceProfilePhone(profile: Record<string, unknown> | null | undefined) {
  return getString(profile?.phone);
}

function normalizePromptText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function compactRecord(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined && value !== null)
  );
}
