import { NextRequest, NextResponse } from "next/server";
import { sendCreditLimitEmail } from "@/lib/billing/notifications";
import { getCreditUsageStatus } from "@/lib/billing/usage";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const LOW_CREDIT_WARNING_PERCENT = 80;

type OrganizationBillingRow = {
  organization_id: string;
};

type OrganizationAddOnRow = {
  organization_id: string;
};

type MonitorResult = {
  organizationId: string;
  kind: "low" | "limit";
  creditsUsed: number;
  creditLimit: number;
  emailSent: boolean;
  skipped: string | null;
};

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: billingRows, error } = await supabase
    .from("organization_billing")
    .select("organization_id")
    .in("status", ["active", "trialing"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const uniqueOrganizationIds = Array.from(
    new Set(((billingRows ?? []) as OrganizationBillingRow[]).map((row) => row.organization_id).filter(Boolean))
  );

  if (uniqueOrganizationIds.length === 0) {
    return NextResponse.json({
      checked: 0,
      overLimit: 0,
      lowCredit: 0,
      autoRechargeSkipped: 0,
      emailsSent: 0,
      results: []
    });
  }

  const { data: autoRechargeRows, error: autoRechargeError } = await supabase
    .from("organization_add_ons")
    .select("organization_id")
    .eq("add_on_key", "auto_recharge_credits")
    .eq("enabled", true)
    .in("organization_id", uniqueOrganizationIds);

  if (autoRechargeError) {
    return NextResponse.json({ error: autoRechargeError.message }, { status: 500 });
  }

  const autoRechargeOrganizationIds = new Set(
    ((autoRechargeRows ?? []) as OrganizationAddOnRow[]).map((row) => row.organization_id).filter(Boolean)
  );
  const results: MonitorResult[] = [];

  for (const organizationId of uniqueOrganizationIds) {
    const usage = await getCreditUsageStatus(supabase, organizationId);
    const usagePercent = usage.creditLimit > 0 ? Math.round((usage.creditsUsed / usage.creditLimit) * 100) : 0;
    const shouldSendLimitAlert = usage.reason === "limit_reached";
    const lowCreditThresholdReached = usage.reason === "ok" && usagePercent >= LOW_CREDIT_WARNING_PERCENT;
    const autoRechargeEnabled = autoRechargeOrganizationIds.has(organizationId);
    const shouldSendLowCreditAlert = lowCreditThresholdReached && !autoRechargeEnabled;

    if (lowCreditThresholdReached && autoRechargeEnabled) {
      results.push({
        organizationId,
        kind: "low",
        creditsUsed: usage.creditsUsed,
        creditLimit: usage.creditLimit,
        emailSent: false,
        skipped: "auto_recharge_enabled"
      });
      continue;
    }

    if (!shouldSendLimitAlert && !shouldSendLowCreditAlert) {
      continue;
    }

    const alertKind = shouldSendLimitAlert ? "limit" : "low";
    const email = await sendCreditLimitEmail({
      supabase,
      organizationId,
      reason: usage.reason,
      creditsUsed: usage.creditsUsed,
      creditLimit: usage.creditLimit,
      kind: alertKind
    }).catch((sendError) => {
      console.error("Credit monitor email failed", { organizationId, alertKind, sendError });
      return { sent: false, skipped: "send_failed" };
    });

    results.push({
      organizationId,
      kind: alertKind,
      creditsUsed: usage.creditsUsed,
      creditLimit: usage.creditLimit,
      emailSent: email.sent === true,
      skipped: email.skipped ?? null
    });
  }

  return NextResponse.json({
    checked: uniqueOrganizationIds.length,
    overLimit: results.filter((result) => result.kind === "limit").length,
    lowCredit: results.filter((result) => result.kind === "low").length,
    autoRechargeSkipped: results.filter((result) => result.skipped === "auto_recharge_enabled").length,
    emailsSent: results.filter((result) => result.emailSent).length,
    results
  });
}
