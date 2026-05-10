"use client";

import { CheckCircle2, Clipboard, Globe2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ToastViewport, useToast } from "@/components/ui/toast";

type WidgetInstallPanelProps = {
  brandLogoUrl: string | null;
  botId: string;
  allowedDomains: string[];
};

const productionOrigin = "https://app.harlo.ai";

export function WidgetInstallPanel({ brandLogoUrl, botId, allowedDomains }: WidgetInstallPanelProps) {
  const { toast, showToast, dismissToast } = useToast();
  const productionSnippet = buildSnippet(productionOrigin, botId);
  const hasDomains = allowedDomains.length > 0;

  async function copySnippet(snippet: string, label: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(snippet);
      } else {
        copyWithFallback(snippet);
      }

      showToast("success", `${label} copied.`);
    } catch {
      try {
        copyWithFallback(snippet);
        showToast("success", `${label} copied.`);
      } catch {
        showToast("error", "Could not copy the snippet. Select the code and copy it manually.");
      }
    }
  }

  return (
    <div className="space-y-6">
      <ToastViewport toast={toast} onDismiss={dismissToast} />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-harlo-ink">Install snippet</h2>
              <p className="mt-1 text-sm text-harlo-muted">Paste this before the closing body tag on the customer website.</p>
            </div>
            <Button type="button" onClick={() => copySnippet(productionSnippet, "Install snippet")}>
              <Clipboard size={16} />
              Copy snippet
            </Button>
          </CardHeader>
          <CardBody>
            <CodeBlock value={productionSnippet} />
          </CardBody>
        </Card>

        <div className="min-w-0 space-y-4">
          <StatusCard
            icon={<WebsiteLogoIcon brandLogoUrl={brandLogoUrl} size="md" fallback={<Globe2 size={18} />} />}
            title={hasDomains ? "Allowed domains" : "No domains added"}
            body={hasDomains ? `${allowedDomains.length} website${allowedDomains.length === 1 ? "" : "s"} can load this bot.` : "Add domains in Builder before putting the widget on a live website."}
            tone={hasDomains ? "ready" : "warning"}
          />
          <StatusCard
            icon={<ShieldCheck size={18} />}
            title="Public bot id"
            body={botId}
            tone="ready"
          />
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0">
          <CardHeader>
            <h2 className="text-lg font-semibold text-harlo-ink">Launch checklist</h2>
          </CardHeader>
          <CardBody className="grid gap-3 md:grid-cols-2">
            <ChecklistItem title="Add allowed domains" body="Include the exact website domains that should be allowed to load this bot." />
            <ChecklistItem title="Train knowledge" body="Make sure the services, pricing, hours, policies, and quote requirements are covered." />
            <ChecklistItem title="Test the widget" body="Ask common customer questions from the test page before installing live." />
            <ChecklistItem title="Install script" body="Paste the snippet into the website template, tag manager, or CMS custom code area." />
          </CardBody>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <h2 className="text-lg font-semibold text-harlo-ink">Allowed websites</h2>
          </CardHeader>
          <CardBody>
            {hasDomains ? (
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {allowedDomains.map((domain) => (
                  <div key={domain} className="flex items-center gap-3 rounded-lg border border-harlo-line p-3">
                    <WebsiteLogoIcon brandLogoUrl={brandLogoUrl} size="sm" fallback={<Globe2 size={16} />} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-harlo-ink">{domain}</p>
                      <p className="text-xs text-harlo-muted">Widget allowed</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-harlo-muted">
                No production domains have been added yet. Localhost is still allowed for the test page.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function CodeBlock({ value }: { value: string }) {
  return (
    <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-harlo-ink p-4 text-sm leading-6 text-white">
      <code>{value}</code>
    </pre>
  );
}

function ChecklistItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-harlo-line bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-harlo-teal">
          <CheckCircle2 size={17} />
        </span>
        <div>
          <p className="text-sm font-semibold text-harlo-ink">{title}</p>
          <p className="mt-1 text-sm leading-6 text-harlo-muted">{body}</p>
        </div>
      </div>
    </div>
  );
}

function WebsiteLogoIcon({
  brandLogoUrl,
  fallback,
  size
}: {
  brandLogoUrl: string | null;
  fallback: React.ReactNode;
  size: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-9 w-9" : "h-10 w-10";

  return (
    <span className={`grid ${sizeClass} shrink-0 place-items-center overflow-hidden rounded-lg bg-harlo-mist text-harlo-teal`}>
      {brandLogoUrl ? (
        <img
          src={brandLogoUrl}
          alt=""
          className="h-full w-full object-contain p-1.5"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        fallback
      )}
    </span>
  );
}

function StatusCard({
  icon,
  title,
  body,
  tone
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "ready" | "warning";
}) {
  return (
    <Card>
      <CardBody className="flex items-start gap-3">
        <span className={tone === "ready" ? "grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-harlo-mist text-harlo-teal" : "grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600"}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-harlo-ink">{title}</p>
          <p className="mt-1 break-words text-sm leading-6 text-harlo-muted">{body}</p>
        </div>
      </CardBody>
    </Card>
  );
}

function buildSnippet(origin: string, botId: string) {
  return `<script src="${origin}/widget.js" data-harlo-bot="${botId}" async></script>`;
}

function copyWithFallback(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Copy command failed");
  }
}
