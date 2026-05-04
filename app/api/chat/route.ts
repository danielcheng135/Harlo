import { NextRequest, NextResponse } from "next/server";
import {
  getInvalidEmailReply,
  leadQuestionFromMessages
} from "@/lib/ai/lead-capture";
import { classifyVisitorIntent } from "@/lib/ai/intent";
import { generateAnswer, retrieveKnowledgeChunks } from "@/lib/ai/rag";
import { sendCreditLimitEmail } from "@/lib/billing/notifications";
import { getCreditUsageStatus, recordAssistantMessageUsage } from "@/lib/billing/usage";
import {
  buildConfiguredLeadReply,
  configuredLeadMetadata,
  extractLeadDraftFromMessages,
  isConfiguredLeadComplete,
  normalizeLeadFields
} from "@/lib/lead-fields";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { ChatRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ChatRequest;

  if (!body.botId || !body.message) {
    return NextResponse.json({ error: "botId and message are required." }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: bot, error: botError } = await supabase
    .from("bots")
    .select("id, organization_id, lead_capture_fields")
    .eq("id", body.botId)
    .single();

  if (botError || !bot) {
    return NextResponse.json({ error: "Chatbot not found." }, { status: 404 });
  }

  const botId = bot.id;
  const organizationId = bot.organization_id;
  let conversationId = body.conversationId;

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
      return NextResponse.json({ error: conversationError?.message ?? "Could not create conversation." }, { status: 500 });
    }

    conversationId = conversation.id;
  }

  if (!conversationId) {
    return NextResponse.json({ error: "Could not initialize conversation." }, { status: 500 });
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
      return NextResponse.json({ error: assistantMessageError?.message ?? "Could not save assistant message." }, { status: 500 });
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

  await supabase.from("messages").insert({
    conversation_id: activeConversationId,
    role: "user",
    content: body.message,
    metadata: {
      page_url: body.visitor?.pageUrl,
      referrer: body.visitor?.referrer
    }
  });

  const creditUsage = await getCreditUsageStatus(supabase, organizationId);

  if (!creditUsage.canReply) {
    const answer = getCreditLimitReply(creditUsage.reason);
    const saveError = await saveAssistantReply(answer, {
      billing_limit_reached: true,
      billing_reason: creditUsage.reason,
      credits_used: creditUsage.creditsUsed,
      credit_limit: creditUsage.creditLimit
    }, {
      recordUsage: false
    });

    if (saveError) {
      return saveError;
    }

    const creditLimitEmail = await sendCreditLimitEmail({
      supabase,
      organizationId,
      reason: creditUsage.reason,
      creditsUsed: creditUsage.creditsUsed,
      creditLimit: creditUsage.creditLimit
    }).catch((error) => {
      console.error("Could not send credit limit email", error);
      return { sent: false, skipped: "send_failed" };
    });

    return NextResponse.json({
      conversationId: activeConversationId,
      answer,
      fallback: false,
      leadCaptured: false,
      billingLimitReached: true,
      billingAlertSent: creditLimitEmail.sent === true,
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
  const retrievalQuery = conversationContext
    ? `${conversationContext}\nvisitor latest: ${body.message}`
    : body.message;
  const intent = await classifyVisitorIntent({
    message: body.message,
    conversationContext
  });

  const isCollectingLead =
    intent.intent === "provide_contact_info" ||
    intent.intent === "request_human_follow_up";

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

      return NextResponse.json({
        conversationId: activeConversationId,
        answer: invalidEmailReply,
        fallback: false,
        leadCaptured: false,
        retrieval: []
      });
    }

    const leadFields = normalizeLeadFields(bot.lead_capture_fields);
    const draft = extractLeadDraftFromMessages(leadConversationMessages, leadFields);
    const answer = buildConfiguredLeadReply(draft, leadFields);

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

      return NextResponse.json({
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

    return NextResponse.json({
      conversationId: activeConversationId,
      answer,
      fallback: false,
      leadCaptured: false,
      retrieval: []
    });
  }

  const chunks = await retrieveKnowledgeChunks({
    botId: body.botId,
    query: retrievalQuery
  });

  const answer = await generateAnswer({
    question: body.message,
    chunks,
    conversationContext,
    intent: intent.intent
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

  return NextResponse.json({
    conversationId: activeConversationId,
    answer,
    fallback: chunks.length === 0,
    retrieval: chunks.map((chunk) => ({
      sourceTitle: chunk.sourceTitle,
      similarity: chunk.similarity
    }))
  });
}


function getCreditLimitReply(_reason: "past_due" | "inactive" | "limit_reached" | "ok") {
  return "I cannot answer messages right now. Please contact the business directly for help.";
}
