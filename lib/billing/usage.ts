import { getPlanCreditLimit, type BillingPlanKey, type BillingStatus } from "@/lib/billing/plans";
import { INTERNAL_WORKSPACE_CREDIT_LIMIT, isInternalWorkspaceMetadata } from "@/lib/internal-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type SupabaseServiceClient = ReturnType<typeof createSupabaseServiceClient>;

type UsagePeriod = {
  start: string;
  end: string;
};

type CreditGrantRow = {
  id: string;
  credits_granted: number;
  credits_used: number;
  expires_at: string;
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

  return getFallbackUsagePeriod();
}

export type CreditUsageStatus = UsagePeriod & {
  status: BillingStatus;
  planKey: BillingPlanKey;
  creditsUsed: number;
  creditLimit: number;
  planCreditLimit: number;
  planCreditsUsed: number;
  planCreditsRemaining: number;
  addOnCreditsUsed: number;
  addOnCreditsAvailable: number;
  creditsRemaining: number;
  canReply: boolean;
  reason: "ok" | "past_due" | "inactive" | "limit_reached";
};

export async function getCreditUsageStatus(
  supabase: SupabaseServiceClient,
  organizationId: string
): Promise<CreditUsageStatus> {
  const [{ data: billing }, { data: organization }] = await Promise.all([
    supabase
      .from("organization_billing")
      .select("plan_key, status, current_period_start, current_period_end")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("metadata")
      .eq("id", organizationId)
      .maybeSingle()
  ]);
  const fallbackPeriod = getFallbackUsagePeriod();
  const isInternalWorkspace = isInternalWorkspaceMetadata(organization?.metadata);
  const planKey = isInternalWorkspace ? "pro" : normalizePlanKey(billing?.plan_key);
  const status = isInternalWorkspace ? "active" : normalizeBillingStatus(billing?.status);
  const start = typeof billing?.current_period_start === "string" ? billing.current_period_start : fallbackPeriod.start;
  const end = typeof billing?.current_period_end === "string" ? billing.current_period_end : fallbackPeriod.end;
  const planCreditLimit = isInternalWorkspace ? INTERNAL_WORKSPACE_CREDIT_LIMIT : getPlanCreditLimit(planKey, status);
  const [assistantCreditsUsed, addOnCreditsUsed, addOnCreditsAvailable] = await Promise.all([
    getAssistantCreditsUsed(supabase, organizationId, start, end),
    getAddOnCreditsUsed(supabase, organizationId, start, end),
    getAvailableGrantCredits(supabase, organizationId)
  ]);
  const planCreditsUsed = Math.max(0, assistantCreditsUsed - addOnCreditsUsed);
  const planCreditsRemaining = Math.max(0, planCreditLimit - planCreditsUsed);
  const creditsRemaining = planCreditsRemaining + addOnCreditsAvailable;
  const creditLimit = planCreditLimit + addOnCreditsUsed + addOnCreditsAvailable;
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
    creditsUsed: assistantCreditsUsed,
    creditLimit,
    planCreditLimit,
    planCreditsUsed,
    planCreditsRemaining,
    addOnCreditsUsed,
    addOnCreditsAvailable,
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
  credits = 1,
  metadata = {}
}: {
  supabase: SupabaseServiceClient;
  organizationId: string;
  botId: string;
  conversationId?: string | null;
  messageId?: string | null;
  credits?: number;
  metadata?: Record<string, unknown>;
}) {
  const period = await getUsagePeriodForOrganization(supabase, organizationId);
  const statusBeforeUsage = await getCreditUsageStatus(supabase, organizationId);
  const planCreditsConsumedByThisMessage = Math.min(credits, statusBeforeUsage.planCreditsRemaining);
  const addOnCreditsToConsume = Math.max(0, credits - planCreditsConsumedByThisMessage);

  const { data: usageEvent, error } = await supabase.from("usage_events").upsert({
    organization_id: organizationId,
    bot_id: botId,
    conversation_id: conversationId ?? null,
    message_id: messageId ?? null,
    event_type: "assistant_message",
    credits,
    billing_period_start: period.start,
    billing_period_end: period.end,
    metadata: { role: "assistant", ...metadata }
  }, {
    onConflict: "message_id",
    ignoreDuplicates: true
  }).select("id").maybeSingle();

  if (error) {
    console.error("Could not record assistant message usage", error);
    return;
  }

  if (usageEvent?.id && addOnCreditsToConsume > 0) {
    await consumeAddOnCreditGrants({
      supabase,
      organizationId,
      usageEventId: usageEvent.id,
      credits: addOnCreditsToConsume
    });
  }
}

