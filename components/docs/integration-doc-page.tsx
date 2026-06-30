import type { Route as NextRoute } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, ChevronRight, ClipboardCheck, Plug, Settings2, Sparkles, TestTube2, Wrench } from "lucide-react";
import type { IntegrationDoc } from "@/lib/docs";
import { integrationDocs } from "@/lib/docs";

export function IntegrationDocPageContent({ doc }: { doc: IntegrationDoc }) {
  const relatedDocs = integrationDocs.filter((integration) => integration.id !== doc.id).slice(0, 3);

  return (
    <section className="mx-auto max-w-[1440px] px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pt-12">
      <div className="relative overflow-hidden rounded-[22px] bg-harlo-blue text-white sm:rounded-[24px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_40%)]" />
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${doc.accentClass}`} />
        <div className="relative grid gap-10 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.65fr)] lg:items-center lg:p-10 xl:gap-16">
          <div className="min-w-0">
            <Link href="/docs/integrations" className="inline-flex items-center gap-2 text-sm font-semibold text-white/65 transition hover:text-white">
              <ChevronRight size={15} className="rotate-180" />
              Back to integrations
            </Link>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-white ring-1 ring-white/20">
                <IntegrationLogo doc={doc} className="h-8 w-8" />
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-white/80">{doc.eyebrow}</p>
                <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.05em] text-white sm:text-6xl">{doc.name}</h1>
              </div>
            </div>
            <p className="mt-5 max-w-3xl text-base leading-7 text-white/90 sm:text-xl sm:leading-8">{doc.description}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/integrations" className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-white px-5 text-sm font-bold text-harlo-blue shadow-[0_5px_0_rgba(6,99,117,0.55)] transition hover:-translate-y-0.5">
                Open integrations
                <ArrowRight size={16} />
              </Link>
              <Link href="/docs" className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] border border-white/30 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/15">
                All docs
              </Link>
            </div>
          </div>

          <IntegrationFlowVisual doc={doc} />
        </div>
      </div>

      <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-10">
          <DocSection icon={Settings2} eyebrow="Setup" title={`Configure ${doc.name}`}>
            <div className="divide-y divide-harlo-line border-y border-harlo-line">
              {doc.setupSteps.map((step, index) => (
                <article key={step.title} className="grid gap-4 py-6 sm:grid-cols-[44px_minmax(0,1fr)]">
                  <span className={`grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br text-sm font-bold text-white ${doc.accentClass}`}>
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-harlo-ink">{step.title}</h3>
                    <p className="mt-2 max-w-4xl text-sm leading-7 text-harlo-muted">{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </DocSection>

          <DocSection icon={ClipboardCheck} eyebrow="Configuration" title="Required fields and decisions">
            <div className="grid gap-4 md:grid-cols-2">
              {doc.requiredFields.map((field) => (
                <article key={field.label} className="rounded-[18px] border border-harlo-line bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                  <CheckCircle2 size={18} className="text-harlo-teal" />
                  <h3 className="mt-4 font-semibold text-harlo-ink">{field.label}</h3>
                  <p className="mt-1 text-sm leading-6 text-harlo-muted">{field.detail}</p>
                </article>
              ))}
            </div>
          </DocSection>

          <DocSection icon={TestTube2} eyebrow="Testing" title="Verify before launch">
            <div className="rounded-[18px] border border-harlo-line bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
              <div className="grid gap-3">
                {doc.testSteps.map((step, index) => (
                  <div key={step} className="flex items-start gap-3 border-b border-harlo-line pb-3 last:border-0 last:pb-0">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-harlo-mist text-xs font-bold text-harlo-teal">{index + 1}</span>
                    <p className="text-sm font-medium leading-6 text-harlo-ink">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </DocSection>

          <DocSection icon={Wrench} eyebrow="Troubleshooting" title="Common fixes">
            <div className="grid gap-4 md:grid-cols-2">
              {doc.troubleshooting.map((item) => (
                <article key={item.title} className="rounded-[18px] border border-harlo-line bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                  <h3 className="font-semibold text-harlo-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-harlo-muted">{item.body}</p>
                </article>
              ))}
            </div>
          </DocSection>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[18px] border border-harlo-line bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold text-harlo-ink">Best for</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {doc.bestFor.map((item) => (
                <span key={item} className="rounded-full bg-harlo-mist px-3 py-1 text-xs font-semibold text-harlo-teal">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-harlo-line bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
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

          <div className="rounded-[18px] border border-harlo-line bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold text-harlo-ink">Related guides</p>
            <div className="mt-3 grid gap-2">
              {relatedDocs.map((related) => (
                <Link key={related.id} href={related.path as NextRoute} className="flex items-center justify-between gap-3 rounded-lg bg-harlo-canvas px-3 py-2.5 text-sm font-semibold text-harlo-muted transition hover:bg-harlo-mist hover:text-harlo-ink">
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
    <div className="rounded-[18px] border border-white/25 bg-white/10 p-4">
      <div className="grid gap-3">
        <FlowStep label="Visitor intent" value={doc.triggerLabel} icon={<Plug size={18} />} />
        <div className="mx-auto h-5 w-px bg-white/20" />
        <FlowStep label="Harlo action" value={doc.actionLabel} logo={<IntegrationLogo doc={doc} className="h-7 w-7" />} />
        <div className="mx-auto h-5 w-px bg-white/20" />
        <FlowStep label="Provider result" value={doc.outcomeLabel} accentClass={doc.accentClass} />
      </div>
    </div>
  );
}

function FlowStep({ label, value, icon, logo, accentClass }: { label: string; value: string; icon?: ReactNode; logo?: ReactNode; accentClass?: string }) {
  return (
    <div className="rounded-[18px] border border-white/20 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${accentClass ? `bg-gradient-to-br text-white ${accentClass}` : "bg-harlo-mist text-harlo-teal"}`}>
          {logo ?? icon ?? <CheckCircle2 size={18} />}
        </span>
        <div>
          <p className="text-xs font-bold uppercase text-harlo-muted">{label}</p>
          <p className="mt-1 text-base font-semibold text-harlo-ink">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DocSection({ icon: Icon, eyebrow, title, children }: { icon: typeof Sparkles; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-harlo-blue text-white">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-harlo-blue">{eyebrow}</p>
          <h2 className="text-2xl font-black tracking-[-0.04em] text-harlo-ink sm:text-4xl">{title}</h2>
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
