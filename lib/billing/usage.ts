import { getPlanCreditLimit, type BillingPlanKey, type BillingStatus } from "@/lib/billing/plans";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type SupabaseServiceClient = ReturnType<typeof createSupabaseServiceClient>;

type UsagePeriod = {
  start: string;
  end: string;
};

export async function getUsagePeriodForOrganization(
  supabase: SupabaseServiceClient,
  organizationId: string
): Promise<UsagePeriod> {
  const { data } = await supabase
    .from("organization_billing")
    .select("current_period_start, current_period_end")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (data?.current_period_start && data?.current_period_end) {
    return {
      start: data.current_period_start,
      end: data.current_period_end
    };
  }

  const now = new Date();
  const start = new Date(now);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}


export type CreditUsageStatus = UsagePeriod & {
  status: BillingStatus;
  planKey: BillingPlanKey;
  creditsUsed: number;
  creditLimit: number;
  creditsRemaining: number;
  canReply: boolean;
  reason: "ok" | "past_due" | "inactive" | "limit_reached";
};

export async function getCreditUsageStatus(
  supabase: SupabaseServiceClient,
  organizationId: string
): Promise<CreditUsageStatus> {
  const { data: billing } = await supabase
    .from("organization_billing")
    .select("plan_key, status, current_period_start, current_period_end")
    .eq("organization_id", organizationId)
    .maybeSingle();
  const fallbackPeriod = getFallbackUsagePeriod();
  const planKey = normalizePlanKey(billing?.plan_key);
  const status = normalizeBillingStatus(billing?.status);
  const start = typeof billing?.current_period_start === "string" ? billing.current_period_start : fallbackPeriod.start;
  const end = typeof billing?.current_period_end === "string" ? billing.current_period_end : fallbackPeriod.end;
  const creditLimit = getPlanCreditLimit(planKey, status);
  const { data: usageEvents } = await supabase
    .from("usage_events")
    .select("credits")
    .eq("organization_id", organizationId)
    .gte("created_at", start)
    .lt("created_at", end);
  const creditsUsed = ((usageEvents ?? []) as Array<{ credits: number }>).reduce((total, event) => total + event.credits, 0);
  const creditsRemaining = Math.max(0, creditLimit - creditsUsed);
  const subscriptionCanReply = status === "active" || status === "trialing";
  const reason: CreditUsageStatus["reason"] = !subscriptionCanReply
    ? status === "past_due"
      ? "past_due"
      : "inactive"
    : creditsRemaining <= 0
      ? "limit_reached"
      : "ok";

  return {
    start,
    end,
    status,
    planKey,
    creditsUsed,
    creditLimit,
    creditsRemaining,
    canReply: reason === "ok",
    reason
  };
}

export async function recordAssistantMessageUsage({
  supabase,
  organizationId,
  botId,
  conversationId,
  messageId,
  credits = 1
}: {
  supabase: SupabaseServiceClient;
  organizationId: string;
  botId: string;
  conversationId: string;
  messageId: string;
  credits?: number;
}) {
  const period = await getUsagePeriodForOrganization(supabase, organizationId);

  await supabase.from("usage_events").upsert({
    organization_id: organizationId,
    bot_id: botId,
    conversation_id: conversationId,
    message_id: messageId,
    event_type: "assistant_message",
    credits,
    billing_period_start: period.start,
    billing_period_end: period.end
  }, {
    onConflict: "message_id",
    ignoreDuplicates: true
  });
}

function getFallbackUsagePeriod() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

function normalizePlanKey(value: unknown): BillingPlanKey {
  return value === "growth" || value === "pro" ? value : "starter";
}

function normalizeBillingStatus(value: unknown): BillingStatus {
  return value === "trialing" || value === "past_due" || value === "canceled" || value === "incomplete"
    ? value
    : "active";
}
