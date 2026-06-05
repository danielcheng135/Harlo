import type { Metadata } from "next";
import type { Route as NextRoute } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bug,
  CreditCard,
  LifeBuoy,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingNav } from "@/components/marketing-nav";
import { getSignupHref } from "@/lib/onboarding/signup-url";
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
    <main className="min-h-screen bg-[#f7faf8] text-harlo-ink">
      <MarketingNav
        links={[
          { label: "Contact", href: "#contact" },
          { label: "Topics", href: "#topics" },
          { label: "Troubleshooting", href: "#troubleshooting" },
          { label: "Docs", href: "/docs" }
        ]}
        ctaLabel="Start free trial"
        ctaHref={getSignupHref()}
        ctaVariant="dark"
      />

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:pt-14">
        <div className="overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm">
          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(300px,0.55fr)] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-harlo-line bg-harlo-canvas px-3 py-1.5 text-sm font-semibold text-harlo-teal">
                <LifeBuoy size={15} />
                Harlo support
              </span>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight text-harlo-ink sm:text-5xl">
                Get help launching, managing, and troubleshooting Harlo.
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-harlo-muted">
                Find setup guides, contact support, and get unstuck with website widget installation, AI answers, lead capture, integrations, billing, and account settings.
              </p>
            </div>
            <div className="rounded-lg border border-harlo-line bg-harlo-canvas p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-harlo-teal">Need a person?</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-harlo-ink">Email support@harloai.co</p>
              <p className="mt-3 text-sm leading-6 text-harlo-muted">
                Include your workspace email, what you were trying to do, and any screenshots or error text.
              </p>
              <Link
                href="mailto:support@harloai.co?subject=Harlo%20support%20request"
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-harlo-ink px-5 text-sm font-semibold text-white transition hover:bg-harlo-navy"
              >
                Contact support
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        <section id="contact" className="mt-6 grid gap-4 md:grid-cols-3">
          {supportOptions.map((option) => {
            const Icon = option.icon;
            const cardContent = (
              <>
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                  <Icon size={20} />
                </span>
                <h2 className="mt-5 text-xl font-semibold tracking-tight text-harlo-ink">{option.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-harlo-muted">{option.body}</p>
                <div className="mt-5 flex items-center justify-between border-t border-harlo-line pt-4 text-sm font-semibold text-harlo-teal">
                  {option.cta}
                  <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </div>
              </>
            );

            if (option.href.startsWith("mailto:")) {
              return (
                <a
                  key={option.title}
                  href={option.href}
                  className="group flex min-h-full flex-col rounded-lg border border-harlo-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-harlo-teal hover:shadow-soft"
                >
                  {cardContent}
                </a>
              );
            }

            return (
              <Link
                key={option.title}
                href={option.href as NextRoute}
                className="group flex min-h-full flex-col rounded-lg border border-harlo-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-harlo-teal hover:shadow-soft"
              >
                {cardContent}
              </Link>
            );
          })}
        </section>

        <section id="topics" className="mt-12">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-harlo-teal">Common topics</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink sm:text-4xl">Start with the guide closest to your issue.</h2>
            </div>
            <Link href="/docs" className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full border border-harlo-line bg-white px-5 text-sm font-semibold text-harlo-ink transition hover:border-harlo-teal hover:text-harlo-teal">
              View all docs
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {helpTopics.map((topic) => {
              const Icon = topic.icon;

              return (
                <Link key={topic.title} href={topic.href as NextRoute} className="rounded-lg border border-harlo-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-harlo-teal hover:shadow-soft">
                  <Icon size={22} className="text-harlo-teal" />
                  <h3 className="mt-5 text-lg font-semibold text-harlo-ink">{topic.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-harlo-muted">{topic.body}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="troubleshooting" className="mt-12 grid gap-6 rounded-lg border border-harlo-line bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
              <Bug size={21} />
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-harlo-ink">Reporting a bug or broken setup?</h2>
            <p className="mt-4 text-sm leading-6 text-harlo-muted">
              A little context helps us find the issue faster. Send the details below to support when something is not working as expected.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {issueChecklist.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-harlo-line bg-harlo-canvas p-4">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-harlo-teal" />
                <p className="text-sm font-semibold leading-6 text-harlo-ink">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </section>

      <MarketingFooter />
    </main>
  );
}
