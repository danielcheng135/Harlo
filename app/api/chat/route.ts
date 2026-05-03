import { NextRequest, NextResponse } from "next/server";
import {
  getInvalidEmailReply,
  leadQuestionFromMessages
} from "@/lib/ai/lead-capture";
import { classifyVisitorIntent } from "@/lib/ai/intent";
import { generateAnswer, retrieveKnowledgeChunks } from "@/lib/ai/rag";
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

  let conversationId = body.conversationId;

  if (!conversationId) {
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        organization_id: bot.organization_id,
        bot_id: bot.id,
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

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: body.message,
    metadata: {
      page_url: body.visitor?.pageUrl,
      referrer: body.visitor?.referrer
    }
  });

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
    const invalidEmailReply = getInvalidEmailReply(body.message);

    if (invalidEmailReply) {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: invalidEmailReply,
        metadata: {
          lead_partial: true,
          invalid_email: true,
          intent
        }
      });

      return NextResponse.json({
        conversationId,
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
        .eq("conversation_id", conversationId)
        .maybeSingle();
      const leadPayload = {
        organization_id: bot.organization_id,
        bot_id: bot.id,
        conversation_id: conversationId,
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

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: answer,
        metadata: {
          lead_captured: true,
          intent
        }
      });

      return NextResponse.json({
        conversationId,
        answer,
        fallback: false,
        leadCaptured: true,
        retrieval: []
      });
    }

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: answer,
      metadata: {
        lead_partial: true,
        intent
      }
    });

    return NextResponse.json({
      conversationId,
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

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: answer,
    metadata: {
      fallback: chunks.length === 0,
      intent,
      retrieval: chunks.map((chunk) => ({
        id: chunk.id,
        sourceTitle: chunk.sourceTitle,
        similarity: chunk.similarity
      }))
    }
  });

  return NextResponse.json({
    conversationId,
    answer,
    fallback: chunks.length === 0,
    retrieval: chunks.map((chunk) => ({
      sourceTitle: chunk.sourceTitle,
      similarity: chunk.similarity
    }))
  });
}
