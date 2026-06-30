"use client";

import type { Route as NextRoute } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, ExternalLink, Route, Sparkles } from "lucide-react";
import { docs, integrationDocs, isDocId, widgetInstallDocs, workspaceSnippet, type DocId, type DocSection } from "@/lib/docs";

const navGroups = [
  { title: "Setup", ids: ["widget", "builder", "knowledge"] as DocId[] },
  { title: "Operations", ids: ["conversations", "leads", "analytics", "team"] as DocId[] },
  { title: "Connected actions", ids: ["integrations"] as DocId[] }
];

export function DocsWorkspace({ initialDocId = "widget" }: { initialDocId?: DocId }) {
  const router = useRouter();
  const selectedId = isDocId(initialDocId) ? initialDocId : "widget";
  const selectedDoc = docs.find((doc) => doc.id === selectedId) ?? docs[0];

  function selectSection(id: DocId) {
    const doc = docs.find((item) => item.id === id);
    if (doc) {
      router.push(doc.path as NextRoute);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1440px] gap-8 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:pt-12">
      <aside className="min-w-0 lg:border-r lg:border-harlo-line lg:pr-6">
        <div className="sticky top-24">
          <Link
            href="/docs"
            className="flex items-center gap-3 rounded-[14px] px-2 py-2 text-left transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-harlo-teal/20"
            aria-label="Go to documentation home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-harlo-blue text-white">
              <BookOpen size={18} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-harlo-ink">Documentation</p>
              <p className="text-xs text-harlo-muted">Harlo product guides</p>
            </div>
          </Link>

          <label className="mt-4 block lg:hidden">
            <span className="sr-only">Select documentation section</span>
            <select
              value={selectedId}
              onChange={(event) => selectSection(event.target.value as DocId)}
              className="h-11 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm font-semibold text-harlo-ink outline-none focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/15"
            >
              {docs.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.label}
                </option>
              ))}
            </select>
          </label>

          <nav aria-label="Documentation sections" className="mt-6 hidden gap-6 lg:grid">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 text-xs font-bold uppercase text-harlo-muted">{group.title}</p>
                <div className="mt-2 grid gap-1">
                  {group.ids.map((id) => {
                    const doc = docs.find((item) => item.id === id)!;
                    const Icon = doc.icon;
                    const isSelected = selectedId === id;

                    return (
                      <Link
                        key={id}
                        href={doc.path as NextRoute}
                        className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm font-semibold transition ${
                          isSelected ? "bg-harlo-blue text-white shadow-[0_5px_0_#066375]" : "text-harlo-muted hover:bg-white hover:text-harlo-ink"
                        }`}
                      >
                        <Icon size={16} />
                        <span>{doc.label}</span>
                        <ChevronRight size={14} className={isSelected ? "text-white/80" : "opacity-35"} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <div className="min-w-0">
        <DocPanel doc={selectedDoc} />
      </div>
    </div>
  );
}

function DocPanel({ doc }: { doc: DocSection }) {
  const Icon = doc.icon;

  return (
    <article>
      <header className="relative overflow-hidden rounded-[22px] bg-harlo-blue px-5 py-8 text-white sm:rounded-[24px] sm:px-8 sm:py-10 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_18%,rgba(255,255,255,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_40%)]" />
        <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-harlo-blue">
                <Icon size={21} />
              </span>
              <p className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-harlo-blue">{doc.eyebrow}</p>
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:text-6xl">{doc.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-white/90 sm:text-xl sm:leading-8">{doc.description}</p>
          </div>
          <Link href={doc.dashboardHref as NextRoute} className="inline-flex h-12 w-fit shrink-0 items-center justify-center gap-2 rounded-[16px] bg-white px-5 text-sm font-bold text-harlo-blue shadow-[0_5px_0_rgba(6,99,117,0.55)] transition hover:-translate-y-0.5">
            Open in dashboard
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <div className="grid gap-4 border-b border-harlo-line py-8 md:grid-cols-2">
        <section className="rounded-[18px] border border-harlo-line bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-semibold text-harlo-ink">Covered in this guide</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {doc.highlights.map((item) => (
              <span key={item} className="rounded-full bg-harlo-mist px-3 py-1.5 text-xs font-semibold text-harlo-teal">
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-[18px] border border-harlo-line bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-semibold text-harlo-ink">Before you finish</p>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-harlo-muted">
            {doc.nextChecks.map((check) => (
              <MiniCheck key={check.text} icon={check.icon} text={check.text} />
            ))}
          </div>
        </section>
      </div>

      <div className="py-10">
        {doc.id === "widget" ? <WidgetSnippets /> : null}
        {doc.id === "integrations" ? <IntegrationDocsGrid /> : null}

        <section className={doc.id === "widget" || doc.id === "integrations" ? "mt-12" : ""}>
          <SectionHeading eyebrow="Workflow" title="Follow the setup step by step" />
          <div className="mt-6 divide-y divide-harlo-line border-y border-harlo-line">
            {doc.steps.map((step, index) => (
              <article key={step.title} className="grid gap-4 py-6 sm:grid-cols-[44px_minmax(0,1fr)] sm:py-7">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-harlo-blue text-sm font-bold text-white shadow-[0_4px_0_#066375]">{index + 1}</span>
                <div>
                  <h3 className="text-lg font-semibold text-harlo-ink">{step.title}</h3>
                  <p className="mt-2 max-w-4xl text-sm leading-7 text-harlo-muted">{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <SectionHeading eyebrow="Reference" title="Key areas to understand" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {doc.details.map((detail) => (
              <article key={detail.title} className="rounded-[18px] border border-harlo-line bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-harlo-teal" />
                  <div>
                    <h3 className="font-semibold text-harlo-ink">{detail.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-harlo-muted">{detail.body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}

function IntegrationDocsGrid() {
  return (
    <div>
      <SectionHeading eyebrow="Provider guides" title="Choose the integration you want to configure" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrationDocs.map((integration) => {
          const Icon = integration.icon;

          return (
            <Link
              key={integration.id}
              href={integration.path as NextRoute}
              className="group overflow-hidden rounded-[18px] border border-harlo-line bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-harlo-blue/70 hover:shadow-[0_22px_55px_rgba(15,23,42,0.12)]"
            >
              <div className={`h-2 bg-gradient-to-r ${integration.accentClass}`} />
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-harlo-canvas ring-1 ring-harlo-line">
                    {integration.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={integration.logoUrl} alt="" className="h-7 w-7 object-contain" />
                    ) : (
                      <Icon size={21} className="text-harlo-teal" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-harlo-teal">{integration.eyebrow}</p>
                    <h3 className="mt-1 text-xl font-semibold text-harlo-ink">{integration.name}</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-harlo-muted">{integration.description}</p>
                <div className="mt-4 grid gap-2 rounded-lg bg-harlo-canvas p-3 text-xs font-semibold text-harlo-muted">
                  <div className="flex items-center justify-between gap-3">
                    <span>Trigger</span>
                    <span className="text-harlo-ink">{integration.triggerLabel}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Action</span>
                    <span className="text-harlo-ink">{integration.actionLabel}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-harlo-line pt-4 text-sm font-semibold text-harlo-teal">
                  Open {integration.name} guide
                  <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function WidgetSnippets() {
  return (
    <div className="grid gap-4">
      <SectionHeading eyebrow="Install code" title="Add Harlo across your website" />
      <SnippetCard
        icon={Route}
        title="Whole-site install code"
        body="Use one snippet across your website. Harlo chooses the right agent or hides the widget based on your page routing settings."
        code={workspaceSnippet}
      />
      <div className="mt-4">
        <SectionHeading eyebrow="No-code guides" title="Choose your website builder" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {widgetInstallDocs.map((platform) => (
            <Link
              key={platform.id}
              href={platform.path as NextRoute}
              className="group rounded-[18px] border border-harlo-line bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-harlo-blue/70 hover:shadow-[0_22px_55px_rgba(15,23,42,0.12)]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-harlo-canvas ring-1 ring-harlo-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={platform.logoUrl} alt="" className="h-7 w-7 object-contain" />
                </span>
                <ExternalLink size={16} className="text-harlo-muted transition group-hover:translate-x-0.5 group-hover:text-harlo-blue" />
              </div>
              <h3 className="mt-5 text-xl font-black tracking-[-0.03em] text-harlo-ink">{platform.name}</h3>
              <p className="mt-2 text-sm leading-6 text-harlo-muted">{platform.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function SnippetCard({ icon: Icon, title, body, code }: { icon: typeof Sparkles; title: string; body: string; code: string }) {
  return (
    <article className="flex min-h-full flex-col overflow-hidden rounded-[18px] border border-harlo-line bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <div className="flex-1 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
            <Icon size={18} />
          </span>
          <div>
            <h3 className="font-semibold text-harlo-ink">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-harlo-muted">{body}</p>
          </div>
        </div>
      </div>
      <pre className="overflow-x-auto border-t border-harlo-line bg-harlo-canvas p-4 text-sm font-semibold leading-7 text-harlo-ink">
        <code>{code}</code>
      </pre>
    </article>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.16em] text-harlo-blue">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-harlo-ink sm:text-4xl">{title}</h2>
    </div>
  );
}

function MiniCheck({ icon: Icon, text }: { icon: typeof Sparkles; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
        <Icon size={14} />
      </span>
      <p>{text}</p>
    </div>
  );
}
