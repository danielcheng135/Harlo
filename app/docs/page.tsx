import type { Metadata } from "next";
import type { Route as NextRoute } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, Code2, Library, Mail, MessageCircle, Plug, Sparkles } from "lucide-react";
import { DocsNav } from "@/components/docs/docs-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { docs } from "@/lib/docs";
import { siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Harlo Documentation | Setup and Business Guides",
  description: "Learn how to set up Harlo for your business, install the website widget, manage answers, review conversations, follow up with leads, and invite your team.",
  alternates: {
    canonical: "/docs"
  },
  openGraph: {
    title: "Harlo Documentation | Setup and Business Guides",
    description: "Guides for setting up Harlo, helping website visitors, managing answers, reviewing conversations, and following up with leads.",
    url: "/docs",
    siteName: siteConfig.name,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 760, alt: "Harlo documentation" }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Harlo Documentation | Setup and Business Guides",
    description: "Set up Harlo and learn the core business workflows.",
    images: [siteConfig.ogImage]
  }
};

export default function DocsPage() {
  const guideGroups = [
    { title: "Get started", description: "Install Harlo and shape how your agents answer.", ids: ["widget", "builder", "knowledge"] },
    { title: "Run your workspace", description: "Review conversations, follow up, and understand performance.", ids: ["conversations", "leads", "analytics", "team"] },
    { title: "Connect your tools", description: "Turn visitor intent into useful actions across your stack.", ids: ["integrations"] }
  ];

  return (
    <main className="min-h-screen bg-white text-harlo-ink">
      <DocsNav />

      <section className="relative overflow-hidden bg-[#07111a] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(13,143,170,0.28),transparent_32%),linear-gradient(135deg,#07111a_0%,#081621_62%,#073c47_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />
        <div className="relative mx-auto grid max-w-[1536px] gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.72fr)] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase text-harlo-blue">
              <BookOpen size={14} />
              Harlo documentation
            </span>
            <div className="mt-7">
              <h1 className="max-w-4xl text-4xl font-semibold leading-[1.04] sm:text-5xl lg:text-6xl">
                Everything you need to get Harlo working for your business.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                Follow practical guides for setup, daily workflows, lead follow-up, reporting, and connected actions.
              </p>
              <Link href="/docs/widget-install" className="mt-8 inline-flex h-12 w-fit items-center justify-center gap-2 rounded-lg bg-harlo-blue px-6 text-sm font-semibold text-white transition hover:bg-harlo-teal">
                Start with installation
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="absolute -inset-5 rounded-lg border border-white/5 bg-white/[0.025]" />
            <div className="relative overflow-hidden rounded-lg border border-white/15 bg-[#0b1d28] shadow-[0_28px_80px_rgba(0,0,0,0.35)]">
              <div className="flex h-11 items-center justify-between border-b border-white/10 px-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f6c453]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4fc98b]" />
                </div>
                <span className="text-xs font-semibold text-white/45">docs.harloai.co</span>
              </div>
              <div className="grid min-h-[350px] grid-cols-[132px_minmax(0,1fr)] sm:grid-cols-[165px_minmax(0,1fr)]">
                <div className="border-r border-white/10 bg-black/10 p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-harlo-blue/20 text-harlo-blue">
                      <BookOpen size={15} />
                    </span>
                    <span className="hidden sm:inline">Guides</span>
                  </div>
                  <div className="mt-5 grid gap-2">
                    <DocPreviewNav icon={Code2} label="Installation" active />
                    <DocPreviewNav icon={Sparkles} label="Builder" />
                    <DocPreviewNav icon={Library} label="Knowledge" />
                    <DocPreviewNav icon={Plug} label="Integrations" />
                  </div>
                </div>
                <div className="p-5 sm:p-7">
                  <span className="text-xs font-bold uppercase text-harlo-blue">Getting started</span>
                  <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Install the Harlo widget</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">Add Harlo to your website and test your first customer conversation.</p>
                  <div className="mt-6 grid gap-3">
                    {["Copy your install code", "Add it to your website", "Test as a visitor"].map((label, index) => (
                      <div key={label} className="flex items-center gap-3 border-b border-white/10 pb-3 last:border-0">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-xs font-bold text-harlo-blue">{index + 1}</span>
                        <span className="text-sm font-medium text-white/85">{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 rounded-full bg-harlo-blue" />
                  </div>
                  <p className="mt-2 text-xs font-medium text-white/45">Guide progress</p>
                </div>
              </div>
            </div>
            <span className="absolute -bottom-4 -right-3 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#0d3342] px-4 py-3 text-sm font-semibold text-white shadow-xl sm:-right-5">
              <CheckCircle2 size={17} className="text-harlo-blue" />
              Ready to launch
            </span>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1536px]">
          <div className="flex flex-col gap-3 border-b border-harlo-line pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-harlo-teal">Browse the guides</p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Choose where you want to begin.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-harlo-muted sm:text-right">
              Each guide focuses on a real Harlo workflow and links directly to the matching dashboard area.
            </p>
          </div>

          <div className="divide-y divide-harlo-line">
            {guideGroups.map((group) => (
              <div key={group.title} className="grid gap-6 py-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
                <div>
                  <h3 className="text-xl font-semibold">{group.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-harlo-muted">{group.description}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {docs
                    .filter((doc) => group.ids.includes(doc.id))
                    .map((doc) => {
                      const Icon = doc.icon;

                      return (
                        <Link
                          key={doc.id}
                          href={doc.path as NextRoute}
                          className="group flex min-h-[190px] flex-col rounded-lg border border-harlo-line bg-harlo-canvas p-5 transition hover:-translate-y-0.5 hover:border-harlo-blue hover:bg-white hover:shadow-soft"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-harlo-teal shadow-sm ring-1 ring-harlo-line">
                              <Icon size={19} />
                            </span>
                            <ChevronRight size={17} className="text-harlo-muted transition group-hover:translate-x-0.5 group-hover:text-harlo-teal" />
                          </div>
                          <h4 className="mt-5 text-lg font-semibold">{doc.label}</h4>
                          <p className="mt-2 text-sm leading-6 text-harlo-muted">{doc.description}</p>
                        </Link>
                      );
                    })}
                  {group.ids.includes("integrations") ? (
                    <Link href="/docs/integrations/slack" className="group flex min-h-[190px] flex-col rounded-lg bg-[#0a2633] p-5 text-white transition hover:-translate-y-0.5 hover:bg-[#0d3342] hover:shadow-soft">
                      <div className="flex items-center justify-between gap-4">
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-harlo-blue">
                          <Plug size={19} />
                        </span>
                        <ArrowRight size={17} className="text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white" />
                      </div>
                      <h4 className="mt-5 text-lg font-semibold">Provider guides</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-300">Open detailed setup and testing instructions for each supported integration.</p>
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-harlo-line bg-harlo-canvas px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-[1536px] gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(420px,0.72fr)] lg:items-center lg:gap-16">
          <div>
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#0a2633] text-harlo-blue">
              <Sparkles size={20} />
            </span>
            <div>
              <p className="mt-6 text-sm font-bold uppercase text-harlo-teal">Human support</p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Need a hand with your setup?</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-harlo-muted">
                Get direct help from the Harlo support team with installation, knowledge setup, integrations, billing, or anything that is blocking your launch.
              </p>
              <div className="mt-6 grid gap-3 text-sm text-harlo-muted sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={17} className="shrink-0 text-harlo-teal" />
                  Setup and troubleshooting
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={17} className="shrink-0 text-harlo-teal" />
                  Integration guidance
                </div>
              </div>
              <Link href="/support" className="mt-8 inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-[#0a2633] px-5 text-sm font-semibold text-white transition hover:bg-harlo-navy">
                Visit support
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="overflow-hidden rounded-lg border border-harlo-line bg-white shadow-soft">
              <div className="flex items-center justify-between border-b border-harlo-line px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                    <MessageCircle size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Harlo support</p>
                    <p className="text-xs text-harlo-muted">Setup assistance</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Available
                </span>
              </div>
              <div className="space-y-4 bg-[#fbfdfd] p-5 sm:p-6">
                <div className="max-w-[82%] rounded-lg rounded-tl-none bg-harlo-mist p-4 text-sm leading-6 text-harlo-ink">
                  I installed the widget, but it is not appearing on my pricing page.
                </div>
                <div className="ml-auto max-w-[88%] rounded-lg rounded-tr-none bg-[#0a2633] p-4 text-sm leading-6 text-white">
                  We can help. Send us the page URL and your workspace email, and we’ll check the domain and routing settings with you.
                </div>
                <div className="flex items-center gap-3 border-t border-harlo-line pt-4">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-harlo-teal ring-1 ring-harlo-line">
                    <Mail size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">support@harloai.co</p>
                    <p className="text-xs text-harlo-muted">Include screenshots or error text when possible.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}

function DocPreviewNav({ icon: Icon, label, active = false }: { icon: typeof Code2; label: string; active?: boolean }) {
  return (
    <div className={`flex h-10 items-center gap-2 rounded-lg px-2.5 text-xs font-semibold sm:text-sm ${active ? "bg-white/10 text-white" : "text-white/45"}`}>
      <Icon size={14} className="shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}
