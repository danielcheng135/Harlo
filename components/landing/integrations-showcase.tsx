import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CheckCircle2, MessageCircle, Sparkles, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MARKETING_INTEGRATIONS } from "@/lib/integrations/marketing";

type IntegrationsShowcaseProps = {
  tone?: "light" | "dark";
  title?: string;
  description?: string;
};

export function IntegrationsShowcase({
  tone = "dark",
  title = "Turn visitor intent into the next action automatically.",
  description = "Harlo can schedule meetings, notify your team, create service and CRM handoffs, grow an audience, or keep a clean spreadsheet without making visitors repeat themselves."
}: IntegrationsShowcaseProps) {
  const isDark = tone === "dark";

  return (
    <section
      id="integrations"
      className={`px-4 py-20 sm:px-6 ${isDark ? "bg-[#07111a] text-white" : "bg-harlo-canvas text-harlo-ink"}`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.78fr] lg:items-end">
          <div className="max-w-3xl">
            <p className={`text-sm font-bold uppercase tracking-[0.22em] ${isDark ? "text-harlo-blue" : "text-harlo-teal"}`}>
              Connected actions
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">{title}</h2>
            <p className={`mt-5 max-w-2xl text-base leading-7 ${isDark ? "text-slate-300" : "text-harlo-muted"}`}>
              {description}
            </p>
          </div>

          <div className={`grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 rounded-lg border p-4 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-harlo-line bg-white"}`}>
            <FlowNode icon={MessageCircle} label="Visitor intent" isDark={isDark} />
            <ArrowRight size={16} className={isDark ? "text-white/35" : "text-harlo-muted"} />
            <FlowNode icon={Sparkles} label="Harlo decides" isDark={isDark} active />
            <ArrowRight size={16} className={isDark ? "text-white/35" : "text-harlo-muted"} />
            <FlowNode icon={Workflow} label="Action runs" isDark={isDark} />
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MARKETING_INTEGRATIONS.map((integration) => (
            <article
              key={integration.key}
              className={`flex min-h-[220px] flex-col rounded-lg border p-5 transition duration-300 hover:-translate-y-1 ${
                isDark
                  ? "border-white/10 bg-white/[0.045] hover:border-harlo-blue/55 hover:bg-white/[0.07]"
                  : "border-harlo-line bg-white shadow-sm hover:border-harlo-teal/45 hover:shadow-soft"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white shadow-sm">
                  <img
                    src={integration.logoUrl}
                    alt={`${integration.name} logo`}
                    width={28}
                    height={28}
                    loading="lazy"
                    className="h-7 w-7 object-contain"
                  />
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${integration.accentClass}`}>
                  {integration.category}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-semibold">{integration.name}</h3>
              <p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-300" : "text-harlo-muted"}`}>
                {integration.description}
              </p>
              <Link
                href={integration.docsHref as Route}
                className={`mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold ${
                  isDark ? "text-harlo-blue hover:text-white" : "text-harlo-teal hover:text-harlo-ink"
                }`}
              >
                {integration.action}
                <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>

        <div className={`mt-6 flex flex-col justify-between gap-5 border-t pt-6 md:flex-row md:items-center ${isDark ? "border-white/10" : "border-harlo-line"}`}>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <PlanAvailability
              label="Growth"
              detail={`All ${MARKETING_INTEGRATIONS.length} integration providers`}
              isDark={isDark}
            />
            <PlanAvailability
              label="Pro"
              detail={`All ${MARKETING_INTEGRATIONS.length} integration providers with higher plan capacity`}
              isDark={isDark}
            />
          </div>
          <Link
            href="/docs/integrations"
            className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
              isDark
                ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                : "border-harlo-line bg-white text-harlo-ink hover:border-harlo-teal hover:text-harlo-teal"
            }`}
          >
            Explore integration docs
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FlowNode({
  icon: Icon,
  label,
  isDark,
  active = false
}: {
  icon: LucideIcon;
  label: string;
  isDark: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <span
        className={`grid h-10 w-10 place-items-center rounded-lg ${
          active ? "bg-harlo-teal text-white" : isDark ? "bg-white/10 text-harlo-blue" : "bg-harlo-mist text-harlo-teal"
        }`}
      >
        <Icon size={18} />
      </span>
      <span className={`text-xs font-semibold leading-4 ${isDark ? "text-slate-200" : "text-harlo-muted"}`}>{label}</span>
    </div>
  );
}

function PlanAvailability({ label, detail, isDark }: { label: string; detail: string; isDark: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-semibold ${isDark ? "text-slate-200" : "text-harlo-muted"}`}>
      <CheckCircle2 size={16} className={isDark ? "text-harlo-blue" : "text-harlo-teal"} />
      <strong className={isDark ? "text-white" : "text-harlo-ink"}>{label}</strong>
      {detail}
    </span>
  );
}
