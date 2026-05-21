"use client";

import { CheckCircle2, Clipboard, Globe2, RouteIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ToastViewport, useToast } from "@/components/ui/toast";

type WidgetInstallPanelProps = {
  brandLogoUrl: string | null;
  organizationId: string;
  allowedDomains: string[];
  agents: {
    id: string;
    name: string;
    routePatterns: string[];
    excludedRoutePatterns: string[];
    isDefault: boolean;
  }[];
};

const productionOrigin = normalizeWidgetOrigin(process.env.NEXT_PUBLIC_WIDGET_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://www.harloai.co");

export function WidgetInstallPanel({ brandLogoUrl, organizationId, allowedDomains, agents }: WidgetInstallPanelProps) {
  const { toast, showToast, dismissToast } = useToast();
  const productionSnippet = buildWorkspaceSnippet(productionOrigin, organizationId);
  const hasDomains = allowedDomains.length > 0;
  const routedAgents = agents.filter((agent) => agent.routePatterns.length > 0 || agent.excludedRoutePatterns.length > 0);
  const defaultAgent = agents.find((agent) => agent.isDefault) ?? agents[0];

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
              <p className="mt-1 text-sm text-harlo-muted">
                Paste this before the closing body tag. Harlo will choose the right agent from your page routing rules.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => copySnippet(productionSnippet, "Install snippet")}>
                <Clipboard size={16} />
                Copy snippet
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <CodeBlock value={productionSnippet} />
          </CardBody>
        </Card>

        <div className="min-w-0 space-y-4">
          <StatusCard
            icon={<WebsiteLogoIcon brandLogoUrl={brandLogoUrl} size="md" fallback={<Globe2 size={18} />} />}
            title={hasDomains ? "Allowed domains" : "No domains added"}
            body={hasDomains ? `${allowedDomains.length} website${allowedDomains.length === 1 ? "" : "s"} can load this widget.` : "Add domains in Builder before putting the widget on a live website."}
            tone={hasDomains ? "ready" : "warning"}
          />
          <StatusCard
            icon={<RouteIcon size={18} />}
            title="Page routing"
            body={`${routedAgents.length} agent${routedAgents.length === 1 ? "" : "s"} with route rules. Hidden route badges prevent the widget from loading on those pages.`}
            tone="ready"
          />
        </div>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <h2 className="text-lg font-semibold text-harlo-ink">Routing map</h2>
          <p className="mt-1 text-sm text-harlo-muted">
            The workspace snippet uses this map to choose the right agent for each website page.
          </p>
        </CardHeader>
        <CardBody className="space-y-3">
          {routedAgents.length > 0 ? (
            routedAgents.map((agent) => (
              <div key={agent.id} className="grid gap-4 rounded-lg border border-harlo-line bg-harlo-canvas p-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-sm font-semibold text-harlo-teal shadow-sm">
                    <RouteIcon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-harlo-ink">{agent.name}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-harlo-muted">Auto-routed</p>
                  </div>
                </div>
                <div className="min-w-0 space-y-3">
                  {agent.routePatterns.length > 0 ? (
                    <RouteChips patterns={agent.routePatterns} tone="include" />
                  ) : null}
                  {agent.excludedRoutePatterns.length > 0 ? (
                    <RouteChips patterns={agent.excludedRoutePatterns} tone="exclude" />
                  ) : null}
                  {agent.routePatterns.length === 0 && agent.excludedRoutePatterns.length === 0 ? (
                    <RouteChips patterns={[]} />
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-harlo-line bg-harlo-canvas p-5">
              <p className="font-semibold text-harlo-ink">No page routes yet</p>
              <p className="mt-1 text-sm leading-6 text-harlo-muted">
                Add route rules in Builder when a page should open a specific agent. Until then, the default agent handles every page.
              </p>
            </div>
          )}
          {defaultAgent ? (
            <div className="flex flex-col gap-3 rounded-lg border border-harlo-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-harlo-ink">{defaultAgent.name}</p>
                <p className="mt-1 text-sm text-harlo-muted">Fallback agent for every unmatched page.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-harlo-mist px-3 py-1 text-sm font-semibold text-harlo-teal">
                <ShieldCheck size={15} />
                Default
              </span>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0">
          <CardHeader>
            <h2 className="text-lg font-semibold text-harlo-ink">Launch checklist</h2>
          </CardHeader>
          <CardBody className="grid gap-3 md:grid-cols-2">
            <ChecklistItem title="Add allowed domains" body="Include the exact website domains that should be allowed to load this widget." />
            <ChecklistItem title="Train knowledge" body="Make sure the services, pricing, hours, policies, and quote requirements are covered." />
            <ChecklistItem title="Test the widget" body="Ask common customer questions from the test page before installing live." />
            <ChecklistItem title="Route agents" body="Use Builder page routing when specific pages should open a specific agent." />
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

function RouteChips({ patterns, emptyLabel = "Default fallback", tone = "include" }: { patterns: string[]; emptyLabel?: string; tone?: "include" | "exclude" }) {
  const visiblePatterns = patterns.slice(0, 4);
  const overflow = Math.max(0, patterns.length - visiblePatterns.length);
  const label = tone === "exclude" ? "Hidden" : "Allowed";
  const chipClass =
    tone === "exclude"
      ? "rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 shadow-sm"
      : "rounded-full border border-harlo-mist bg-white px-2.5 py-1 text-xs font-semibold text-harlo-teal shadow-sm";
  const labelClass =
    tone === "exclude"
      ? "rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-600"
      : "rounded-full bg-harlo-mist px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-harlo-teal";

  return (
    <div className="flex flex-wrap gap-2">
      {visiblePatterns.length > 0 ? (
        <>
          {visiblePatterns.map((pattern) => (
            <span key={`${tone}-${pattern}`} className={`${chipClass} inline-flex items-center gap-2`}>
              <span className={labelClass}>{label}</span>
              {pattern}
            </span>
          ))}
          {overflow > 0 ? (
            <span className="rounded-full border border-harlo-line bg-white px-2.5 py-1 text-xs font-semibold text-harlo-muted shadow-sm">
              +{overflow}
            </span>
          ) : null}
        </>
      ) : (
        <span className="rounded-full border border-harlo-line bg-white px-2.5 py-1 text-xs font-semibold text-harlo-muted shadow-sm">
          {emptyLabel}
        </span>
      )}
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

function buildWorkspaceSnippet(origin: string, organizationId: string) {
  return `<script src="${origin}/widget.js" data-harlo-organization="${organizationId}" async></script>`;
}

function normalizeWidgetOrigin(origin: string) {
  const trimmed = origin.trim().replace(/\/$/, "");

  if (!trimmed) {
    return "https://www.harloai.co";
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
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
