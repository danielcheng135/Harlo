import type { Route as NextRoute } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  Eye,
  Globe2,
  MousePointerClick,
  PanelTop,
  Rocket,
  Wrench,
  type LucideIcon
} from "lucide-react";
import type { WidgetInstallDoc } from "@/lib/docs";
import { widgetInstallDocs, workspaceSnippet } from "@/lib/docs";

export function WidgetInstallPlatformPageContent({ doc }: { doc: WidgetInstallDoc }) {
  const relatedGuides = widgetInstallDocs.filter((platform) => platform.id !== doc.id).slice(0, 3);

  return (
    <section className="mx-auto max-w-[1440px] px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pt-12">
      <div className="relative overflow-hidden rounded-[22px] bg-harlo-blue text-white sm:rounded-[24px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_28%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_40%)]" />
        <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${doc.accentClass}`} />
        <div className="relative grid gap-10 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.7fr)] lg:items-center lg:p-10 xl:gap-16">
          <div className="min-w-0">
            <Link href="/docs/widget-install" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white">
              <ArrowLeft size={16} />
              Back to widget install
            </Link>
            <div className="mt-7 flex w-full max-w-full flex-col items-start gap-4 sm:flex-row sm:items-center">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white shadow-[0_16px_42px_rgba(3,16,32,0.18)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={doc.logoUrl} alt="" className="h-9 w-9 object-contain" />
              </span>
              <div className="w-full min-w-0 max-w-full">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/80">{doc.eyebrow}</p>
                <h1 className="max-w-full break-words text-4xl font-black leading-[0.98] tracking-[-0.05em] text-white sm:text-6xl">
                  Install Harlo on {doc.name}
                </h1>
              </div>
            </div>
            <p className="mt-6 max-w-3xl text-base leading-7 text-white/90 sm:text-xl sm:leading-8">{doc.description}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/widget" className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-white px-5 text-sm font-bold text-harlo-blue shadow-[0_5px_0_rgba(6,99,117,0.55)] transition hover:-translate-y-0.5">
                Copy install code
                <ArrowRight size={16} />
              </Link>
              <a
                href={doc.sourceHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] border border-white/30 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/15"
              >
                Platform docs
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          <PlatformInstallVisual doc={doc} />
        </div>
      </div>

      <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-12">
          <GuideSection icon={Clipboard} eyebrow="Before you start" title="Get the install ready">
            <div className="mb-4 rounded-[18px] border border-harlo-blue/15 bg-harlo-mist px-4 py-3 text-sm font-semibold leading-6 text-harlo-ink">
              You do not need to write code for this install. Copy the Harlo snippet from your dashboard, paste it exactly where the guide says, then publish your site.
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {doc.beforeYouStart.map((item) => (
                <article key={item} className="rounded-[18px] border border-harlo-line bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                  <CheckCircle2 size={18} className="text-harlo-blue" />
                  <p className="mt-4 text-sm font-semibold leading-6 text-harlo-ink">{item}</p>
                </article>
              ))}
            </div>
          </GuideSection>

          <GuideSection icon={MousePointerClick} eyebrow="Step by step" title={`Add Harlo in ${doc.name}`}>
            <div className="divide-y divide-harlo-line border-y border-harlo-line">
              {doc.steps.map((step, index) => (
                <article key={step.title} className="grid gap-4 py-7 sm:grid-cols-[48px_minmax(0,1fr)]">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-harlo-blue text-sm font-bold text-white shadow-[0_4px_0_#066375]">{index + 1}</span>
                  <div>
                    <h2 className="text-xl font-black tracking-[-0.03em] text-harlo-ink">{step.title}</h2>
                    <p className="mt-2 max-w-4xl text-sm leading-7 text-harlo-muted">{step.body}</p>
                    {step.details?.length ? (
                      <div className="mt-4 grid gap-2 rounded-[16px] bg-harlo-canvas p-4">
                        {step.details.map((detail) => (
                          <div key={detail} className="flex items-start gap-2 text-sm font-medium leading-6 text-harlo-muted">
                            <CheckCircle2 size={15} className="mt-1 shrink-0 text-harlo-blue" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </GuideSection>

          <GuideSection icon={Eye} eyebrow="Verification" title="Confirm the widget is live">
            <div className="grid gap-4 md:grid-cols-3">
              {doc.verifySteps.map((step, index) => (
                <article key={step} className="rounded-[18px] border border-harlo-line bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-harlo-mist text-sm font-bold text-harlo-blue">{index + 1}</span>
                  <p className="mt-4 text-sm font-semibold leading-6 text-harlo-ink">{step}</p>
                </article>
              ))}
            </div>
          </GuideSection>

          <GuideSection icon={Wrench} eyebrow="Troubleshooting" title="Fix the usual issues">
            <div className="grid gap-4 md:grid-cols-2">
              {doc.troubleshooting.map((item) => (
                <article key={item.title} className="rounded-[18px] border border-harlo-line bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                  <h2 className="text-lg font-black tracking-[-0.03em] text-harlo-ink">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-harlo-muted">{item.body}</p>
                </article>
              ))}
            </div>
          </GuideSection>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="overflow-hidden rounded-[18px] border border-harlo-line bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
            <div className={`h-1.5 bg-gradient-to-r ${doc.accentClass}`} />
            <div className="p-5">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-harlo-blue">Best for</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {doc.bestFor.map((item) => (
                  <span key={item} className="rounded-full bg-harlo-mist px-3 py-1 text-xs font-bold text-harlo-blue">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-harlo-line bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-harlo-blue">Reference</p>
            <a href={doc.sourceHref} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-between gap-3 rounded-[14px] bg-harlo-canvas px-3 py-3 text-sm font-semibold text-harlo-ink transition hover:bg-harlo-mist">
              <span>{doc.sourceLabel}</span>
              <ExternalLink size={15} className="shrink-0 text-harlo-blue" />
            </a>
          </div>

          <div className="rounded-[18px] border border-harlo-line bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-harlo-blue">Other builders</p>
            <div className="mt-4 grid gap-2">
              {relatedGuides.map((guide) => (
                <Link key={guide.id} href={guide.path as NextRoute} className="flex items-center justify-between gap-3 rounded-[14px] bg-harlo-canvas px-3 py-3 text-sm font-semibold text-harlo-muted transition hover:bg-harlo-mist hover:text-harlo-ink">
                  <span className="flex min-w-0 items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={guide.logoUrl} alt="" className="h-5 w-5 shrink-0 object-contain" />
                    <span className="truncate">{guide.name}</span>
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

function PlatformInstallVisual({ doc }: { doc: WidgetInstallDoc }) {
  return (
    <div className="min-w-0 max-w-full rounded-[22px] border border-white/25 bg-white p-4 text-harlo-ink shadow-[0_24px_70px_rgba(3,16,32,0.18)]">
      <div className="flex items-center justify-between border-b border-harlo-line pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-harlo-canvas ring-1 ring-harlo-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={doc.logoUrl} alt="" className="h-7 w-7 object-contain" />
          </span>
          <div>
            <p className="text-sm font-black tracking-[-0.02em]">{doc.name}</p>
            <p className="text-xs font-medium text-harlo-muted">Custom code area</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Ready</span>
      </div>

      <div className="grid gap-4 py-5">
        <VisualRow icon={PanelTop} label="Placement" value="Footer / Body end" />
        <VisualRow icon={Globe2} label="Scope" value="All pages or selected high-intent pages" />
        <VisualRow icon={Rocket} label="Publish" value="Save changes, publish, then test live" />
      </div>

      <div className="overflow-hidden rounded-[16px] border border-harlo-line bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-harlo-line bg-harlo-canvas px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-harlo-blue">Harlo snippet</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
        <pre className="max-h-[190px] overflow-auto whitespace-pre-wrap break-words p-4 text-xs font-semibold leading-6 text-harlo-ink">
          <code>{workspaceSnippet}</code>
        </pre>
      </div>
    </div>
  );
}

function VisualRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] bg-harlo-canvas p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-harlo-blue ring-1 ring-harlo-line">
        <Icon size={18} />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-harlo-muted">{label}</p>
        <p className="mt-1 text-sm font-semibold text-harlo-ink">{value}</p>
      </div>
    </div>
  );
}

function GuideSection({
  icon: Icon,
  eyebrow,
  title,
  children
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-harlo-blue text-white shadow-[0_4px_0_#066375]">
          <Icon size={19} />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-harlo-blue">{eyebrow}</p>
          <h2 className="text-3xl font-black tracking-[-0.04em] text-harlo-ink sm:text-4xl">{title}</h2>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
