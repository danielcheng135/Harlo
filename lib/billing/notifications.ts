import { createSupabaseServiceClient } from "@/lib/supabase/server";

import type { CreditUsageStatus } from "@/lib/billing/usage";

type SupabaseServiceClient = ReturnType<typeof createSupabaseServiceClient>;

type MembershipRow = {
  user_id: string;
  role: string;
};

type CreditLimitEmailInput = {
  supabase: SupabaseServiceClient;
  organizationId: string;
  reason: CreditUsageStatus["reason"];
  creditsUsed: number;
  creditLimit: number;
};

const ALERT_THROTTLE_MS = 24 * 60 * 60 * 1000;

export async function sendCreditLimitEmail({
  supabase,
  organizationId,
  reason,
  creditsUsed,
  creditLimit
}: CreditLimitEmailInput) {
  if (reason === "ok") {
    return { sent: false, skipped: "credits_available" };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.BILLING_ALERT_FROM_EMAIL;

  if (!resendApiKey || !from) {
    return { sent: false, skipped: "email_not_configured" };
  }

  const [{ data: organization }, { data: billing }, { data: memberships }] = await Promise.all([
    supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .maybeSingle(),
    supabase
      .from("organization_billing")
      .select("last_credit_limit_email_at, current_period_end")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("memberships")
      .select("user_id, role")
      .eq("organization_id", organizationId)
  ]);

  const lastSentAt = typeof billing?.last_credit_limit_email_at === "string"
    ? new Date(billing.last_credit_limit_email_at).getTime()
    : 0;

  if (lastSentAt && Date.now() - lastSentAt < ALERT_THROTTLE_MS) {
    return { sent: false, skipped: "recently_sent" };
  }

  const recipients = await getRecipientEmails(supabase, (memberships ?? []) as MembershipRow[]);

  if (recipients.length === 0) {
    return { sent: false, skipped: "no_recipients" };
  }

  const organizationName = organization?.name ?? "your Harlo workspace";
  const renewsAt = typeof billing?.current_period_end === "string"
    ? formatDate(billing.current_period_end)
    : "your next billing period";
  const subject = getSubject(reason, organizationName);
  const bodyText = getEmailText({
    reason,
    organizationName,
    creditsUsed,
    creditLimit,
    renewsAt
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject,
      text: bodyText,
      html: getEmailHtml(bodyText)
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Credit limit email failed with ${response.status}: ${errorText}`);
  }

  await supabase
    .from("organization_billing")
    .update({ last_credit_limit_email_at: new Date().toISOString() })
    .eq("organization_id", organizationId);

  return { sent: true, skipped: null };
}

async function getRecipientEmails(supabase: SupabaseServiceClient, memberships: MembershipRow[]) {
  const preferredMembers = memberships.filter((membership) => membership.role === "owner" || membership.role === "admin");
  const membersToNotify = preferredMembers.length > 0 ? preferredMembers : memberships;
  const emails = await Promise.all(
    membersToNotify.map(async (membership) => {
      const { data } = await supabase.auth.admin.getUserById(membership.user_id);
      return data.user?.email ?? null;
    })
  );

  return Array.from(new Set(emails.filter((email): email is string => Boolean(email))));
}

function getSubject(reason: CreditUsageStatus["reason"], organizationName: string) {
  if (reason === "past_due") {
    return `Billing update needed for ${organizationName}`;
  }

  if (reason === "inactive") {
    return `Harlo is inactive for ${organizationName}`;
  }

  return `${organizationName} is out of Harlo credits`;
}

function getEmailText({
  reason,
  organizationName,
  creditsUsed,
  creditLimit,
  renewsAt
}: {
  reason: CreditUsageStatus["reason"];
  organizationName: string;
  creditsUsed: number;
  creditLimit: number;
  renewsAt: string;
}) {
  if (reason === "past_due") {
    return `Harlo needs a billing update for ${organizationName}. The website chatbot is temporarily paused until billing is updated. You can manage billing from the Harlo dashboard.`;
  }

  if (reason === "inactive") {
    return `Harlo is not active for ${organizationName}. The website chatbot is temporarily paused. You can manage your subscription from the Harlo dashboard.`;
  }

  return `${organizationName} has used ${creditsUsed.toLocaleString()} of ${creditLimit.toLocaleString()} message credits for the current billing period. The website chatbot is temporarily paused until credits renew on ${renewsAt} or the plan is upgraded.`;
}

function getEmailHtml(text: string) {
  return `<div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#111827"><h2 style="margin:0 0 12px">Harlo billing alert</h2><p style="margin:0 0 16px">${escapeHtml(text)}</p><p style="margin:0;color:#64748b;font-size:13px">This alert is sent at most once every 24 hours.</p></div>`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
