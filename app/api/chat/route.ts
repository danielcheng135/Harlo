import { NextRequest } from "next/server";
import {
  getInvalidEmailReply,
  leadQuestionFromMessages
} from "@/lib/ai/lead-capture";
import { classifyVisitorIntent, type VisitorIntent } from "@/lib/ai/intent";
import { extractLeadDraftWithModel } from "@/lib/ai/lead-field-extraction";
import { generateAnswer, retrieveKnowledgeChunks } from "@/lib/ai/rag";
import { normalizeAgentType, type AgentType } from "@/lib/agents";
import { attemptAutoRecharge, isAutoRechargeFailureReason } from "@/lib/billing/auto-recharge";
import { sendAutoRechargeFailedEmail, sendCreditLimitEmail } from "@/lib/billing/notifications";
import { getCreditUsageStatus, recordAssistantMessageUsage } from "@/lib/billing/usage";
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
  const retrievalQuery = conversationContext
    ? `${conversationContext}\nvisitor latest: ${body.message}`
    : body.message;
  const intent = await classifyVisitorIntent({
    message: body.message,
    conversationContext
  });

  const isCollectingLead = shouldCollectLeadForAgent({
    agentType: agent.type,
    intent: intent.intent,
    message: body.message,
    conversationMessages,
    leadFields
  });

  if (isCollectingLead) {
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
        intent
      });

      if (saveError) {
        return saveError;
      }

      return widgetJson(request, {
        conversationId: activeConversationId,
        answer: invalidEmailReply,
        fallback: false,
        leadCaptured: false,
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

      if (existingLead) {
        await supabase.from("leads").update(leadPayload).eq("id", existingLead.id);
      } else {
        await supabase.from("leads").insert(leadPayload);
      }

      const saveError = await saveAssistantReply(answer, {
        lead_captured: true,
        intent
      });

      if (saveError) {
        return saveError;
      }

      return widgetJson(request, {
        conversationId: activeConversationId,
        answer,
        fallback: false,
        leadCaptured: true,
        retrieval: []
      });
    }

    const saveError = await saveAssistantReply(answer, {
      lead_partial: true,
      intent
    });

    if (saveError) {
      return saveError;
    }

    return widgetJson(request, {
      conversationId: activeConversationId,
      answer,
      fallback: false,
      leadCaptured: false,
      retrieval: []
    });
  }

  const chunks = await retrieveKnowledgeChunks({
    botId,
    organizationId,
    query: retrievalQuery
  });

  let answer = await generateAnswer({
    question: body.message,
    chunks,
    conversationContext,
    intent: intent.intent,
    agent
  });
  answer = appendLeadQuestionForContactAnswer({
    answer,
    intent: intent.intent,
    message: body.message,
    conversationMessages,
    leadFields
  });

  const saveError = await saveAssistantReply(answer, {
    fallback: chunks.length === 0,
    intent,
    retrieval: chunks.map((chunk) => ({
      id: chunk.id,
      sourceTitle: chunk.sourceTitle,
      similarity: chunk.similarity
    }))
  });

  if (saveError) {
    return saveError;
  }

  return widgetJson(request, {
    conversationId: activeConversationId,
    answer,
    fallback: chunks.length === 0,
    retrieval: chunks.map((chunk) => ({
      sourceTitle: chunk.sourceTitle,
      similarity: chunk.similarity
    }))
  });
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

