"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isMetaPixelEnabled, trackStartFreeTrialClick, trackViewContent } from "@/lib/meta-pixel";

const viewContentPages: Record<string, string> = {
  "/": "Harlo Meta ads landing page",
  "/meta": "Harlo Meta ads landing page",
  "/slack": "Harlo Slack landing page",
  "/ai-website-chatbot": "AI website chatbot landing page",
  "/ai-lead-capture-chatbot": "AI lead capture chatbot landing page",
  "/website-chatbot-for-small-business": "Small business website chatbot landing page",
  "/customer-support-ai-agent": "Customer support AI agent landing page",
  "/onboarding/checkout": "Harlo pricing checkout"
};

export function MetaPixelEvents() {
  const pathname = usePathname();
  const lastViewContentPath = useRef<string | null>(null);

  useEffect(() => {
    const contentName = viewContentPages[pathname];

    if (!contentName || lastViewContentPath.current === pathname) {
      return;
    }

    let canceled = false;
    let attempts = 0;

    function trackWhenReady() {
      if (canceled) {
        return;
      }

      if (isMetaPixelEnabled()) {
        lastViewContentPath.current = pathname;
        trackViewContent({
          content_name: contentName,
          page_path: pathname,
          event_id: createBrowserEventId("view-content")
        });
        return;
      }

      if (attempts < 20) {
        attempts += 1;
        window.setTimeout(trackWhenReady, 250);
      }
    }

    trackWhenReady();

    return () => {
      canceled = true;
    };
  }, [pathname]);

  useEffect(() => {
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

  return null;
}

function createBrowserEventId(prefix: string) {
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());

  return `${prefix}:${randomId}`;
}
