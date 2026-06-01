import { decryptIntegrationCredentials, encryptIntegrationCredentials } from "@/lib/integrations/credentials";
import { refreshProviderTokenIfNeeded, type OAuthTokenSet } from "@/lib/integrations/providers";
import type { IntegrationProviderKey } from "@/lib/integrations/types";
import type { createSupabaseServiceClient } from "@/lib/supabase/server";

type SupabaseServiceClient = ReturnType<typeof createSupabaseServiceClient>;

const CALCOM_API_VERSION = "2024-06-14";

export type BookingEventTypeOption = {
  id: string;
  name: string;
  url: string;
  durationLabel: string | null;
};

export async function getFreshIntegrationCredentials({
  supabase,
  integrationId,
  provider,
  encryptedCredentials,
  requestUrl
}: {
  supabase: SupabaseServiceClient;
  integrationId: string;
  provider: IntegrationProviderKey;
  encryptedCredentials: string;
  requestUrl?: string;
}) {
  const credentials = decryptIntegrationCredentials<OAuthTokenSet>(encryptedCredentials);

  if (!requestUrl) {
    return credentials;
  }

  const refreshedCredentials = await refreshProviderTokenIfNeeded({
    provider,
    requestUrl,
    tokenSet: credentials
  });

  if (
    refreshedCredentials.accessToken !== credentials.accessToken ||
    refreshedCredentials.refreshToken !== credentials.refreshToken ||
    refreshedCredentials.expiresAt !== credentials.expiresAt
  ) {
    await persistRefreshedCredentials({
      supabase,
      integrationId,
      credentials: refreshedCredentials
    });
  }

  return refreshedCredentials;
}

export async function listBookingEventTypes({
  provider,
  accessToken
}: {
  provider: IntegrationProviderKey;
  accessToken: string;
}): Promise<BookingEventTypeOption[]> {
  if (provider === "calendly") {
    return listCalendlyEventTypes(accessToken);
  }

  if (provider === "calcom") {
    return listCalcomEventTypes(accessToken);
  }

  return [];
}

export function normalizeSelectedEventTypes(value: unknown): BookingEventTypeOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = cleanString(record.id);
      const name = cleanString(record.name);
      const url = cleanString(record.url);
      const durationLabel = cleanString(record.durationLabel);

      return id && name && url ? { id, name, url, durationLabel } : null;
    })
    .filter((item): item is BookingEventTypeOption => Boolean(item));
}

async function listCalendlyEventTypes(accessToken: string): Promise<BookingEventTypeOption[]> {
  const userResponse = await fetch("https://api.calendly.com/users/me", {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/json"
    }
  });
  const userPayload = await parseProviderResponse(userResponse, "Calendly user lookup failed.");
  const userUri = cleanString((userPayload.resource as Record<string, unknown> | undefined)?.uri);

  if (!userUri) {
    throw new Error("Calendly did not return a user URI.");
  }

  const eventTypesUrl = new URL("https://api.calendly.com/event_types");
  eventTypesUrl.searchParams.set("user", userUri);
  eventTypesUrl.searchParams.set("active", "true");
  eventTypesUrl.searchParams.set("count", "100");
  const eventTypesResponse = await fetch(eventTypesUrl, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/json"
    }
  });
  const eventTypesPayload = await parseProviderResponse(eventTypesResponse, "Calendly event type lookup failed.");
  const collection = Array.isArray(eventTypesPayload.collection) ? eventTypesPayload.collection : [];

  return collection
    .map((item) => normalizeCalendlyEventType(item))
    .filter((item): item is BookingEventTypeOption => Boolean(item));
}

function normalizeCalendlyEventType(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = cleanString(record.uri);
  const name = cleanString(record.name);
  const url = cleanString(record.scheduling_url);
  const duration = typeof record.duration === "number" ? record.duration : null;

  return id && name && url ? {
    id,
    name,
    url,
    durationLabel: duration ? `${duration} min` : null
  } : null;
}

async function listCalcomEventTypes(accessToken: string): Promise<BookingEventTypeOption[]> {
  const eventTypesUrl = new URL("https://api.cal.com/v2/event-types");
  eventTypesUrl.searchParams.set("sortCreatedAt", "asc");
  const eventTypesResponse = await fetch(eventTypesUrl, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/json",
      "cal-api-version": CALCOM_API_VERSION
    }
  });
  const eventTypesPayload = await parseProviderResponse(eventTypesResponse, "Cal.com event type lookup failed.");
  const collection = Array.isArray(eventTypesPayload.data) ? eventTypesPayload.data : [];

  return collection
    .map((item) => normalizeCalcomEventType(item))
    .filter((item): item is BookingEventTypeOption => Boolean(item));
}

function normalizeCalcomEventType(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const rawId = record.id;
  const id = typeof rawId === "number" || typeof rawId === "string" ? String(rawId) : null;
  const name = cleanString(record.title);
  const url = cleanString(record.bookingUrl);
  const length = typeof record.lengthInMinutes === "number" ? record.lengthInMinutes : null;

  return id && name && url ? {
    id,
    name,
    url,
    durationLabel: length ? `${length} min` : null
  } : null;
}

async function persistRefreshedCredentials({
  supabase,
  integrationId,
  credentials
}: {
  supabase: SupabaseServiceClient;
  integrationId: string;
  credentials: OAuthTokenSet;
}) {
  const { error } = await supabase
    .from("integrations")
    .update({
      credentials_encrypted: encryptIntegrationCredentials(credentials),
      config: {
        provider_account_id: credentials.providerAccountId,
        provider_account_name: credentials.providerAccountName,
        scope: credentials.scope,
        token_type: credentials.tokenType,
        expires_at: credentials.expiresAt
      },
      updated_at: new Date().toISOString()
    })
    .eq("id", integrationId);

  if (error) {
    console.error("Could not persist refreshed integration credentials", error);
  }
}

async function parseProviderResponse(response: Response, fallbackMessage: string) {
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || typeof payload !== "object") {
    throw new Error(getProviderResponseMessage(payload) ?? fallbackMessage);
  }

  return payload as Record<string, unknown>;
}

function getProviderResponseMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  return cleanString(record.message) ?? cleanString(record.error_description) ?? cleanString(record.error);
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
