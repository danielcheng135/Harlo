"use client";

export type MetaPixelEventName =
  | "PageView"
  | "StartTrial"
  | "Lead"
  | "CompleteRegistration"
  | "InitiateCheckout"
  | "Subscribe"
  | "Purchase";

export type MetaPixelEventParams = Record<string, string | number | boolean | null | undefined>;
export type MetaPixelCustomEventName = "StartFreeTrialClick";

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
  return Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID);
}

export function trackMetaPixelEvent(eventName: MetaPixelEventName, params?: MetaPixelEventParams) {
  if (typeof window === "undefined" || !isMetaPixelEnabled() || typeof window.fbq !== "function") {
    return;
  }

  try {
    if (params && Object.keys(params).length > 0) {
      window.fbq("track", eventName, cleanMetaPixelParams(params));
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
    if (params && Object.keys(params).length > 0) {
      window.fbq("trackCustom", eventName, cleanMetaPixelParams(params));
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

function cleanMetaPixelParams(params: MetaPixelEventParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== "")
  );
}
