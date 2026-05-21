import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { ArrowRight, Code2, Database, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { HeroVideo } from "@/components/hero-video";
import { OutcomesSection } from "@/components/landing/outcomes-section";
import { PricingLandingSections } from "@/components/landing/pricing-landing-sections";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingNav } from "@/components/marketing-nav";
import { Card, CardBody } from "@/components/ui/card";
import { getSignupHref } from "@/lib/onboarding/signup-url";
import { homeJsonLd } from "@/lib/seo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: {
    absolute: "Harlo | AI Agent for Website Answers and Qualified Leads"
  },
  description: "Harlo is an AI website chatbot that automates customer support, answers from approved knowledge, and captures qualified leads from every website conversation.",
  alternates: {
    canonical: "/"
  }
};

const features = [
  { title: "Answers from your knowledge", body: "Train Harlo on site pages, support docs, policies, and team-approved instructions.", icon: Database },
  { title: "On-brand customer chat", body: "Tune voice, colors, greetings, prompts, and lead capture without code-heavy setup.", icon: Sparkles },
  { title: "Clean lead handoff", body: "Collect the right details when a visitor needs a person, then preserve the conversation context.", icon: MessageSquare },
  { title: "Install once", body: "Ship a polished AI assistant with a lightweight website snippet and keep improving it from the dashboard.", icon: Code2 }
];

