import { getIntegrationOAuthConfig } from "@/lib/integrations/oauth";
import type { IntegrationProviderKey } from "@/lib/integrations/types";

const DEFAULT_JOBBER_GRAPHQL_VERSION = "2025-04-16";

export type OAuthTokenSet = {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  scope?: string | null;
  tokenType?: string | null;
  providerAccountId?: string | null;
  providerAccountName?: string | null;
  raw: Record<string, unknown>;
};

type AuthorizationInput = {
  provider: IntegrationProviderKey;
  requestUrl: string;
  state: string;
};

type TokenInput = {
  provider: IntegrationProviderKey;
  requestUrl: string;
  code: string;
};

type RefreshTokenInput = {
  provider: IntegrationProviderKey;
  requestUrl: string;
  tokenSet: OAuthTokenSet;
};

export function getProviderAuthorizationUrl({ provider, requestUrl, state }: AuthorizationInput) {
  const config = getIntegrationOAuthConfig(provider, requestUrl);

  if (!config) {
    return null;
  }

  const endpoint = getAuthorizationEndpoint(provider);

  if (!endpoint) {
    return null;
  }

  const url = new URL(endpoint);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);

  if (provider !== "slack" && provider !== "calcom") {
    url.searchParams.set("response_type", "code");
  }

  if (provider === "google_sheets") {
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("include_granted_scopes", "true");
  }

  if (config.scopes.length > 0) {
    url.searchParams.set("scope", formatScopes(provider, config.scopes));
  }

  return url.toString();
}

export async function exchangeProviderCode({ provider, requestUrl, code }: TokenInput): Promise<OAuthTokenSet> {
  const config = getIntegrationOAuthConfig(provider, requestUrl);

  if (!config) {
    throw new Error("OAuth is not configured for this provider.");
  }

  const endpoint = getTokenEndpoint(provider);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret
  });
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json"
    },
    body
  });
  const token = await parseProviderJson(response);

  if (!response.ok || isProviderError(provider, token)) {
    throw new Error(getProviderErrorMessage(provider, token, "Could not connect integration."));
  }

  return hydrateTokenSet(provider, normalizeTokenSet(provider, token));
}

export async function refreshProviderTokenIfNeeded({
  provider,
  requestUrl,
  tokenSet
}: RefreshTokenInput): Promise<OAuthTokenSet> {
  const tokenSetWithExpiry = tokenSet.expiresAt
    ? tokenSet
    : {
      ...tokenSet,
      expiresAt: getAccessTokenExpiresAt(tokenSet.accessToken)
    };

  if (!tokenSetWithExpiry.refreshToken || !shouldRefreshToken(tokenSetWithExpiry.expiresAt)) {
    return tokenSetWithExpiry;
  }

  const config = getIntegrationOAuthConfig(provider, requestUrl);

  if (!config) {
    return tokenSetWithExpiry;
  }

  const endpoint = getTokenEndpoint(provider);
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokenSetWithExpiry.refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret
  });
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json"
    },
    body
  });
  const token = await parseProviderJson(response);

  if (!response.ok || isProviderError(provider, token)) {
    throw new Error(getProviderErrorMessage(provider, token, "Could not refresh integration token."));
  }

  const refreshedTokenSet = normalizeTokenSet(provider, token);

  return hydrateTokenSet(provider, {
    ...tokenSetWithExpiry,
    ...refreshedTokenSet,
    refreshToken: refreshedTokenSet.refreshToken ?? tokenSetWithExpiry.refreshToken,
    providerAccountId: refreshedTokenSet.providerAccountId ?? tokenSetWithExpiry.providerAccountId,
    providerAccountName: refreshedTokenSet.providerAccountName ?? tokenSetWithExpiry.providerAccountName,
    raw: {
      ...tokenSetWithExpiry.raw,
      ...refreshedTokenSet.raw
    }
  });
}

