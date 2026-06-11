import { NextRequest } from "next/server";
import { processAgentMessage } from "@/lib/ai/agent-message";
import { generateAnswer, retrieveKnowledgeChunks } from "@/lib/ai/rag";
import { normalizeAgentType } from "@/lib/agents";
import { attemptAutoRecharge } from "@/lib/billing/auto-recharge";
import { getCreditUsageStatus, recordAssistantMessageUsage } from "@/lib/billing/usage";
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
    .select("id, organization_id, agent_type, description, system_instructions, handoff_instructions, allowed_domains")
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

  if (body.testOnly) {
    return handleDashboardTestMessage({
      request,
      supabase,
      bot,
      message: body.message
    });
  }

  try {
    const result = await processAgentMessage({
      supabase,
      botId: bot.id,
      message: body.message,
      conversationId: body.conversationId,
      requestUrl: request.url,
      visitor: body.visitor,
      source: {
        channel: "website"
      },
      leadCaptureMode: "widget_form"
    });

    return widgetJson(request, {
      conversationId: result.conversationId,
      answer: result.answer,
      fallback: result.fallback,
      leadCaptured: result.leadCaptured,
      billingLimitReached: result.billingLimitReached,
      billingAlertSent: result.billingAlertSent,
      autoRechargeSkipped: result.autoRechargeSkipped,
      autoRechargePaymentIntentId: result.autoRechargePaymentIntentId,
      integrationResults: result.integrationResults,
      widgetActions: result.widgetActions,
      leadCaptureForm: result.leadCaptureForm,
      retrieval: result.retrieval
    });
  } catch (error) {
    return widgetJson(request, {
      error: error instanceof Error ? error.message : "Could not process chat message."
    }, { status: 500 });
  }
}

async function handleDashboardTestMessage({
  request,
  supabase,
  bot,
  message
}: {
  request: NextRequest;
  supabase: ReturnType<typeof createSupabaseServiceClient>;
  bot: {
    id: string;
    organization_id: string;
    agent_type: unknown;
    description: unknown;
    system_instructions: unknown;
    handoff_instructions: unknown;
  };
  message: string;
}) {
  const botId = bot.id;
  const organizationId = bot.organization_id;
  const agent = {
    type: normalizeAgentType(bot.agent_type),
    description: typeof bot.description === "string" ? bot.description : "",
    systemInstructions: typeof bot.system_instructions === "string" ? bot.system_instructions : "",
    handoffInstructions: typeof bot.handoff_instructions === "string" ? bot.handoff_instructions : ""
  };
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
      answer: getCreditLimitReply(),
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
    query: message
  });
  const answer = await generateAnswer({
    question: message,
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
    answer: answer.text,
    fallback: answer.needsReview,
    leadCaptured: false,
    retrieval: chunks.map((chunk) => ({
      sourceTitle: chunk.sourceTitle,
      similarity: chunk.similarity
    }))
  });
}

function getCreditLimitReply() {
  return "I cannot answer messages right now. Please contact the business directly for help.";
}
