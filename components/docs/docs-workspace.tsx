"use client";

import type { Route as NextRoute } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, Route, Search, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { docs, integrationDocs, isDocId, workspaceSnippet, type DocId, type DocSection } from "@/lib/docs";

const navGroups = [
  { title: "Setup", ids: ["widget", "builder", "knowledge"] as DocId[] },
  { title: "Operations", ids: ["conversations", "leads", "analytics", "team"] as DocId[] },
  { title: "Connected actions", ids: ["integrations"] as DocId[] }
];

export function DocsWorkspace({ initialDocId = "widget" }: { initialDocId?: DocId }) {
  const router = useRouter();
  const selectedId = isDocId(initialDocId) ? initialDocId : "widget";
  const selectedDoc = useMemo(() => docs.find((doc) => doc.id === selectedId) ?? docs[0], [selectedId]);

  function selectSection(id: DocId) {
    const doc = docs.find((item) => item.id === id);
    if (doc) {
      router.push(doc.path as NextRoute);
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:pt-14">
      <aside className="min-w-0">
        <div className="sticky top-28 rounded-lg border border-harlo-line bg-white/90 p-3 shadow-sm backdrop-blur">
          <Link
            href="/docs"
            className="flex items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-left transition hover:border-harlo-line hover:bg-harlo-canvas focus:outline-none focus:ring-2 focus:ring-harlo-teal/20"
            aria-label="Go to documentation home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
              <BookOpen size={18} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-harlo-ink">Documentation</p>
              <p className="text-sm text-harlo-muted">Business setup guides</p>
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

          <nav aria-label="Documentation sections" className="mt-4 hidden gap-4 lg:grid">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 text-xs font-bold uppercase tracking-[0.18em] text-harlo-muted">{group.title}</p>
                <div className="mt-2 grid gap-1">
                  {group.ids.map((id) => {
                    const doc = docs.find((item) => item.id === id)!;
                    const Icon = doc.icon;
                    const isSelected = selectedId === id;

                    return (
                      <Link
                        key={id}
                        href={doc.path as NextRoute}
                        className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                          isSelected ? "bg-harlo-mist text-harlo-teal shadow-sm" : "text-harlo-muted hover:bg-harlo-canvas hover:text-harlo-ink"
                        }`}
                      >
                        <Icon size={16} />
                        <span>{doc.label}</span>
                        <ChevronRight size={14} className={isSelected ? "opacity-100" : "opacity-40"} />
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
        <header className="rounded-lg border border-harlo-line bg-white p-5 shadow-sm sm:p-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-harlo-line bg-harlo-canvas px-3 py-1.5 text-sm font-semibold text-harlo-teal">
            <span className="h-2 w-2 rounded-full bg-harlo-blue" />
            Harlo docs
          </span>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight text-harlo-ink sm:text-5xl">
            Learn how to run Harlo for your business.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-harlo-muted">
            Choose a guide from the sidebar to focus on one part of Harlo, from installing the widget to managing conversations, leads, reporting, and team access.
          </p>
        </header>

        <DocPanel doc={selectedDoc} />
      </div>
    </div>
  );
}

function DocPanel({ doc }: { doc: DocSection }) {
  const Icon = doc.icon;

  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-harlo-line bg-white shadow-soft">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-harlo-teal text-white">
                  <Icon size={22} />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-harlo-teal">{doc.eyebrow}</p>
                  <h2 className="text-3xl font-semibold tracking-tight text-harlo-ink">{doc.title}</h2>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-base leading-7 text-harlo-muted">{doc.description}</p>
            </div>
            <Link href={doc.dashboardHref as NextRoute} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-harlo-ink px-5 text-sm font-semibold text-white transition hover:bg-harlo-navy">
              Open in dashboard
              <ArrowRight size={16} />
            </Link>
          </div>

          {doc.id === "widget" ? <WidgetSnippets /> : null}
          {doc.id === "integrations" ? <IntegrationDocsGrid /> : null}

          <div className="mt-8">
            <SectionHeading eyebrow="Workflow" title="How to use this page" />
            <div className="mt-4 grid gap-3">
              {doc.steps.map((step, index) => (
                <article key={step.title} className="grid gap-3 rounded-lg border border-harlo-line bg-harlo-canvas p-4 sm:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm font-bold text-harlo-teal shadow-sm">{index + 1}</span>
                  <div>
                    <h3 className="font-semibold text-harlo-ink">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-harlo-muted">{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <SectionHeading eyebrow="Reference" title="Key areas" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {doc.details.map((detail) => (
                <article key={detail.title} className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-harlo-teal" />
                    <div>
                      <h3 className="font-semibold text-harlo-ink">{detail.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-harlo-muted">{detail.body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <aside className="border-t border-harlo-line bg-[#fbfdfc] p-5 lg:border-l lg:border-t-0">
          <div className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-harlo-ink">In this section</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {doc.highlights.map((item) => (
                <span key={item} className="rounded-full bg-harlo-mist px-3 py-1 text-xs font-semibold text-harlo-teal">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-harlo-ink">Best next checks</p>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-harlo-muted">
              {doc.nextChecks.map((check) => (
                <MiniCheck key={check.text} icon={check.icon} text={check.text} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function IntegrationDocsGrid() {
  return (
    <div className="mt-8">
      <SectionHeading eyebrow="Provider guides" title="Choose the integration you want to configure" />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {integrationDocs.map((integration) => {
          const Icon = integration.icon;

          return (
            <Link
              key={integration.id}
              href={integration.path as NextRoute}
              className="group overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-harlo-teal/60 hover:shadow-soft"
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
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-harlo-teal">{integration.eyebrow}</p>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight text-harlo-ink">{integration.name}</h3>
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
    <div className="mt-8 grid gap-4">
      <SnippetCard
        icon={Route}
        title="Whole-site install code"
        body="Use one snippet across your website. Harlo chooses the right agent or hides the widget based on your page routing settings."
        code={workspaceSnippet}
      />
    </div>
  );
}

function SnippetCard({ icon: Icon, title, body, code }: { icon: typeof Sparkles; title: string; body: string; code: string }) {
  return (
    <article className="flex min-h-full flex-col overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm">
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
      <pre className="overflow-x-auto border-t border-harlo-line bg-harlo-ink p-4 text-sm leading-7 text-slate-100">
        <code>{code}</code>
      </pre>
    </article>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-harlo-teal">{eyebrow}</p>
      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-harlo-ink">{title}</h3>
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