export async function testProviderConnection(provider: IntegrationProviderKey, credentials: OAuthTokenSet) {
  if (provider === "calendly") {
    const response = await fetch("https://api.calendly.com/users/me", {
      headers: { authorization: `Bearer ${credentials.accessToken}` }
    });

    return response.ok;
  }

  if (provider === "calcom") {
    const response = await fetch("https://api.cal.com/v2/me", {
      headers: { authorization: `Bearer ${credentials.accessToken}` }
    });

    return response.ok;
  }

  if (provider === "slack") {
    const response = await fetch("https://slack.com/api/auth.test", {
      method: "POST",
      headers: {
        authorization: `Bearer ${credentials.accessToken}`,
        "content-type": "application/x-www-form-urlencoded"
      }
    });
    const payload = await response.json().catch(() => null) as { ok?: boolean } | null;

    return response.ok && payload?.ok === true;
  }

  if (provider === "hubspot") {
    const response = await fetch(`https://api.hubapi.com/oauth/v1/access-tokens/${encodeURIComponent(credentials.accessToken)}`);

    return response.ok;
  }

  if (provider === "jobber") {
    const response = await fetch("https://api.getjobber.com/api/graphql", {
      method: "POST",
      headers: getJobberHeaders(credentials.accessToken),
      body: JSON.stringify({ query: "{ account { id name } }" })
    });

    return response.ok;
  }

  if (provider === "mailchimp") {
    const apiEndpoint = getMailchimpApiEndpoint(credentials);

    if (!apiEndpoint) {
      return false;
    }

    const response = await fetch(`${apiEndpoint.replace(/\/3\.0\/?$/, "")}/3.0/`, {
      headers: { authorization: `Bearer ${credentials.accessToken}`, accept: "application/json" }
    });

    return response.ok;
  }

  if (provider === "google_sheets") {
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { authorization: `Bearer ${credentials.accessToken}`, accept: "application/json" }
    });

    return response.ok;
  }

  return false;
}

function getAuthorizationEndpoint(provider: IntegrationProviderKey) {
  if (provider === "calendly") {
    return "https://auth.calendly.com/oauth/authorize";
  }

  if (provider === "calcom") {
    return "https://app.cal.com/auth/oauth2/authorize";
  }

  if (provider === "slack") {
    return "https://slack.com/oauth/v2/authorize";
  }

  if (provider === "hubspot") {
    return "https://app.hubspot.com/oauth/authorize";
  }

  if (provider === "jobber") {
    return "https://api.getjobber.com/api/oauth/authorize";
  }

  if (provider === "mailchimp") {
    return "https://login.mailchimp.com/oauth2/authorize";
  }

  if (provider === "google_sheets") {
    return "https://accounts.google.com/o/oauth2/v2/auth";
  }

  return null;
}

function getTokenEndpoint(provider: IntegrationProviderKey) {
  if (provider === "calendly") {
    return "https://auth.calendly.com/oauth/token";
  }

  if (provider === "calcom") {
    return "https://api.cal.com/v2/auth/oauth2/token";
  }

  if (provider === "slack") {
    return "https://slack.com/api/oauth.v2.access";
  }

  if (provider === "hubspot") {
    return "https://api.hubapi.com/oauth/v3/token";
  }

  if (provider === "jobber") {
    return "https://api.getjobber.com/api/oauth/token";
  }

  if (provider === "mailchimp") {
    return "https://login.mailchimp.com/oauth2/token";
  }

  if (provider === "google_sheets") {
    return "https://oauth2.googleapis.com/token";
  }

  throw new Error("Unsupported OAuth provider.");
}

function formatScopes(provider: IntegrationProviderKey, scopes: string[]) {
  if (provider === "slack") {
    return scopes.join(",");
  }

  return scopes.join(" ");
}

async function parseProviderJson(response: Response) {
  const payload = await response.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    throw new Error("Provider returned an invalid OAuth response.");
  }

  return payload as Record<string, unknown>;
}

function isProviderError(provider: IntegrationProviderKey, payload: Record<string, unknown>) {
  if (provider === "slack") {
    return payload.ok === false;
  }

  return typeof payload.error === "string" && !payload.access_token;
}

