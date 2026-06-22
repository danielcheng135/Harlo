import "server-only";

import { createHash } from "crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export type MetaCapiEventName =
  | "ViewContent"
  | "CompleteRegistration"
  | "StartTrial"
  | "Purchase"
  | "Subscribe";

export type MetaCapiUserDataInput = {
  email?: string | null;
  externalId?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  subscriptionId?: string | null;
};

export type MetaCapiCustomData = Record<string, string | number | boolean | null | undefined>;

export type MetaCapiEventInput = {
  event_name: MetaCapiEventName;
  event_time?: number;
  event_source_url?: string | null;
  event_id: string;
  user_data?: MetaCapiUserDataInput;
  custom_data?: MetaCapiCustomData;
};

export type MetaCapiSendResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  status?: number;
  response?: Record<string, unknown>;
  error?: string;
};

const META_GRAPH_API_VERSION = "v25.0";
const MAX_LOG_ERROR_LENGTH = 500;
const MAX_EVENT_ATTEMPTS = 3;

export async function sendMetaCapiEventOnce(input: MetaCapiEventInput): Promise<MetaCapiSendResult> {
  const reservation = await reserveMetaCapiEvent(input.event_name, input.event_id);

  if (!reservation.shouldSend) {
    return {
      ok: true,
      skipped: true,
      reason: reservation.reason
    };
  }

  const result = await sendMetaCapiEvent(input);
  await updateMetaCapiEvent(reservation.id, result);

  return result;
}

