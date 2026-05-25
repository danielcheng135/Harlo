import { getAppUrl } from "@/lib/billing/stripe";
import { isIntegrationProviderKey } from "@/lib/integrations/registry";
import type { IntegrationProviderKey } from "@/lib/integrations/types";

type OAuthProviderConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
};

const OAUTH_ENV_KEYS: Record<IntegrationProviderKey, { clientId: string; clientSecret: string; redirectUri: string; scopes: string }> = {
  calendly: {
    clientId: "CALENDLY_CLIENT_ID",
    clientSecret: "CALENDLY_CLIENT_SECRET",
    redirectUri: "CALENDLY_REDIRECT_URI",
    scopes: "CALENDLY_REQUESTED_SCOPES"
  },
  housecallpro: {
    clientId: "HOUSECALLPRO_CLIENT_ID",
    clientSecret: "HOUSECALLPRO_CLIENT_SECRET",
    redirectUri: "HOUSECALLPRO_REDIRECT_URI",
    scopes: "HOUSECALLPRO_REQUESTED_SCOPES"
  },
  jobber: {
    clientId: "JOBBER_CLIENT_ID",
    clientSecret: "JOBBER_CLIENT_SECRET",
    redirectUri: "JOBBER_REDIRECT_URI",
    scopes: "JOBBER_REQUESTED_SCOPES"
  },
  zapier: {
    clientId: "ZAPIER_CLIENT_ID",
    clientSecret: "ZAPIER_CLIENT_SECRET",
    redirectUri: "ZAPIER_REDIRECT_URI",
    scopes: "ZAPIER_REQUESTED_SCOPES"
  },
  slack: {
    clientId: "SLACK_CLIENT_ID",
    clientSecret: "SLACK_CLIENT_SECRET",
    redirectUri: "SLACK_REDIRECT_URI",
    scopes: "SLACK_REQUESTED_SCOPES"
  },
  hubspot: {
    clientId: "HUBSPOT_CLIENT_ID",
    clientSecret: "HUBSPOT_CLIENT_SECRET",
    redirectUri: "HUBSPOT_REDIRECT_URI",
    scopes: "HUBSPOT_REQUESTED_SCOPES"
  }
};

export function getIntegrationCallbackPath(provider: IntegrationProviderKey) {
  return `/api/integrations/${provider}/callback`;
}

export function getIntegrationRedirectUri(provider: IntegrationProviderKey, requestUrl: string) {
  const explicitRedirectUri = process.env[OAUTH_ENV_KEYS[provider].redirectUri]?.trim();

  if (explicitRedirectUri) {
    return explicitRedirectUri;
  }

  return `${getAppUrl(requestUrl)}${getIntegrationCallbackPath(provider)}`;
}

export function getIntegrationOAuthConfig(provider: IntegrationProviderKey, requestUrl: string): OAuthProviderConfig | null {
  const keys = OAUTH_ENV_KEYS[provider];
  const clientId = process.env[keys.clientId];
  const clientSecret = process.env[keys.clientSecret];

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri: getIntegrationRedirectUri(provider, requestUrl),
    scopes: parseScopes(process.env[keys.scopes])
  };
}

export function isIntegrationOAuthConfigured(provider: IntegrationProviderKey) {
  const keys = OAUTH_ENV_KEYS[provider];

  return Boolean(process.env[keys.clientId] && process.env[keys.clientSecret]);
}

export function parseIntegrationProviderParam(value: string | null | undefined): IntegrationProviderKey | null {
  return isIntegrationProviderKey(value) ? value : null;
}

function parseScopes(value: string | null | undefined) {
  return (value ?? "")
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}