export async function createAutoRechargeCreditGrant({
  supabase,
  organizationId,
  credits = 1000,
  stripePaymentIntentId,
  stripeInvoiceId,
  metadata = {}
}: {
  supabase: SupabaseServiceClient;
  organizationId: string;
  credits?: number;
  stripePaymentIntentId?: string | null;
  stripeInvoiceId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const grantedAt = new Date();
  const expiresAt = new Date(grantedAt);
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  return supabase.from("credit_grants").insert({
    organization_id: organizationId,
    source: "auto_recharge",
    credits_granted: credits,
    credits_used: 0,
    granted_at: grantedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    stripe_payment_intent_id: stripePaymentIntentId ?? null,
    stripe_invoice_id: stripeInvoiceId ?? null,
    metadata
  }).select("id").single();
}

async function consumeAddOnCreditGrants({
  supabase,
  organizationId,
  usageEventId,
  credits
}: {
  supabase: SupabaseServiceClient;
  organizationId: string;
  usageEventId: string;
  credits: number;
}) {
  let creditsToConsume = credits;
  const now = new Date().toISOString();
  const { data: grants } = await supabase
    .from("credit_grants")
    .select("id, credits_granted, credits_used, expires_at")
    .eq("organization_id", organizationId)
    .gt("expires_at", now)
    .order("expires_at", { ascending: true })
    .order("created_at", { ascending: true });

  for (const grant of ((grants ?? []) as CreditGrantRow[])) {
    if (creditsToConsume <= 0) {
      break;
    }

    const available = Math.max(0, grant.credits_granted - grant.credits_used);

    if (available <= 0) {
      continue;
    }

    const consumed = Math.min(available, creditsToConsume);
    const nextCreditsUsed = grant.credits_used + consumed;

    const { error: updateError } = await supabase
      .from("credit_grants")
      .update({
        credits_used: nextCreditsUsed,
        updated_at: new Date().toISOString()
      })
      .eq("id", grant.id)
      .eq("credits_used", grant.credits_used);

    if (updateError) {
      continue;
    }

    await supabase.from("credit_grant_usages").insert({
      organization_id: organizationId,
      credit_grant_id: grant.id,
      usage_event_id: usageEventId,
      credits: consumed
    });

    creditsToConsume -= consumed;
  }
}

async function getAssistantCreditsUsed(
  supabase: SupabaseServiceClient,
  organizationId: string,
  start: string,
  end: string
) {
  const { data: usageEvents } = await supabase
    .from("usage_events")
    .select("credits")
    .eq("organization_id", organizationId)
    .eq("event_type", "assistant_message")
    .gte("created_at", start)
    .lt("created_at", end);

  return sumCredits((usageEvents ?? []) as Array<{ credits: number }>);
}

async function getAddOnCreditsUsed(
  supabase: SupabaseServiceClient,
  organizationId: string,
  start: string,
  end: string
) {
  const { data: grantUsages } = await supabase
    .from("credit_grant_usages")
    .select("credits")
    .eq("organization_id", organizationId)
    .gte("created_at", start)
    .lt("created_at", end);

  return sumCredits((grantUsages ?? []) as Array<{ credits: number }>);
}

async function getAvailableGrantCredits(supabase: SupabaseServiceClient, organizationId: string) {
  const { data: grants } = await supabase
    .from("credit_grants")
    .select("credits_granted, credits_used")
    .eq("organization_id", organizationId)
    .gt("expires_at", new Date().toISOString());

  return ((grants ?? []) as Array<{ credits_granted: number; credits_used: number }>).reduce(
    (total, grant) => total + Math.max(0, grant.credits_granted - grant.credits_used),
    0
  );
}

function sumCredits(events: Array<{ credits: number }>) {
  return events.reduce((total, event) => total + event.credits, 0);
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
