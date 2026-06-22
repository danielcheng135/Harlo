"use client";

export type MetaPixelEventName =
  | "PageView"
  | "ViewContent"
  | "StartTrial"
  | "Lead"
  | "CompleteRegistration"
  | "InitiateCheckout"
  | "Subscribe"
  | "Purchase";

export type MetaPixelEventParams = Record<string, string | number | boolean | null | undefined>;
export type MetaPixelCustomEventName = "StartFreeTrialClick";
export type MetaBrowserAttribution = {
  meta_fbp?: string;
  meta_fbc?: string;
  meta_client_user_agent?: string;
  meta_event_source_url?: string;
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

declare global {
  interface Window {
    fbq?: {
      (...args: unknown[]): void;
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      push?: (...args: unknown[]) => void;
    };
    _fbq?: Window["fbq"];
  }
}

export function isMetaPixelEnabled() {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

export function trackMetaPixelEvent(eventName: MetaPixelEventName, params?: MetaPixelEventParams) {
  if (typeof window === "undefined" || !isMetaPixelEnabled() || typeof window.fbq !== "function") {
    return;
  }

  try {
    const eventID = getMetaPixelEventId(params);
    const cleanParams = params ? cleanMetaPixelParams(params) : undefined;

    if (params && Object.keys(params).length > 0) {
      if (eventID) {
        window.fbq("track", eventName, cleanParams, { eventID });
        return;
      }

      window.fbq("track", eventName, cleanParams);
      return;
    }

    if (eventID) {
      window.fbq("track", eventName, undefined, { eventID });
      return;
    }

    window.fbq("track", eventName);
  } catch {
    // Tracking should never interrupt product flows.
  }
}

export function trackMetaPixelCustomEvent(eventName: MetaPixelCustomEventName, params?: MetaPixelEventParams) {
  if (typeof window === "undefined" || !isMetaPixelEnabled() || typeof window.fbq !== "function") {
    return;
  }

  try {
    const eventID = getMetaPixelEventId(params);
    const cleanParams = params ? cleanMetaPixelParams(params) : undefined;

    if (params && Object.keys(params).length > 0) {
      if (eventID) {
        window.fbq("trackCustom", eventName, cleanParams, { eventID });
        return;
      }

      window.fbq("trackCustom", eventName, cleanParams);
      return;
    }

    if (eventID) {
      window.fbq("trackCustom", eventName, undefined, { eventID });
      return;
    }

    window.fbq("trackCustom", eventName);
  } catch {
    // Tracking should never interrupt product flows.
  }
}

export function trackStartFreeTrialClick(params?: MetaPixelEventParams) {
  trackMetaPixelCustomEvent("StartFreeTrialClick", params);
}

export function trackStartTrial(params?: MetaPixelEventParams) {
  trackMetaPixelEvent("StartTrial", params);
}

export function trackViewContent(params?: MetaPixelEventParams) {
  trackMetaPixelEvent("ViewContent", params);
}

export function trackLead(params?: MetaPixelEventParams) {
  trackMetaPixelEvent("Lead", params);
}

export function trackCompleteRegistration(params?: MetaPixelEventParams) {
  trackMetaPixelEvent("CompleteRegistration", params);
}

export function trackInitiateCheckout(params?: MetaPixelEventParams) {
  trackMetaPixelEvent("InitiateCheckout", params);
}

export function trackSubscribe(params?: MetaPixelEventParams) {
  trackMetaPixelEvent("Subscribe", params);
}

export function getMetaBrowserAttribution(): MetaBrowserAttribution {
  if (typeof window === "undefined") {
    return {};
  }

  return cleanMetaBrowserAttribution({
    meta_fbp: getBrowserCookie("_fbp"),
    meta_fbc: getBrowserCookie("_fbc"),
    meta_client_user_agent: window.navigator.userAgent,
    meta_event_source_url: getBrowserEventSourceUrl()
  });
}

function cleanMetaPixelParams(params: MetaPixelEventParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([key, value]) => key !== "event_id" && value !== null && value !== undefined && value !== "")
  );
}

function getMetaPixelEventId(params?: MetaPixelEventParams) {
  const eventId = params?.event_id;

  if (typeof eventId === "string" && eventId.trim()) {
    return eventId;
  }

  if (typeof eventId === "number") {
    return String(eventId);
  }

  return undefined;
}

function getBrowserCookie(name: string) {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
}

function getBrowserEventSourceUrl() {
  try {
    const url = new URL(window.location.href);

    for (const param of SENSITIVE_URL_PARAMS) {
      url.searchParams.delete(param);
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

function cleanMetaBrowserAttribution(attribution: MetaBrowserAttribution): MetaBrowserAttribution {
  return Object.fromEntries(
    Object.entries(attribution).filter(([, value]) => typeof value === "string" && value.trim().length > 0)
  );
}
