"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const conversionSendTo = "AW-18142694200/14NYCOW7r6kcELiWjstD";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAdsConversionTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("gads_conversion") !== "checkout") {
      return;
    }

    const transactionId = searchParams.get("gads_transaction_id") || searchParams.get("session_id") || "";
    const storageKey = transactionId ? `harlo:gads:checkout:${transactionId}` : "";

    if (storageKey && window.sessionStorage.getItem(storageKey) === "sent") {
      removeConversionParams();
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtagFallback(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

    window.gtag("event", "conversion", {
      send_to: conversionSendTo,
      value: 1.0,
      currency: "USD",
      transaction_id: transactionId,
      new_customer: searchParams.get("gads_new_customer") === "true"
    });

    if (storageKey) {
      window.sessionStorage.setItem(storageKey, "sent");
    }

    removeConversionParams();
  }, [searchParams]);

  return null;
}

function removeConversionParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("gads_conversion");
  url.searchParams.delete("gads_transaction_id");
  url.searchParams.delete("gads_new_customer");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}