function shouldCollectLeadForAgent({
  agentType,
  intent,
  message,
  conversationMessages,
  leadFields
}: {
  agentType: AgentType;
  intent: VisitorIntent;
  message: string;
  conversationMessages: Array<{ role: string; content: string }>;
  leadFields: LeadCaptureField[];
}) {
  const latest = message.toLowerCase();
  const recentAssistantAskedConfiguredField = isAnsweringConfiguredLeadPrompt(conversationMessages, leadFields);
  const lastAssistant = findLastAssistantBeforeLatestVisitor(conversationMessages);
  const recentAssistantOfferedLead = lastAssistant ? assistantOfferedLeadCapture(lastAssistant.content) : false;

  if (intent === "provide_contact_info" || intent === "request_human_follow_up") {
    return true;
  }

  if (intent === "accept_follow_up") {
    return recentAssistantAskedConfiguredField || recentAssistantOfferedLead;
  }

  const fieldSpecificAnswer = mentionsConfiguredLeadField(latest, leadFields);
  const visitorProvidesLeadLike =
    fieldSpecificAnswer ||
    /@|(?:\+?\d[\d\s().-]{6,})|\b(?:my name is|name is|i am|i'm|call me|email me|contact me|company|timeline|budget|date|tomorrow|today|next week|january|february|march|april|may|june|july|august|september|october|november|december|20\d{2}|\d{2,5}\s*(?:sq\s*ft|sqft|square feet|sf))\b/.test(latest);

  if (agentType === "support") {
    return (
      recentAssistantAskedConfiguredField ||
      visitorProvidesLeadLike ||
      /\b(?:quote|estimate|callback|call me|contact me|email me|book|booking|appointment|schedule|talk to a person|human|follow up|someone to help|speak to|talk to)\b/.test(latest)
    );
  }

  const buyingIntent =
    /\b(?:pricing|price|cost|budget|quote|estimate|demo|book|booking|appointment|schedule|consultation|hire|buy|start|sign up|talk to sales|call me|follow up|interested|looking for|need|want|available|availability|can you help|help me|ready)\b/.test(latest);

  return (
    recentAssistantAskedConfiguredField ||
    visitorProvidesLeadLike ||
    (recentAssistantOfferedLead && (visitorProvidesLeadLike || buyingIntent)) ||
    ((agentType === "sales" || agentType === "custom") && buyingIntent)
  );
}

function appendLeadQuestionForContactAnswer({
  answer,
  intent,
  message,
  conversationMessages,
  leadFields
}: {
  answer: string;
  intent: VisitorIntent;
  message: string;
  conversationMessages: Array<{ role: string; content: string }>;
  leadFields: LeadCaptureField[];
}) {
  if (!shouldAppendLeadQuestion({ answer, intent, message, leadFields })) {
    return answer;
  }

  const prompt = buildConfiguredLeadReply({}, leadFields, conversationMessages);
  const trimmedAnswer = answer.trim();
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt || answerAlreadyAsksConfiguredLeadField(trimmedAnswer, leadFields)) {
    return answer;
  }

  return `${trimmedAnswer}\n\n${trimmedPrompt}`;
}

function shouldAppendLeadQuestion({
  answer,
  intent,
  message,
  leadFields
}: {
  answer: string;
  intent: VisitorIntent;
  message: string;
  leadFields: LeadCaptureField[];
}) {
  if (leadFields.filter((field) => field.enabled).length === 0) {
    return false;
  }

  if (intent === "request_human_follow_up") {
    return true;
  }

  const normalizedMessage = message.toLowerCase();
  const normalizedAnswer = answer.toLowerCase();
  const visitorAskedAboutContact =
    /\b(?:contact|reach|email|call|phone|text|message|speak|talk)\b[\s\S]{0,80}\b(?:you|someone|team|person|human|representative|rep|agent|business|company)\b/.test(
      normalizedMessage
    ) ||
    /\b(?:how|where|who|what)\b[\s\S]{0,80}\b(?:contact|reach|call|email|message|speak|talk)\b/.test(normalizedMessage);
  const answerOffersContact =
    /\b(?:contact|reach out|call|email|speak with|talk with|someone can help|team can follow up|pass this along|share your details|collect .*details)\b/.test(
      normalizedAnswer
    );

  return visitorAskedAboutContact || answerOffersContact;
}

function answerAlreadyAsksConfiguredLeadField(answer: string, fields: LeadCaptureField[]) {
  return fields
    .filter((field) => field.enabled)
    .some((field) => {
      const prompt = normalizePromptText(field.prompt);
      const label = normalizePromptText(field.label);
      const normalizedAnswer = normalizePromptText(answer);

      return (
        Boolean(prompt && normalizedAnswer.includes(prompt)) ||
        new RegExp(`\\b(?:share|provide|send|what is|what's|what|which)\\b[\\s\\S]{0,120}\\b${escapeRegExp(label)}\\b`, "i").test(
          answer
        )
      );
    });
}

function mentionsConfiguredLeadField(message: string, fields: LeadCaptureField[]) {
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
  return /\b(?:quote|estimate|callback|call you|follow up|reach out|book|booking|appointment|consultation|send this to|share your details|best email|contact details|pass this along|connect you|someone can help|someone who can help|team can follow up|team follow up)\b/i.test(
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
