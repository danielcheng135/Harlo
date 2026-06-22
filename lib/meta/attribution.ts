import "server-only";

import type { NextRequest } from "next/server";

export type MetaAttribution = {
  fbp?: string;
  fbc?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  eventSourceUrl?: string;
};

const SENSITIVE_URL_PARAMS = new Set([
  "access_token",
  "code",
  "error",
  "error_code",
  "error_description",
  "refresh_token",
  "token_hash"
]);
const STRIPE_METADATA_VALUE_LIMIT = 500;

export function getMetaAttributionFromRequest(request: NextRequest, eventSourceUrl?: unknown): MetaAttribution {
  return compactAttribution({
    fbp: request.cookies.get("_fbp")?.value,
    fbc: request.cookies.get("_fbc")?.value,
    clientIpAddress: getClientIpAddress(request),
    clientUserAgent: request.headers.get("user-agent") ?? undefined,
    eventSourceUrl: getEventSourceUrl(request, eventSourceUrl)
  });
}

export function getMetaAttributionFromStripeMetadata(metadata: Record<string, string> | null | undefined): MetaAttribution {
  return compactAttribution({
    fbp: metadata?.meta_fbp,
    fbc: metadata?.meta_fbc,
    clientIpAddress: metadata?.meta_client_ip_address,
    clientUserAgent: metadata?.meta_client_user_agent,
    eventSourceUrl: metadata?.meta_event_source_url
  });
}

export function getMetaAttributionFromUserMetadata(metadata: unknown): MetaAttribution {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  const values = metadata as Record<string, unknown>;

  return compactAttribution({
    fbp: getStringValue(values.meta_fbp),
    fbc: getStringValue(values.meta_fbc),
    clientUserAgent: getStringValue(values.meta_client_user_agent),
    eventSourceUrl: sanitizeEventSourceUrl(getStringValue(values.meta_event_source_url))
  });
}

export function mergeMetaAttribution(primary: MetaAttribution, fallback: MetaAttribution): MetaAttribution {
  return compactAttribution({
    fbp: primary.fbp ?? fallback.fbp,
    fbc: primary.fbc ?? fallback.fbc,
    clientIpAddress: primary.clientIpAddress ?? fallback.clientIpAddress,
    clientUserAgent: primary.clientUserAgent ?? fallback.clientUserAgent,
    eventSourceUrl: primary.eventSourceUrl ?? fallback.eventSourceUrl
  });
}

export function buildMetaStripeMetadata({
  attribution,
  userId
}: {
  attribution: MetaAttribution;
  userId?: string | null;
}) {
  const metadata: Record<string, string> = {};

  addMetadataValue(metadata, "meta_user_id", userId);
  addMetadataValue(metadata, "meta_fbp", attribution.fbp);
  addMetadataValue(metadata, "meta_fbc", attribution.fbc);
  addMetadataValue(metadata, "meta_client_ip_address", attribution.clientIpAddress);
  addMetadataValue(metadata, "meta_client_user_agent", attribution.clientUserAgent);
  addMetadataValue(metadata, "meta_event_source_url", attribution.eventSourceUrl);

  return metadata;
}

export function compactAttribution(attribution: MetaAttribution): MetaAttribution {
  return {
    ...(cleanString(attribution.fbp) ? { fbp: cleanString(attribution.fbp) } : {}),
    ...(cleanString(attribution.fbc) ? { fbc: cleanString(attribution.fbc) } : {}),
    ...(cleanString(attribution.clientIpAddress) ? { clientIpAddress: cleanString(attribution.clientIpAddress) } : {}),
    ...(cleanString(attribution.clientUserAgent) ? { clientUserAgent: cleanString(attribution.clientUserAgent) } : {}),
    ...(cleanString(attribution.eventSourceUrl) ? { eventSourceUrl: cleanString(attribution.eventSourceUrl) } : {})
  };
}

function getClientIpAddress(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return cleanString(
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    forwardedFor
  );
}

function getEventSourceUrl(request: NextRequest, explicitUrl?: unknown) {
  const explicit = typeof explicitUrl === "string" ? sanitizeEventSourceUrl(explicitUrl) : undefined;

  if (explicit) {
    return explicit;
  }

  const referer = sanitizeEventSourceUrl(request.headers.get("referer") ?? undefined);

  if (referer) {
    return referer;
  }

  return sanitizeEventSourceUrl(request.url);
}

function sanitizeEventSourceUrl(value: string | undefined) {
  const cleaned = cleanString(value);

  if (!cleaned) {
    return undefined;
  }

  try {
    const url = new URL(cleaned);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }

    for (const param of SENSITIVE_URL_PARAMS) {
      url.searchParams.delete(param);
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

function addMetadataValue(metadata: Record<string, string>, key: string, value: string | null | undefined) {
  const cleaned = cleanString(value);

  if (!cleaned) {
    return;
  }

  metadata[key] = cleaned.slice(0, STRIPE_METADATA_VALUE_LIMIT);
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function cleanString(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}
