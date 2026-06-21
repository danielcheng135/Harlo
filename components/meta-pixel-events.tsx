"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isMetaPixelEnabled, trackMetaPixelEvent, trackStartFreeTrialClick, type MetaPixelEventName } from "@/lib/meta-pixel";

const trackedMetaEvents = new Set<MetaPixelEventName>(["StartTrial", "Subscribe", "Purchase", "CompleteRegistration", "Lead"]);

export function MetaPixelEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    if (!isMetaPixelEnabled()) {
      return;
    }

    trackMetaPixelEvent("PageView");
  }, [pathname, search]);

  useEffect(() => {
    if (!isMetaPixelEnabled()) {
      return;
    }

    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest("a,button") : null;

      if (!target) {
        return;
      }

      const label = target.textContent?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";

      if (label.includes("start free trial")) {
        trackStartFreeTrialClick({
          content_name: "Start free trial CTA",
          page_path: window.location.pathname,
          event_id: `start-free-trial-click:${Date.now()}`
        });
      }
    }

    document.addEventListener("click", handleClick, true);

    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    if (!isMetaPixelEnabled()) {
      return;
    }

    const eventName = searchParams.get("meta_event") as MetaPixelEventName | null;

    if (!eventName || !trackedMetaEvents.has(eventName)) {
      return;
    }

    const eventId = searchParams.get("meta_event_id") ?? searchParams.get("session_id") ?? "";
    const storageKey = eventId ? `harlo:meta:${eventName}:${eventId}` : "";

    if (!storageKey || window.sessionStorage.getItem(storageKey) !== "sent") {
      trackMetaPixelEvent(eventName, {
        content_name: getMetaEventContentName(eventName),
        event_id: eventId
      });

      if (storageKey) {
        window.sessionStorage.setItem(storageKey, "sent");
      }
    }

    removeMetaEventParams();
  }, [searchParams]);

  return null;
}

function getMetaEventContentName(eventName: MetaPixelEventName) {
  if (eventName === "CompleteRegistration") {
    return "Harlo account registration";
  }

  if (eventName === "Lead") {
    return "Harlo lead capture";
  }

  if (eventName === "StartTrial") {
    return "Harlo trial";
  }

  return "Harlo subscription";
}

function removeMetaEventParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("meta_event");
  url.searchParams.delete("meta_event_id");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}
