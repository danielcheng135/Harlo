"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const HARLO_ORGANIZATION_ID = "2a007ac5-01c5-4154-8a41-21f4dbcd2b43";
const WIDGET_EXCLUDED_PATHS = [
  "/auth",
  "/dashboard",
  "/invite",
  "/onboarding",
  "/privacy",
  "/terms",
  "/widget-test"
];

export function SiteWidgetLoader() {
  const pathname = usePathname();
  const loadedPathRef = useRef<string | null>(null);
  const shouldLoadWidget = !isWidgetExcludedPath(pathname);

  useEffect(() => {
    if (!shouldLoadWidget) {
      loadedPathRef.current = null;
      document.getElementById("harlo-widget-root")?.remove();
      document.getElementById("harlo-site-widget-script")?.remove();
      return;
    }

    if (loadedPathRef.current === pathname && (document.getElementById("harlo-widget-root") || document.getElementById("harlo-site-widget-script"))) {
      return;
    }

    document.getElementById("harlo-widget-root")?.remove();
    document.getElementById("harlo-site-widget-script")?.remove();

    const script = document.createElement("script");
    script.id = "harlo-site-widget-script";
    script.src = "/widget.js";
    script.async = true;
    script.setAttribute("data-harlo-organization", HARLO_ORGANIZATION_ID);
    document.body.appendChild(script);
    loadedPathRef.current = pathname;
  }, [shouldLoadWidget, pathname]);

  return null;
}

function isWidgetExcludedPath(pathname: string | null) {
  const normalizedPath = pathname || "/";

  return WIDGET_EXCLUDED_PATHS.some((path) => normalizedPath === path || normalizedPath.startsWith(`${path}/`));
}
