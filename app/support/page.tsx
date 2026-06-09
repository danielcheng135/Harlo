import type { Metadata } from "next";
import type { Route as NextRoute } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bug,
  CheckCircle2,
  CreditCard,
  LifeBuoy,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import { DocsNav } from "@/components/docs/docs-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Harlo Support | Help, Docs, and Contact",
  description:
    "Get help with Harlo setup, website widget installation, billing, integrations, AI agents, lead capture, and account support.",
  alternates: {
    canonical: "/support"
  },
  openGraph: {
    title: "Harlo Support | Help, Docs, and Contact",
    description:
      "Find Harlo support resources, setup guides, contact options, and troubleshooting help for website AI agents.",
    url: "/support",
    siteName: siteConfig.name,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 760, alt: "Harlo support" }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Harlo Support | Help, Docs, and Contact",
    description: "Get help with Harlo setup, billing, integrations, and website AI agents.",
    images: [siteConfig.ogImage]
  }
};

const supportOptions = [
  {
    title: "Email support",
    body: "Send setup questions, account issues, billing questions, or bug reports to the Harlo support inbox.",
    href: "mailto:support@harloai.co?subject=Harlo%20support%20request",
    cta: "Email support",
    icon: Mail
  },
  {
    title: "Read the docs",
    body: "Use step-by-step guides for widget installation, knowledge setup, conversations, leads, analytics, and team management.",
    href: "/docs",
    cta: "Open docs",
    icon: BookOpen
  },
  {
    title: "Open your dashboard",
    body: "Manage agents, review conversations, update knowledge, configure integrations, and check workspace settings.",
    href: "/dashboard",
    cta: "Go to dashboard",
    icon: Sparkles
  }
];

const helpTopics = [
  {
    title: "Widget setup",
    body: "Install the snippet, verify allowed domains, customize the assistant, and test the website chat experience.",
    href: "/docs/widget-install",
    icon: MessageCircle
  },
  {
    title: "AI answers and knowledge",
    body: "Add website pages, files, FAQs, and business instructions so Harlo answers from approved sources.",
    href: "/docs/knowledge",
    icon: ShieldCheck
  },
  {
    title: "Leads and handoff",
    body: "Configure lead capture fields, review captured leads, and keep follow-up context attached.",
    href: "/docs/leads",
    icon: UsersRound
  },
  {
    title: "Billing and plans",
    body: "Review plan limits, credits, add-ons, checkout, portal access, and subscription questions.",
    href: "/dashboard/billing",
    icon: CreditCard
  }
];

const issueChecklist = [
  "The email address you use for Harlo",
  "Your workspace or company name",
  "The Harlo agent or page affected",
  "What you expected to happen",
  "What actually happened, including screenshots or error text",
  "The approximate time the issue happened"
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-white text-harlo-ink">
      <DocsNav />

      <section className="relative overflow-hidden bg-[#07111a] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(13,143,170,0.3),transparent_32%),linear-gradient(135deg,#07111a_0%,#081621_62%,#073c47_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />
        <div className="relative mx-auto grid max-w-[1536px] gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase text-harlo-blue">
              <LifeBuoy size={14} />
              Harlo support
            </span>
            <h1 className="mt-7 max-w-4xl text-4xl font-semibold leading-[1.04] sm:text-5xl lg:text-6xl">
              Get clear answers and get back to work.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Find the right guide, manage your workspace, or contact the Harlo team for help with setup, billing, integrations, and technical issues.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:support@harloai.co?subject=Harlo%20support%20request"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-harlo-blue px-6 text-sm font-semibold text-white transition hover:bg-harlo-teal"
              >
                Email support
                <ArrowRight size={16} />
              </a>
              <Link href="/docs" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10">
                Browse documentation
                <BookOpen size={16} />
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-sm font-bold uppercase text-harlo-blue">Contact support</p>
            <a href="mailto:support@harloai.co?subject=Harlo%20support%20request" className="mt-3 block text-2xl font-semibold transition hover:text-harlo-blue">
              support@harloai.co
            </a>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Include your workspace email, what you were trying to do, and any screenshots or error text.
            </p>
            <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="shrink-0 text-harlo-blue" />
                Setup and account help
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="shrink-0 text-harlo-blue" />
                Billing and integration questions
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="shrink-0 text-harlo-blue" />
                Bug reports and technical issues
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1536px]">
          <div className="border-b border-harlo-line pb-8">
            <p className="text-sm font-bold uppercase text-harlo-teal">Choose a path</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Start with the fastest route to an answer.</h2>
          </div>

          <div className="grid divide-y divide-harlo-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {supportOptions.map((option) => {
              const Icon = option.icon;
              const content = (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#0a2633] text-harlo-blue">
                      <Icon size={20} />
                    </span>
                    <ArrowRight size={17} className="text-harlo-muted transition group-hover:translate-x-0.5 group-hover:text-harlo-teal" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{option.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-harlo-muted">{option.body}</p>
                  <p className="mt-5 text-sm font-semibold text-harlo-teal">{option.cta}</p>
                </>
              );

              const className = "group block px-0 py-8 transition md:px-8 md:first:pl-0 md:last:pr-0";

              return option.href.startsWith("mailto:") ? (
                <a key={option.title} href={option.href} className={className}>
                  {content}
                </a>
              ) : (
                <Link key={option.title} href={option.href as NextRoute} className={className}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="topics" className="border-y border-harlo-line bg-harlo-canvas px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1536px]">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-harlo-teal">Common topics</p>
              <h2 className="mt-2 text-3xl font-semibold text-harlo-ink sm:text-4xl">Find the guide closest to your issue.</h2>
            </div>
            <Link href="/docs" className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg border border-harlo-line bg-white px-5 text-sm font-semibold text-harlo-ink transition hover:border-harlo-teal hover:text-harlo-teal">
              View all docs
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {helpTopics.map((topic) => {
              const Icon = topic.icon;

              return (
                <Link key={topic.title} href={topic.href as NextRoute} className="group rounded-lg border border-harlo-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-harlo-teal hover:shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                      <Icon size={19} />
                    </span>
                    <ArrowRight size={16} className="text-harlo-muted transition group-hover:translate-x-0.5 group-hover:text-harlo-teal" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-harlo-ink">{topic.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-harlo-muted">{topic.body}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="troubleshooting" className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-[1536px] gap-10 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#0a2633] text-harlo-blue">
              <Bug size={21} />
            </span>
            <p className="mt-6 text-sm font-bold uppercase text-harlo-teal">Troubleshooting</p>
            <h2 className="mt-2 text-3xl font-semibold text-harlo-ink sm:text-4xl">Reporting a bug or broken setup?</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-harlo-muted">
              A little context helps us find the issue faster. Send the details below to support when something is not working as expected.
            </p>
            <a href="mailto:support@harloai.co?subject=Harlo%20bug%20report" className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0a2633] px-5 text-sm font-semibold text-white transition hover:bg-harlo-navy">
              Report an issue
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="divide-y divide-harlo-line border-y border-harlo-line">
            {issueChecklist.map((item) => (
              <div key={item} className="flex items-center gap-4 py-4">
                <CheckCircle2 size={18} className="shrink-0 text-harlo-teal" />
                <p className="text-sm font-semibold leading-6 text-harlo-ink">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
