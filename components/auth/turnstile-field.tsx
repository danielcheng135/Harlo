"use client";

import Script from "next/script";
import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

type TurnstileFieldProps = {
  siteKey: string;
  onError: (code?: string) => void;
  onExpire: () => void;
  onVerify: (token: string) => void;
};

export type TurnstileFieldHandle = {
  execute: () => Promise<string | null>;
  refresh: () => void;
};

type TurnstileWidget = {
  render: (
    container: HTMLElement | string,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback": (code?: string) => void;
      "expired-callback": () => void;
      "timeout-callback": () => void;
      appearance: "interaction-only";
      "execution"?: "execute";
      theme: "light";
    }
  ) => string;
  execute: (container?: string) => void;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

const TURNSTILE_EXECUTE_TIMEOUT_MS = 8000;

declare global {
  interface Window {
    turnstile?: TurnstileWidget;
  }
}

export const TurnstileField = forwardRef<TurnstileFieldHandle, TurnstileFieldProps>(function TurnstileField(
  { siteKey, onError, onExpire, onVerify },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerId = `harlo-turnstile-${useId().replace(/:/g, "")}`;
  const widgetIdRef = useRef<string | null>(null);
  const pendingResolverRef = useRef<((token: string | null) => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useImperativeHandle(ref, () => ({
    execute() {
      if (!window.turnstile) {
        return Promise.resolve(null);
      }

      return new Promise((resolve) => {
        const timeoutId = window.setTimeout(() => {
          if (!pendingResolverRef.current) {
            return;
          }

          pendingResolverRef.current(null);
          pendingResolverRef.current = null;
        }, TURNSTILE_EXECUTE_TIMEOUT_MS);

        pendingResolverRef.current = resolve;

        const executeWhenRendered = () => {
          if (!pendingResolverRef.current) {
            return;
          }

          if (widgetIdRef.current) {
            window.clearTimeout(timeoutId);
            window.setTimeout(() => {
              if (!pendingResolverRef.current) {
                return;
              }

              pendingResolverRef.current(null);
              pendingResolverRef.current = null;
            }, TURNSTILE_EXECUTE_TIMEOUT_MS);
            window.turnstile?.execute(`#${containerId}`);
            return;
          }

          window.setTimeout(executeWhenRendered, 50);
        };

        executeWhenRendered();
      });
    },
    refresh() {
      if (!widgetIdRef.current || !window.turnstile) {
        return;
      }

      setIsVerified(false);
      pendingResolverRef.current?.(null);
      pendingResolverRef.current = null;
      window.turnstile.reset(widgetIdRef.current);
    }
  }));

  useEffect(() => {
    if (window.turnstile) {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current || widgetIdRef.current || !window.turnstile) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => {
        setIsVerified(true);
        pendingResolverRef.current?.(token);
        pendingResolverRef.current = null;
        onVerify(token);
      },
      "error-callback": (code) => {
        setIsVerified(false);
        pendingResolverRef.current?.(null);
        pendingResolverRef.current = null;
        onError(code);
      },
      "expired-callback": () => {
        setIsVerified(false);
        pendingResolverRef.current?.(null);
        pendingResolverRef.current = null;
        onExpire();
      },
      "timeout-callback": () => {
        setIsVerified(false);
        pendingResolverRef.current?.(null);
        pendingResolverRef.current = null;
        onError();
      },
      appearance: "interaction-only",
      execution: "execute",
      theme: "light"
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [isReady, onError, onExpire, onVerify, siteKey]);

  return (
    <div className="rounded-lg border border-harlo-line bg-harlo-canvas px-3 py-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setIsReady(true)}
        onReady={() => setIsReady(true)}
      />
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-harlo-teal shadow-sm">
            {isVerified ? <CheckCircle2 size={15} /> : <ShieldCheck size={15} />}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-harlo-ink">Protected by Cloudflare Turnstile</p>
            <p className="text-[11px] text-harlo-muted">Runs quietly when you continue.</p>
          </div>
        </div>
        {!isReady ? <Loader2 size={16} className="shrink-0 animate-spin text-harlo-muted" /> : null}
      </div>
      <div id={containerId} ref={containerRef} />
    </div>
  );
});