const workflow = [
  { step: "01", title: "Connect your knowledge", body: "Point Harlo at the pages, files, FAQs, and internal notes that should shape customer answers." },
  { step: "02", title: "Tune the experience", body: "Set the widget voice, greeting, lead fields, brand color, and fallback behavior from one dashboard." },
  { step: "03", title: "Capture the right moments", body: "When visitors need help, Harlo collects context, intent, and contact details before handoff." }
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const navCta = user
    ? { label: "Dashboard", href: "/dashboard" }
    : { label: "Sign in", href: "/auth/sign-in" };

  return (
    <main className="min-h-screen bg-[#f7faf8] text-harlo-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeJsonLd())
        }}
      />
      <Script
        src="/widget.js"
        data-harlo-organization="2a007ac5-01c5-4154-8a41-21f4dbcd2b43"
        strategy="afterInteractive"
      />
      <style>{`
        @keyframes harloPriceSlot {
          0% { opacity: 0; transform: translateY(100%); }
          45% { opacity: 1; }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes harloPriceSlotGhost {
          0% { opacity: 0.26; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-100%); }
        }
        @keyframes harloPriceSwap {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes harloBadgeSwap {
          0% { opacity: 0; transform: translateY(4px) scale(0.94); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <MarketingNav
        links={[
          { label: "Features", href: "#features" },
          { label: "Pricing", href: "/pricing" },
          { label: "Demo", href: "#demo" }
        ]}
        ctaLabel={navCta.label}
        ctaHref={navCta.href}
        ctaVariant="outline"
      />

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:pb-16 lg:pt-12">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-harlo-line bg-white px-3 py-1.5 text-sm font-medium text-harlo-navy shadow-sm">
            <ShieldCheck size={15} />
            AI support that knows your business
          </div>
          <h1 className="text-4xl font-semibold leading-[1.02] tracking-tight text-harlo-ink sm:text-5xl md:text-6xl">
            AI agent for website answers and qualified leads.
          </h1>
          <p className="mt-6 text-lg leading-8 text-harlo-muted">
            Answer visitors instantly with an AI website chatbot that automates support, stays grounded in approved business knowledge, and captures qualified leads from every conversation.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={getSignupHref()}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-harlo-ink px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-harlo-navy focus:outline-none focus:ring-2 focus:ring-harlo-teal focus:ring-offset-2 sm:w-auto"
            >
              Start free trial <ArrowRight size={17} />
            </Link>
            <a
              href="#workflow"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-harlo-line bg-white px-5 text-sm font-semibold text-harlo-ink transition hover:border-harlo-teal hover:text-harlo-teal focus:outline-none focus:ring-2 focus:ring-harlo-teal focus:ring-offset-2 sm:w-auto"
            >
              See how it works
            </a>
          </div>
        </div>

        <div id="demo" className="relative min-w-0">
          <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
            <div className="rounded-full bg-[#ff7a66] px-4 py-2 text-sm font-semibold text-white shadow-soft">
              Live preview
            </div>
          </div>
          <HeroVideo />
        </div>
      </section>

      <section id="features" className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="max-w-3xl">
            <SectionBadge>Features</SectionBadge>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink md:text-5xl">A simpler way to put AI on your website.</h2>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={feature.title} className="border-harlo-line shadow-none">
                <CardBody className="flex h-full flex-col">
                  <FeatureGraphic index={index} Icon={feature.icon} />
                  <h2 className="mt-5 text-base font-semibold text-harlo-ink">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-harlo-muted">{feature.body}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="border-y border-harlo-line bg-[#f7faf8]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <div>
              <SectionBadge>Workflow</SectionBadge>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink md:text-5xl">From blank widget to useful customer assistant.</h2>
              <p className="mt-4 leading-7 text-harlo-muted">
                Harlo is built for teams that want the value of AI support without turning the website into another software project.
              </p>
            </div>
            <Image
              src="/landing/workflow.png"
              alt="Static Remotion graphic showing the three-step Harlo launch path."
              width={1200}
              height={760}
              className="w-full rounded-[22px] shadow-soft"
            />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {workflow.map((item) => (
              <div key={item.step} className="group overflow-hidden rounded-lg border border-harlo-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-harlo-teal/50 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-harlo-mist text-base font-semibold text-harlo-teal">{item.step}</span>
                  <span className="rounded-full bg-harlo-canvas px-3 py-1 text-xs font-semibold text-harlo-muted">Step {item.step}</span>
                </div>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-harlo-mist">
                  <div className="h-full rounded-full bg-harlo-teal transition-all duration-500 group-hover:w-full" style={{ width: item.step === "01" ? "34%" : item.step === "02" ? "67%" : "100%" }} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-harlo-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-harlo-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <OutcomesSection />

      <PricingLandingSections />

      <MarketingFooter />
    </main>
  );
}

async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    return user;
  } catch {
    return null;
  }
}

function SectionBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-harlo-line bg-white px-3 py-1.5 text-sm font-semibold text-harlo-teal shadow-sm">
      <span className="h-2 w-2 rounded-full bg-harlo-blue" />
      {children}
    </span>
  );
}

function FeatureGraphic({ index, Icon }: { index: number; Icon: typeof Database }) {
  const themes = [
    {
      frame: "from-sky-50 to-cyan-50",
      icon: "bg-sky-100 text-sky-600",
      accent: "bg-sky-400",
      line: "bg-sky-200",
      chip: "bg-white text-sky-700"
    },
    {
      frame: "from-teal-50 to-emerald-50",
      icon: "bg-teal-100 text-teal-700",
      accent: "bg-teal-500",
      line: "bg-emerald-200",
      chip: "bg-white text-teal-700"
    },
    {
      frame: "from-rose-50 to-orange-50",
      icon: "bg-rose-100 text-rose-600",
      accent: "bg-rose-400",
      line: "bg-orange-200",
      chip: "bg-white text-rose-700"
    },
    {
      frame: "from-indigo-50 to-slate-50",
      icon: "bg-indigo-100 text-indigo-600",
      accent: "bg-indigo-500",
      line: "bg-slate-200",
      chip: "bg-white text-indigo-700"
    }
  ];
  const theme = themes[index];

  return (
    <div className={`relative h-48 overflow-hidden rounded-lg border border-harlo-line bg-gradient-to-br ${theme.frame} p-5`}>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.055)_1px,transparent_1px),linear-gradient(rgba(17,24,39,0.055)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60" />
      <div className="relative flex h-full flex-col gap-6">
        <div className="flex items-center justify-between gap-5">
          <span className={`grid h-10 w-10 place-items-center rounded-lg ${theme.icon}`}>
            <Icon size={21} />
          </span>
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${theme.chip}`}>
            0{index + 1}
          </span>
        </div>

        {index === 0 ? (
          <div className="grid gap-3 pb-1">
            {["Website pages", "Support docs", "Lead fields"].map((item, itemIndex) => (
              <div key={item} className="flex items-center gap-2 rounded-md bg-white/85 px-2.5 py-2 shadow-sm">
                <span className={`h-2 w-2 rounded-full ${itemIndex === 0 ? theme.accent : theme.line}`} />
                <span className="text-xs font-semibold text-harlo-ink">{item}</span>
              </div>
            ))}
          </div>
        ) : null}

        {index === 1 ? (
          <div className="grid gap-3 pb-1">
            <div className="mr-5 rounded-md bg-white px-3 py-2 text-xs font-semibold text-harlo-ink shadow-sm">How fast can we launch?</div>
            <div className={`ml-5 rounded-md px-3 py-2 text-xs font-semibold leading-5 text-white shadow-sm ${theme.accent}`}>Today, with your brand voice.</div>
          </div>
        ) : null}

        {index === 2 ? (
          <div className="mt-auto mb-1 rounded-lg bg-white/85 p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-harlo-ink">
              <span>Lead ready</span>
              <span className="text-rose-600">92%</span>
            </div>
            <div className="mt-3 space-y-2">
              <span className={`block h-2 w-5/6 rounded-full ${theme.line}`} />
              <span className={`block h-2 w-2/3 rounded-full ${theme.accent}`} />
            </div>
          </div>
        ) : null}

        {index === 3 ? (
          <div className="mt-auto mb-1 rounded-lg bg-harlo-ink p-3 text-xs font-semibold text-white shadow-sm">
            <div className="text-slate-400">&lt;script&gt;</div>
            <div className="mt-1 text-cyan-200">harlo.mount(widget)</div>
            <div className="mt-1 text-slate-400">&lt;/script&gt;</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