export async function sendMetaCapiEvent(input: MetaCapiEventInput): Promise<MetaCapiSendResult> {
  const pixelId = cleanString(process.env.META_PIXEL_ID);
  const accessToken = cleanString(process.env.META_CAPI_ACCESS_TOKEN);

  if (!pixelId || !accessToken) {
    logMetaInfo("skipped_missing_config", input);

    return {
      ok: true,
      skipped: true,
      reason: "missing_meta_capi_configuration"
    };
  }

  const eventSourceUrl = cleanString(input.event_source_url) ?? getDefaultEventSourceUrl();

  if (!eventSourceUrl) {
    logMetaInfo("skipped_missing_event_source_url", input);

    return {
      ok: true,
      skipped: true,
      reason: "missing_event_source_url"
    };
  }

  const payload = {
    data: [
      {
        event_name: input.event_name,
        event_time: input.event_time ?? Math.floor(Date.now() / 1000),
        event_source_url: eventSourceUrl,
        action_source: "website",
        event_id: input.event_id,
        user_data: buildUserData(input.user_data),
        custom_data: cleanRecord(input.custom_data)
      }
    ],
    ...getTestEventPayload()
  };

  try {
    const response = await fetch(`https://graph.facebook.com/${META_GRAPH_API_VERSION}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
    const responseBody = await readResponseBody(response);

    if (!response.ok) {
      const error = getMetaErrorMessage(responseBody) ?? `Meta CAPI request failed with status ${response.status}.`;

      logMetaError("request_failed", input, {
        status: response.status,
        error: sanitizeMetaResponse(responseBody)
      });

      return {
        ok: false,
        status: response.status,
        response: sanitizeMetaResponse(responseBody),
        error
      };
    }

    return {
      ok: true,
      status: response.status,
      response: sanitizeMetaResponse(responseBody)
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta CAPI request failed.";

    logMetaError("request_error", input, {
      error: message
    });

    return {
      ok: false,
      error: message
    };
  }
}

function buildUserData(userData: MetaCapiUserDataInput | undefined) {
  return cleanRecord({
    em: hashEmail(userData?.email),
    external_id: hashExternalId(userData?.externalId),
    fbp: userData?.fbp,
    fbc: userData?.fbc,
    client_ip_address: userData?.clientIpAddress,
    client_user_agent: userData?.clientUserAgent,
    subscription_id: userData?.subscriptionId
  });
}

function hashEmail(value: string | null | undefined) {
  const normalized = cleanString(value)?.toLowerCase();

  return normalized ? sha256(normalized) : undefined;
}

function hashExternalId(value: string | null | undefined) {
  const normalized = cleanString(value)?.toLowerCase();

  return normalized ? sha256(normalized) : undefined;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getTestEventPayload() {
  const code = cleanString(process.env.META_TEST_EVENT_CODE);
  const isProduction = process.env.VERCEL_ENV === "production";

  return code && !isProduction ? { test_event_code: code } : {};
}

function getDefaultEventSourceUrl() {
  const appUrl = cleanString(process.env.NEXT_PUBLIC_APP_URL);

  if (!appUrl) {
    return undefined;
  }

  try {
    const url = new URL(appUrl);

    return url.toString();
  } catch {
    return undefined;
  }
}

async function readResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    const parsed = JSON.parse(text);

    return isRecord(parsed) ? parsed : { body: text.slice(0, MAX_LOG_ERROR_LENGTH) };
  } catch {
    return { body: text.slice(0, MAX_LOG_ERROR_LENGTH) };
  }
}

async function reserveMetaCapiEvent(eventName: MetaCapiEventName, eventId: string): Promise<{
  shouldSend: boolean;
  id?: string;
  reason?: string;
}> {
  try {
    const service = createSupabaseServiceClient();
    const attemptedAt = new Date().toISOString();
    const { data, error } = await service
      .from("meta_capi_events")
      .insert({
        event_name: eventName,
        event_id: eventId,
        status: "sending",
        attempts: 1,
        last_attempted_at: attemptedAt,
        updated_at: attemptedAt
      })
      .select("id")
      .single();

    if (!error && data?.id) {
      return {
        shouldSend: true,
        id: data.id as string
      };
    }

    if (error?.code !== "23505") {
      logMetaError("event_log_insert_failed", { event_name: eventName, event_id: eventId }, { error: error?.message });

      return { shouldSend: true };
    }

    const { data: existing, error: existingError } = await service
      .from("meta_capi_events")
      .select("id, status, attempts")
      .eq("event_name", eventName)
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingError || !existing) {
      logMetaError("event_log_lookup_failed", { event_name: eventName, event_id: eventId }, { error: existingError?.message });

      return { shouldSend: true };
    }

    const attempts = typeof existing.attempts === "number" ? existing.attempts : 1;
    const status = typeof existing.status === "string" ? existing.status : "sent";

    if (status !== "failed" || attempts >= MAX_EVENT_ATTEMPTS) {
      return {
        shouldSend: false,
        reason: "duplicate_event"
      };
    }

    const { data: retry, error: retryError } = await service
      .from("meta_capi_events")
      .update({
        status: "sending",
        attempts: attempts + 1,
        last_attempted_at: attemptedAt,
        updated_at: attemptedAt
      })
      .eq("id", existing.id)
      .select("id")
      .single();

    if (retryError || !retry?.id) {
      logMetaError("event_log_retry_failed", { event_name: eventName, event_id: eventId }, { error: retryError?.message });

      return { shouldSend: true };
    }

    return {
      shouldSend: true,
      id: retry.id as string
    };
  } catch (error) {
    logMetaError("event_log_unavailable", { event_name: eventName, event_id: eventId }, {
      error: error instanceof Error ? error.message : "Could not reserve Meta CAPI event."
    });

    return { shouldSend: true };
  }
}

async function updateMetaCapiEvent(id: string | undefined, result: MetaCapiSendResult) {
  if (!id) {
    return;
  }

  try {
    const service = createSupabaseServiceClient();
    const updatedAt = new Date().toISOString();
    const status = result.ok ? result.skipped ? "skipped" : "sent" : "failed";

    await service
      .from("meta_capi_events")
      .update({
        status,
        response: result.response ?? {},
        last_error: result.ok ? null : cleanString(result.error)?.slice(0, MAX_LOG_ERROR_LENGTH) ?? "Meta CAPI request failed.",
        sent_at: status === "sent" ? updatedAt : null,
        updated_at: updatedAt
      })
      .eq("id", id);
  } catch {
    // Meta logging must not interrupt the product flow.
  }
}

function getMetaErrorMessage(response: Record<string, unknown> | undefined) {
  const error = isRecord(response?.error) ? response.error : null;
  const message = typeof error?.message === "string" ? error.message : undefined;

  return message?.slice(0, MAX_LOG_ERROR_LENGTH);
}

function sanitizeMetaResponse(response: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!response) {
    return {};
  }

  const error = isRecord(response.error) ? response.error : null;

  if (error) {
    return cleanRecord({
      error: cleanRecord({
        message: typeof error.message === "string" ? error.message.slice(0, MAX_LOG_ERROR_LENGTH) : undefined,
        type: error.type,
        code: error.code,
        error_subcode: error.error_subcode,
        fbtrace_id: error.fbtrace_id
      })
    });
  }

  return cleanRecord({
    events_received: response.events_received,
    messages: response.messages,
    fbtrace_id: response.fbtrace_id
  });
}

function logMetaInfo(reason: string, input: Pick<MetaCapiEventInput, "event_name" | "event_id">) {
  console.info("[meta-capi]", {
    reason,
    event_name: input.event_name,
    event_key: getLogSafeEventKey(input.event_id)
  });
}

function logMetaError(reason: string, input: Pick<MetaCapiEventInput, "event_name" | "event_id">, details: Record<string, unknown>) {
  console.error("[meta-capi]", {
    reason,
    event_name: input.event_name,
    event_key: getLogSafeEventKey(input.event_id),
    ...details
  });
}

function getLogSafeEventKey(eventId: string) {
  return sha256(eventId).slice(0, 12);
}

function cleanRecord(record: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!record) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== null && value !== undefined && value !== "")
  );
}

function cleanString(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
