type TeamInviteEmailInput = {
  to: string;
  inviteUrl: string;
  organizationName: string;
  inviterEmail: string | null;
  role: string;
};

export async function sendTeamInviteEmail({ to, inviteUrl, organizationName, inviterEmail, role }: TeamInviteEmailInput) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.TEAM_INVITE_FROM_EMAIL ?? process.env.BILLING_ALERT_FROM_EMAIL;

  if (!resendApiKey || !from) {
    return { sent: false, skipped: "email_not_configured" };
  }

  const subject = `You were invited to ${organizationName} on Harlo`;
  const roleLabel = role === "admin" ? "admin" : "member";
  const bodyText = `${inviterEmail ?? "A teammate"} invited you to join ${organizationName} on Harlo as a ${roleLabel}. Accept the invite here: ${inviteUrl}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: bodyText,
      html: getTeamInviteEmailHtml({ inviteUrl, organizationName, inviterEmail, roleLabel })
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Team invite email failed with ${response.status}: ${errorText}`);
  }

  return { sent: true, skipped: null };
}

function getTeamInviteEmailHtml({ inviteUrl, organizationName, inviterEmail, roleLabel }: { inviteUrl: string; organizationName: string; inviterEmail: string | null; roleLabel: string }) {
  const escapedInviteUrl = escapeHtml(inviteUrl);
  const escapedOrganizationName = escapeHtml(organizationName);
  const escapedInviterEmail = escapeHtml(inviterEmail ?? "A teammate");
  const escapedRoleLabel = escapeHtml(roleLabel);

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#eef6f7;font-family:Inter,Arial,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapedInviterEmail} invited you to join ${escapedOrganizationName} on Harlo.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef6f7;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border-radius:18px;overflow:hidden;background:#ffffff;border:1px solid #d9e6e8;">
            <tr>
              <td style="background:#087f95;padding:28px;color:#ffffff;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="width:44px;vertical-align:middle;"><div style="height:38px;width:38px;border-radius:10px;border:2px solid rgba(255,255,255,0.58);background:rgba(255,255,255,0.12);text-align:center;line-height:38px;font-size:18px;font-weight:800;">✦</div></td>
                    <td style="vertical-align:middle;padding-left:10px;"><div style="font-size:20px;font-weight:800;line-height:1;">Harlo</div><div style="font-size:12px;color:#d7f1f4;margin-top:5px;">Workspace invitation</div></td>
                  </tr>
                </table>
                <div style="display:inline-block;margin-top:24px;border-radius:999px;border:1px solid rgba(255,255,255,0.36);background:rgba(255,255,255,0.14);padding:6px 10px;font-size:12px;font-weight:800;">Team invite</div>
                <h1 style="margin:14px 0 0;font-size:30px;line-height:1.15;font-weight:850;letter-spacing:-0.02em;">Join ${escapedOrganizationName}</h1>
                <p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:#e8fbfd;">${escapedInviterEmail} invited you to help manage this Harlo workspace.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#263445;">You were invited as a <strong>${escapedRoleLabel}</strong>. Accept the invite to access conversations, leads, analytics, and the tools your role allows.</p>
                <div style="margin-top:24px;"><a href="${escapedInviteUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;border-radius:10px;padding:13px 18px;font-size:14px;font-weight:800;">Accept invite</a></div>
                <div style="margin-top:24px;border-radius:14px;border:1px solid #d9e6e8;background:#f8fbfb;padding:16px;"><p style="margin:0;font-size:13px;line-height:1.55;color:#526174;">If the button does not work, paste this link into your browser:</p><p style="margin:8px 0 0;font-size:12px;line-height:1.55;color:#087f95;word-break:break-all;">${escapedInviteUrl}</p></div>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#8aa0ad;">Sent by Harlo · <a href="https://harloai.co" style="color:#087f95;text-decoration:none;">harloai.co</a></p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
