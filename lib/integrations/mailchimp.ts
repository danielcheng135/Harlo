import type { OAuthTokenSet } from "@/lib/integrations/providers";

export type MailchimpAudienceOption = {
  id: string;
  name: string;
  memberCount: number | null;
};

export function getMailchimpMarketingApiBase(credentials: OAuthTokenSet) {
  const configuredEndpoint = getString(credentials.raw.api_endpoint);

  if (configuredEndpoint) {
    const trimmed = configuredEndpoint.replace(/\/$/, "");

    return trimmed.endsWith("/3.0") ? trimmed : `${trimmed}/3.0`;
  }

  const dc = getString(credentials.raw.dc) ?? getString(credentials.providerAccountId) ?? process.env.MAILCHIMP_SERVER_PREFIX?.trim();

  return dc ? `https://${dc}.api.mailchimp.com/3.0` : null;
}

export async function listMailchimpAudiences(credentials: OAuthTokenSet): Promise<MailchimpAudienceOption[]> {
  const apiBase = getMailchimpMarketingApiBase(credentials);

  if (!apiBase) {
    throw new Error("Mailchimp did not return an API data center. Reconnect Mailchimp and try again.");
  }

  const url = new URL(`${apiBase}/lists`);
  url.searchParams.set("count", "100");
  url.searchParams.set("fields", "lists.id,lists.name,lists.stats.member_count");

  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${credentials.accessToken}`,
      accept: "application/json"
    }
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || typeof payload !== "object") {
    throw new Error(getMailchimpErrorMessage(payload) ?? "Mailchimp audiences could not be loaded.");
  }

  const lists = Array.isArray((payload as { lists?: unknown }).lists)
    ? (payload as { lists: unknown[] }).lists
    : [];

  return lists
    .map((list) => {
      if (!list || typeof list !== "object") {
        return null;
      }

      const record = list as Record<string, unknown>;
      const stats = record.stats && typeof record.stats === "object" ? record.stats as Record<string, unknown> : null;
      const id = getString(record.id);
      const name = getString(record.name);
      const memberCount = typeof stats?.member_count === "number" ? stats.member_count : null;

      return id && name ? { id, name, memberCount } : null;
    })
    .filter((audience): audience is MailchimpAudienceOption => Boolean(audience));
}

export function getMailchimpErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  return getString(record.detail) ?? getString(record.title) ?? getString(record.message) ?? getString(record.error);
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