function getProviderErrorMessage(provider: IntegrationProviderKey, payload: Record<string, unknown>, fallback: string) {
  if (provider === "slack" && typeof payload.error === "string") {
    return `Slack error: ${payload.error}`;
  }

  if (typeof payload.error_description === "string") {
    return payload.error_description;
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  return fallback;
}

function normalizeTokenSet(provider: IntegrationProviderKey, token: Record<string, unknown>): OAuthTokenSet {
  const accessToken = typeof token.access_token === "string" ? token.access_token : "";

  if (!accessToken) {
    throw new Error("Provider did not return an access token.");
  }

  return {
    accessToken,
    refreshToken: typeof token.refresh_token === "string" ? token.refresh_token : null,
    expiresAt: getExpiresAt(token),
    scope: typeof token.scope === "string" ? token.scope : null,
    tokenType: typeof token.token_type === "string" ? token.token_type : null,
    providerAccountId: getProviderAccountId(provider, token),
    providerAccountName: getProviderAccountName(provider, token),
    raw: token
  };
}

function getExpiresAt(token: Record<string, unknown>) {
  const expiresIn = typeof token.expires_in === "number" ? token.expires_in : null;

  if (expiresIn) {
    return new Date(Date.now() + expiresIn * 1000).toISOString();
  }

  return getAccessTokenExpiresAt(typeof token.access_token === "string" ? token.access_token : null);
}

function getAccessTokenExpiresAt(accessToken: string | null | undefined) {
  try {
    const payload = JSON.parse(Buffer.from(accessToken?.split(".")[1] ?? "", "base64url").toString("utf8")) as {
      exp?: number;
    };

    return typeof payload.exp === "number" ? new Date(payload.exp * 1000).toISOString() : null;
  } catch {
    return null;
  }
}

function shouldRefreshToken(expiresAt: string | null | undefined) {
  if (!expiresAt) {
    return false;
  }

  const expiresAtMs = new Date(expiresAt).getTime();

  if (!Number.isFinite(expiresAtMs)) {
    return false;
  }

  return expiresAtMs - Date.now() < 5 * 60 * 1000;
}

function getProviderAccountId(provider: IntegrationProviderKey, token: Record<string, unknown>) {
  if (provider === "slack") {
    const team = token.team && typeof token.team === "object" ? token.team as Record<string, unknown> : null;

    return typeof team?.id === "string" ? team.id : null;
  }

  if (provider === "hubspot") {
    return typeof token.hub_id === "number" ? String(token.hub_id) : null;
  }

  return null;
}

function getProviderAccountName(provider: IntegrationProviderKey, token: Record<string, unknown>) {
  if (provider === "slack") {
    const team = token.team && typeof token.team === "object" ? token.team as Record<string, unknown> : null;

    return typeof team?.name === "string" ? team.name : null;
  }

  return null;
}

async function hydrateTokenSet(provider: IntegrationProviderKey, tokenSet: OAuthTokenSet): Promise<OAuthTokenSet> {
  try {
    if (provider === "calendly") {
      const response = await fetch("https://api.calendly.com/users/me", {
        headers: { authorization: `Bearer ${tokenSet.accessToken}` }
      });
      const payload = await response.json().catch(() => null) as { resource?: { uri?: string; name?: string; email?: string } } | null;
      const resource = payload?.resource;

      return {
        ...tokenSet,
        providerAccountId: tokenSet.providerAccountId ?? resource?.uri ?? null,
        providerAccountName: tokenSet.providerAccountName ?? resource?.name ?? resource?.email ?? null
      };
    }

    if (provider === "calcom") {
      const response = await fetch("https://api.cal.com/v2/me", {
        headers: { authorization: `Bearer ${tokenSet.accessToken}` }
      });
      const payload = await response.json().catch(() => null) as {
        data?: { id?: number | string; username?: string; name?: string; email?: string };
      } | null;
      const resource = payload?.data;

      return {
        ...tokenSet,
        providerAccountId: tokenSet.providerAccountId ?? (resource?.id == null ? null : String(resource.id)),
        providerAccountName: tokenSet.providerAccountName ?? resource?.name ?? resource?.username ?? resource?.email ?? null
      };
    }

    if (provider === "hubspot") {
      const response = await fetch(`https://api.hubapi.com/oauth/v1/access-tokens/${encodeURIComponent(tokenSet.accessToken)}`);
      const payload = await response.json().catch(() => null) as { hub_id?: number; hub_domain?: string; user?: string } | null;

      return {
        ...tokenSet,
        providerAccountId: tokenSet.providerAccountId ?? (typeof payload?.hub_id === "number" ? String(payload.hub_id) : null),
        providerAccountName: tokenSet.providerAccountName ?? payload?.hub_domain ?? payload?.user ?? null
      };
    }

    if (provider === "jobber") {
      const response = await fetch("https://api.getjobber.com/api/graphql", {
        method: "POST",
        headers: getJobberHeaders(tokenSet.accessToken),
        body: JSON.stringify({ query: "{ account { id name } }" })
      });
      const payload = await response.json().catch(() => null) as { data?: { account?: { id?: string; name?: string } } } | null;
      const account = payload?.data?.account;

      return {
        ...tokenSet,
        providerAccountId: tokenSet.providerAccountId ?? account?.id ?? null,
        providerAccountName: tokenSet.providerAccountName ?? account?.name ?? null
      };
    }

    if (provider === "mailchimp") {
      const metadata = await fetchMailchimpMetadata(tokenSet.accessToken);
      const login = metadata.login && typeof metadata.login === "object"
        ? metadata.login as Record<string, unknown>
        : null;
      const dc = typeof metadata.dc === "string" ? metadata.dc : null;
      const apiEndpoint = typeof metadata.api_endpoint === "string" ? metadata.api_endpoint : null;
      const accountName = getString(login?.email) ?? getString(login?.login_name) ?? getString(login?.name);

      return {
        ...tokenSet,
        providerAccountId: tokenSet.providerAccountId ?? dc,
        providerAccountName: tokenSet.providerAccountName ?? accountName ?? dc,
        raw: {
          ...tokenSet.raw,
          dc,
          api_endpoint: apiEndpoint,
          login
        }
      };
    }

    if (provider === "google_sheets") {
      const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { authorization: `Bearer ${tokenSet.accessToken}`, accept: "application/json" }
      });
      const payload = await response.json().catch(() => null) as { id?: string; email?: string; name?: string } | null;

      return {
        ...tokenSet,
        providerAccountId: tokenSet.providerAccountId ?? payload?.id ?? payload?.email ?? null,
        providerAccountName: tokenSet.providerAccountName ?? payload?.email ?? payload?.name ?? null
      };
    }

  } catch {
    return tokenSet;
  }

  return tokenSet;
}

function getJobberHeaders(accessToken: string) {
  const headers: Record<string, string> = {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
    accept: "application/json"
  };
  const graphqlVersion = process.env.JOBBER_GRAPHQL_VERSION?.trim() || DEFAULT_JOBBER_GRAPHQL_VERSION;

  headers["X-JOBBER-GRAPHQL-VERSION"] = graphqlVersion;

  return headers;
}

async function fetchMailchimpMetadata(accessToken: string) {
  const response = await fetch("https://login.mailchimp.com/oauth2/metadata", {
    headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" }
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || typeof payload !== "object") {
    throw new Error("Mailchimp metadata lookup failed.");
  }

  return payload as Record<string, unknown>;
}

function getMailchimpApiEndpoint(credentials: OAuthTokenSet) {
  const rawEndpoint = getString(credentials.raw.api_endpoint);

  if (rawEndpoint) {
    return rawEndpoint.replace(/\/$/, "");
  }

  const dc = getString(credentials.raw.dc) ?? credentials.providerAccountId ?? process.env.MAILCHIMP_SERVER_PREFIX?.trim();

  return dc ? `https://${dc}.api.mailchimp.com` : null;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
