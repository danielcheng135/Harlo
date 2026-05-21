"use client";

import { useEffect } from "react";
import type { MouseEvent, ReactNode } from "react";

const CALENDLY_URL = "https://calendly.com/danielcheng135/new-meeting";
const CALENDLY_CSS_URL = "https://assets.calendly.com/assets/external/widget.css";
const CALENDLY_SCRIPT_URL = "https://assets.calendly.com/assets/external/widget.js";
let calendlyLoadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

type CalendlyDemoButtonProps = {
  children?: ReactNode;
  className?: string;
};

export function CalendlyDemoButton({ children = "Book a Demo", className }: CalendlyDemoButtonProps) {
  useEffect(() => {
    loadCalendlyAssets();
  }, []);

  async function openCalendly(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    try {
      await loadCalendlyAssets();
      window.Calendly?.initPopupWidget({ url: CALENDLY_URL });
    } catch {
      window.location.href = CALENDLY_URL;
    }
  }

  return (
    <a href={CALENDLY_URL} onClick={openCalendly} className={className}>
      {children}
    </a>
  );
}

function loadCalendlyAssets() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.Calendly?.initPopupWidget) {
    return Promise.resolve();
  }

  if (calendlyLoadPromise) {
    return calendlyLoadPromise;
  }

  calendlyLoadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${CALENDLY_CSS_URL}"]`)) {
      const stylesheet = document.createElement("link");
      stylesheet.href = CALENDLY_CSS_URL;
      stylesheet.rel = "stylesheet";
      document.head.appendChild(stylesheet);
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${CALENDLY_SCRIPT_URL}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Calendly failed to load.")), { once: true });
      setTimeout(() => {
        if (window.Calendly?.initPopupWidget) {
          resolve();
        } else {
          reject(new Error("Calendly failed to initialize."));
        }
      }, 3000);
      return;
    }

    const script = document.createElement("script");
    script.src = CALENDLY_SCRIPT_URL;
    script.type = "text/javascript";
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Calendly failed to load.")), { once: true });
    document.head.appendChild(script);
  });

  return calendlyLoadPromise;
}
