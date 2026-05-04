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
      html: getEmailHtml({
        reason,
        organizationName,
        creditsUsed,
        creditLimit,
        renewsAt,
        bodyText
      })
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
    return `Harlo needs a billing update for ${organizationName}. The website chatbot is temporarily paused until billing is updated. Open billing to update payment details, change plans, or review add-ons.`;
  }

  if (reason === "inactive") {
    return `Harlo is not active for ${organizationName}. The website chatbot is temporarily paused. Open billing to manage your subscription, change plans, or review add-ons.`;
  }

  return `${organizationName} has used ${creditsUsed.toLocaleString()} of ${creditLimit.toLocaleString()} message credits for the current billing period. The website chatbot is temporarily paused until credits renew on ${renewsAt}, the plan is upgraded, or auto-recharge add-on credits are turned on.`;
}

function getEmailHtml({
  reason,
  organizationName,
  creditsUsed,
  creditLimit,
  renewsAt,
  bodyText
}: {
  reason: CreditUsageStatus["reason"];
  organizationName: string;
  creditsUsed: number;
  creditLimit: number;
  renewsAt: string;
  bodyText: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const billingUrl = `${appUrl.replace(/\/$/, "")}/dashboard/billing`;
  const isCreditLimit = reason === "limit_reached";
  const title = isCreditLimit
    ? "Message credits are used up"
    : reason === "past_due"
      ? "Billing needs attention"
      : "Subscription is inactive";
  const badge = isCreditLimit ? "Credit limit reached" : reason === "past_due" ? "Billing update needed" : "Subscription inactive";
  const usageLabel = creditLimit > 0
    ? `${creditsUsed.toLocaleString()} / ${creditLimit.toLocaleString()} credits used`
    : `${creditsUsed.toLocaleString()} credits used`;
  const usagePercent = creditLimit > 0 ? Math.min(100, Math.round((creditsUsed / creditLimit) * 100)) : 100;
  const escapedBillingUrl = escapeHtml(billingUrl);
  const assetBaseUrl = process.env.NEXT_PUBLIC_EMAIL_ASSET_URL ?? "https://harloai.co";
  const emailIconVersion = "20260503-logo-outline-3";
  const sparklesIconUrl = `${assetBaseUrl.replace(/\/$/, "")}/email/harlo-sparkles.png?v=${emailIconVersion}`;
  const autoRechargeIconUrl = `${assetBaseUrl.replace(/\/$/, "")}/email/auto-recharge.png?v=${emailIconVersion}`;

  return `
<div style="margin:0;padding:0;background:#f4f8f9;font-family:Inter,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f4f8f9;">
    <tr>
      <td align="center" style="padding:34px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;max-width:600px;background:#ffffff;border:1px solid #dce8ec;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,.08);">
          <tr>
            <td style="padding:24px 26px;background:#087f95;color:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <tr>
                  <td width="42" valign="top" style="padding:0 6px 20px 0;">
                    <img src="${escapeHtml(sparklesIconUrl)}" width="36" height="36" alt="Harlo" style="display:block;width:36px;height:36px;border-radius:8px;border:2px solid rgba(255,255,255,.58);box-shadow:inset 0 1px 0 rgba(255,255,255,.24);">
                  </td>
                  <td valign="top" style="padding:0 0 20px 0;">
                    <div style="font-size:20px;font-weight:800;line-height:1;color:#ffffff;">Harlo</div>
                    <div style="font-size:12px;color:#d7f1f4;margin-top:5px;">AI chatbot billing alert</div>
                  </td>
                </tr>
              </table>
              <div style="display:inline-block;border:1px solid rgba(255,255,255,.36);background:rgba(255,255,255,.14);border-radius:999px;padding:6px 10px;font-size:12px;font-weight:800;color:#ffffff;margin-bottom:12px;">${escapeHtml(badge)}</div>
              <h1 style="font-size:28px;line-height:1.12;margin:0 0 10px;font-weight:800;color:#ffffff;letter-spacing:0;">${escapeHtml(title)}</h1>
              <p style="font-size:15px;line-height:1.55;margin:0;color:#e8fbfd;">${escapeHtml(organizationName)} needs attention so the website chatbot can keep replying to visitors.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:26px;">
              <p style="font-size:15px;line-height:1.6;margin:0 0 20px;color:#334155;">${escapeHtml(bodyText)}</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border:1px solid #dce8ec;border-radius:14px;background:#f8fbfc;margin:0 0 18px;">
                <tr>
                  <td style="padding:16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      <tr>
                        <td valign="top" style="padding:0 12px 12px 0;">
                          <div style="font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">Current usage</div>
                          <div style="font-size:22px;line-height:1.2;font-weight:800;color:#111827;margin-top:5px;">${escapeHtml(usageLabel)}</div>
                        </td>
                        <td width="68" align="right" valign="top" style="padding:0 0 12px 0;">
                          <div style="display:inline-block;border-radius:999px;background:#e7f5f7;color:#087f95;padding:8px 11px;font-size:13px;font-weight:800;">${usagePercent}%</div>
                        </td>
                      </tr>
                    </table>
                    <div style="height:8px;background:#e2e8ee;border-radius:999px;overflow:hidden;line-height:8px;">
                      <div style="height:8px;width:${usagePercent}%;background:#087f95;border-radius:999px;line-height:8px;">&nbsp;</div>
                    </div>
                    <div style="font-size:12px;color:#64748b;margin-top:10px;">Credits renew on ${escapeHtml(renewsAt)}.</div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border:1px solid #dce8ec;border-radius:14px;background:#ffffff;margin:0 0 20px;">
                <tr>
                  <td width="56" valign="top" style="padding:15px 0 15px 16px;">
                    <img src="${escapeHtml(autoRechargeIconUrl)}" width="40" height="40" alt="Auto recharge" style="display:block;width:40px;height:40px;border-radius:8px;border:0;">
                  </td>
                  <td style="padding:14px 16px 14px 10px;">
                    <div style="font-size:14px;font-weight:800;color:#111827;margin-bottom:4px;">Prevent pauses with add-on credits</div>
                    <div style="font-size:13px;line-height:1.5;color:#52616f;">Turn on auto recharge in Billing to automatically add credits when usage runs out, or upgrade to a higher monthly credit limit.</div>
                  </td>
                </tr>
              </table>

              <a href="${escapedBillingUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;border-radius:10px;padding:12px 16px;font-size:14px;font-weight:800;">Open billing</a>
              <p style="font-size:12px;line-height:1.5;color:#64748b;margin:18px 0 0;">This alert is sent at most once every 24 hours.</p>
            </td>
          </tr>
        </table>
        <div style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px;">Sent by Harlo · <a href="https://harloai.co" style="color:#087f95;text-decoration:none;">harloai.co</a></div>
      </td>
    </tr>
  </table>
</div>`;
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
