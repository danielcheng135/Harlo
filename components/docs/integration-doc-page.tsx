import type { Route as NextRoute } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, ChevronRight, ClipboardCheck, Plug, Settings2, Sparkles, TestTube2, Wrench } from "lucide-react";
import type { IntegrationDoc } from "@/lib/docs";
import { integrationDocs } from "@/lib/docs";

export function IntegrationDocPageContent({ doc }: { doc: IntegrationDoc }) {
  const relatedDocs = integrationDocs.filter((integration) => integration.id !== doc.id).slice(0, 3);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:pt-14">
      <div className="overflow-hidden rounded-lg border border-harlo-line bg-white shadow-soft">
        <div className={`h-2 bg-gradient-to-r ${doc.accentClass}`} />
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.58fr)] lg:items-center">
          <div>
            <Link href="/docs/integrations" className="inline-flex items-center gap-2 text-sm font-semibold text-harlo-teal transition hover:text-harlo-navy">
              <ChevronRight size={15} className="rotate-180" />
              Back to integrations
            </Link>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-harlo-canvas ring-1 ring-harlo-line">
                <IntegrationLogo doc={doc} className="h-8 w-8" />
              </span>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-harlo-teal">{doc.eyebrow}</p>
                <h1 className="text-4xl font-semibold leading-[1.04] tracking-tight text-harlo-ink sm:text-5xl">{doc.name}</h1>
              </div>
            </div>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-harlo-muted">{doc.description}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/integrations" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-harlo-ink px-5 text-sm font-semibold text-white transition hover:bg-harlo-navy">
                Open integrations
                <ArrowRight size={16} />
              </Link>
              <Link href="/docs" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-harlo-line bg-white px-5 text-sm font-semibold text-harlo-ink transition hover:border-harlo-teal hover:text-harlo-teal">
                All docs
              </Link>
            </div>
          </div>

          <IntegrationFlowVisual doc={doc} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(280px,0.28fr)]">
        <div className="grid gap-6">
          <DocSection icon={Settings2} eyebrow="Setup" title={`Configure ${doc.name}`}>
            <div className="grid gap-3">
              {doc.setupSteps.map((step, index) => (
                <article key={step.title} className="grid gap-3 rounded-lg border border-harlo-line bg-white p-4 shadow-sm sm:grid-cols-[auto_minmax(0,1fr)]">
                  <span className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${doc.accentClass}`}>
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-harlo-ink">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-harlo-muted">{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </DocSection>

          <DocSection icon={ClipboardCheck} eyebrow="Configuration" title="Required fields and decisions">
            <div className="grid gap-4 md:grid-cols-2">
              {doc.requiredFields.map((field) => (
                <article key={field.label} className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
                  <CheckCircle2 size={18} className="text-harlo-teal" />
                  <h3 className="mt-4 font-semibold text-harlo-ink">{field.label}</h3>
                  <p className="mt-1 text-sm leading-6 text-harlo-muted">{field.detail}</p>
                </article>
              ))}
            </div>
          </DocSection>

          <DocSection icon={TestTube2} eyebrow="Testing" title="Verify before launch">
            <div className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
              <div className="grid gap-3">
                {doc.testSteps.map((step, index) => (
                  <div key={step} className="flex items-start gap-3 rounded-lg bg-harlo-canvas p-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-harlo-teal shadow-sm">{index + 1}</span>
                    <p className="text-sm font-medium leading-6 text-harlo-ink">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </DocSection>

          <DocSection icon={Wrench} eyebrow="Troubleshooting" title="Common fixes">
            <div className="grid gap-4 md:grid-cols-2">
              {doc.troubleshooting.map((item) => (
                <article key={item.title} className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
                  <h3 className="font-semibold text-harlo-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-harlo-muted">{item.body}</p>
                </article>
              ))}
            </div>
          </DocSection>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-harlo-ink">Best for</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {doc.bestFor.map((item) => (
                <span key={item} className="rounded-full bg-harlo-mist px-3 py-1 text-xs font-semibold text-harlo-teal">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm">
            <div className={`h-1.5 bg-gradient-to-r ${doc.accentClass}`} />
            <div className="p-4">
              <p className="text-sm font-semibold text-harlo-ink">Action summary</p>
              <div className="mt-3 grid gap-3 text-sm">
                <SummaryRow label="Trigger" value={doc.triggerLabel} />
                <SummaryRow label="Action" value={doc.actionLabel} />
                <SummaryRow label="Outcome" value={doc.outcomeLabel} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-harlo-ink">Related guides</p>
            <div className="mt-3 grid gap-2">
              {relatedDocs.map((related) => (
                <Link key={related.id} href={related.path as NextRoute} className="flex items-center justify-between gap-3 rounded-lg border border-harlo-line px-3 py-2 text-sm font-semibold text-harlo-muted transition hover:border-harlo-teal hover:text-harlo-ink">
                  <span className="flex min-w-0 items-center gap-2">
                    <IntegrationLogo doc={related} className="h-5 w-5" />
                    <span className="truncate">{related.name}</span>
                  </span>
                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function IntegrationFlowVisual({ doc }: { doc: IntegrationDoc }) {
  return (
    <div className="rounded-lg border border-harlo-line bg-harlo-canvas p-4">
      <div className="grid gap-3">
        <FlowStep label="Visitor intent" value={doc.triggerLabel} icon={<Plug size={18} />} />
        <div className="mx-auto h-6 w-px bg-harlo-line" />
        <FlowStep label="Harlo action" value={doc.actionLabel} logo={<IntegrationLogo doc={doc} className="h-7 w-7" />} />
        <div className="mx-auto h-6 w-px bg-harlo-line" />
        <FlowStep label="Provider result" value={doc.outcomeLabel} accentClass={doc.accentClass} />
      </div>
    </div>
  );
}

function FlowStep({ label, value, icon, logo, accentClass }: { label: string; value: string; icon?: ReactNode; logo?: ReactNode; accentClass?: string }) {
  return (
    <div className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${accentClass ? `bg-gradient-to-br text-white ${accentClass}` : "bg-harlo-mist text-harlo-teal"}`}>
          {logo ?? icon ?? <CheckCircle2 size={18} />}
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-harlo-muted">{label}</p>
          <p className="mt-1 text-base font-semibold text-harlo-ink">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DocSection({ icon: Icon, eyebrow, title, children }: { icon: typeof Sparkles; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-harlo-line bg-[#fbfdfc] p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-harlo-teal">{eyebrow}</p>
          <h2 className="text-2xl font-semibold tracking-tight text-harlo-ink">{title}</h2>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-harlo-canvas px-3 py-2">
      <span className="font-semibold text-harlo-muted">{label}</span>
      <span className="text-right font-semibold text-harlo-ink">{value}</span>
    </div>
  );
}

function IntegrationLogo({ doc, className }: { doc: IntegrationDoc; className: string }) {
  const Icon = doc.icon;

  if (doc.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={doc.logoUrl} alt="" className={className} />;
  }

  return <Icon className={className} />;
}
