"use client";

import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Hash,
  Inbox,
  Menu,
  MessageCircle,
  MousePointerClick,
  Route as RouteIcon,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CalendlyDemoButton } from "@/components/calendly-demo-button";
import { CtaPhoneGraphic } from "@/components/cta-phone-graphic";
import { IntegrationsShowcase } from "@/components/landing/integrations-showcase";
import { MarketingFooter } from "@/components/marketing-footer";
import { TRIAL_CONFIG } from "@/lib/billing/plans";
import { getSignupHref } from "@/lib/onboarding/signup-url";

const installSteps = [
  {
    title: "Connect Slack",
    body: "Open Harlo Integrations, choose Slack, and approve the workspace connection.",
    icon: MousePointerClick
  },
  {
    title: "Choose a channel",
    body: "Paste the Slack channel ID where lead notifications should arrive.",
    icon: Hash
  },
  {
    title: "Invite Harlo",
    body: "In Slack, open that channel and run /invite @Harlo so messages can post there.",
    icon: UserPlus
  },
  {
    title: "Save agents",
    body: "Select the Harlo agents that should send captured leads to Slack.",
    icon: Settings2
  }
] satisfies Array<{ title: string; body: string; icon: LucideIcon }>;

const outcomeCards = [
  {
    title: "Lead alerts with context",
    body: "Name, email, phone, custom fields, visitor question, and source page arrive in Slack together.",
    icon: BellRing
  },
  {
    title: "Faster follow-up",
    body: "Your team sees warm website intent where they already coordinate work.",
    icon: Clock3
  },
  {
    title: "Cleaner handoffs",
    body: "Every notification links the website conversation back to the action your team needs.",
    icon: RouteIcon
  }
] satisfies Array<{ title: string; body: string; icon: LucideIcon }>;

const useCases = [
  "Notify sales when a visitor asks for pricing or a demo.",
  "Alert support when Harlo captures a question that needs a person.",
  "Route service requests into an operations channel.",
  "Keep founders or managers close to high-intent website activity."
];

export function SlackLandingPage() {
  return (
    <main className="min-h-screen bg-white text-harlo-ink">
      <SlackNav />
      <HeroSection />
      <ResultsStrip />
      <HowItWorksSection />
      <InstallSection />
      <UseCasesSection />
      <IntegrationsShowcase
        tone="light"
        title="Slack is one part of a complete follow-up stack."
        description="Pair team alerts with scheduling, service intake, CRM contacts, audience sync, and spreadsheet exports from the same Harlo conversations."
      />
      <SecuritySection />
      <CtaSection />
      <MarketingFooter />
    </main>
  );
}

function SlackNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [
    { label: "How it works", href: "#how-it-works" },
    { label: "Install", href: "#install" },
    { label: "Integrations", href: "#integrations" },
    { label: "Security", href: "#security" }
  ];

  return (
    <header className="absolute inset-x-0 top-0 z-[100] px-4 pt-4">
      <div className="relative mx-auto max-w-7xl rounded-lg px-3 py-2 text-white">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 px-2" aria-label="Harlo home">
            <LogoMark tone="dark" />
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 text-sm font-semibold text-white/72 lg:flex">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href as Route} className="inline-flex items-center rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/auth/sign-in" className="rounded-full px-4 py-2 text-sm font-semibold text-white/76 transition hover:bg-white/10 hover:text-white">
              Sign in
            </Link>
            <Link href={getSignupHref()} className="inline-flex h-10 items-center justify-center rounded-lg bg-harlo-blue px-5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(13,143,170,0.34)] transition hover:-translate-y-0.5 hover:bg-harlo-teal">
              Start free trial
            </Link>
          </div>

          <button
            type="button"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white lg:hidden"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className={`absolute left-0 right-0 top-full z-[120] px-3 pt-3 transition-all duration-300 lg:hidden ${isOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`}>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#07111a]/95 p-2 shadow-[0_24px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href as Route} onClick={() => setIsOpen(false)} className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white">
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid gap-2 border-t border-white/10 pt-2">
              <Link href="/auth/sign-in" onClick={() => setIsOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-semibold text-white/80">
                Sign in
              </Link>
              <Link href={getSignupHref()} onClick={() => setIsOpen(false)} className="inline-flex h-11 items-center justify-center rounded-lg bg-harlo-blue px-5 text-sm font-semibold text-white">
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#07111a] px-4 pb-24 pt-28 text-white sm:px-6 sm:pb-28 lg:pb-32 lg:pt-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_26%,rgba(8,127,149,0.38),transparent_34%),linear-gradient(135deg,#07111a_0%,#08131d_48%,#063f4c_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.98fr_1.02fr] lg:gap-8">
        <div className="min-w-0">
          <SectionBadge variant="dark">
            <SlackLogo className="h-5 w-5" />
            Slack integration
          </SectionBadge>
          <h1 className="mt-6 max-w-3xl text-[2.65rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl sm:leading-[0.98] lg:text-5xl xl:text-6xl">
            Send qualified website leads straight into Slack.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Harlo answers visitors on your website, captures buying intent, and posts clean lead alerts into the Slack channels your team already watches.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={getSignupHref()} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-harlo-blue px-6 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(13,143,170,0.34)] transition hover:-translate-y-0.5 hover:bg-harlo-teal focus:outline-none focus:ring-2 focus:ring-white/60 sm:w-auto">
              Start free trial <ArrowRight size={16} />
            </Link>
            <CalendlyDemoButton className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60 sm:w-auto">
              Book a demo <ExternalLink size={15} />
            </CalendlyDemoButton>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-300">
            {[`${TRIAL_CONFIG.days}-day free trial`, `${TRIAL_CONFIG.credits} trial credits`, "No code required"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 size={14} className="text-harlo-blue" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <SlackHeroVisual />
      </div>
    </section>
  );
}

function SlackHeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem] lg:mx-0 lg:max-w-[600px] lg:justify-self-end">
      <div className="overflow-hidden rounded-lg border border-white/12 bg-white shadow-[0_38px_120px_rgba(0,0,0,0.42)]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#481A54] px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-white">
              <SlackLogo className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">Harlo leads</p>
              <p className="text-xs text-white/70">#sales-inbound</p>
            </div>
          </div>
          <span className="rounded-full bg-white/12 px-2.5 py-1 text-xs font-bold">Live</span>
        </div>
        <div className="grid min-h-[440px] md:grid-cols-[12rem_1fr]">
          <aside className="hidden border-r border-slate-200 bg-[#3F0E40] p-4 text-white md:block">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">Channels</p>
            {["#sales-inbound", "#support-escalations", "#founder-feed"].map((channel, index) => (
              <div key={channel} className={`mt-3 flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold ${index === 0 ? "bg-white/12 text-white" : "text-white/68"}`}>
                <Hash size={14} />
                {channel.replace("#", "")}
              </div>
            ))}
          </aside>
          <div className="bg-white p-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <p className="text-sm font-bold text-harlo-ink">#sales-inbound</p>
                <p className="text-xs font-semibold text-harlo-muted">Website lead alerts from Harlo</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">New lead</span>
            </div>
            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                  <Sparkles size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-harlo-ink">New Harlo lead captured</p>
                  <p className="mt-1 text-xs leading-5 text-harlo-muted">Visitor asked about pricing and wants a follow-up this week.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["Name", "Alex Johnson"],
                  ["Email", "alex@acme.com"],
                  ["Phone", "(555) 123-4567"],
                  ["Source", "/pricing"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-harlo-muted">{label}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-harlo-ink">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-[#F8FAFC] p-3">
                <p className="text-xs font-bold text-harlo-muted">Question</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-harlo-ink">Do you support multiple agents, and can someone walk me through pricing?</p>
              </div>
              <button type="button" className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-harlo-teal px-4 text-sm font-bold text-white">
                Open conversation <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsStrip() {
  const metrics = [
    { value: "Instant", label: "lead alerts in Slack", icon: BellRing },
    { value: "Full", label: "conversation context", icon: MessageCircle },
    { value: "One", label: "channel per workflow", icon: Hash },
    { value: "Zero", label: "manual forwarding", icon: Zap }
  ];

  return (
    <section className="relative z-10 -mt-16 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl rounded-lg border border-harlo-line bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
        <p className="text-center text-xs font-bold uppercase tracking-[0.24em] text-harlo-muted">Website conversations routed to your team</p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div key={metric.label} className="flex items-center gap-4 rounded-lg border border-transparent p-3 md:border-r md:last:border-r-0">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                  <Icon size={22} />
                </span>
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-harlo-ink">{metric.value}</p>
                  <p className="mt-1 text-sm leading-5 text-harlo-muted">{metric.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="How Slack works with Harlo"
          title="Harlo handles the visitor. Slack gets the handoff."
          body="When Harlo captures a qualified lead or follow-up request, it posts a structured message into the Slack channel you configure for that agent."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {outcomeCards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.title} className="rounded-lg border border-harlo-line bg-white p-6 shadow-sm">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                  <Icon size={22} />
                </span>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-harlo-ink">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-harlo-muted">{card.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function InstallSection() {
  return (
    <section id="install" className="bg-harlo-canvas px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div>
          <SectionBadge>Install Slack</SectionBadge>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-harlo-ink md:text-5xl">
            Connect the Slack app, choose a channel, and let Harlo notify the right team.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-harlo-muted">
            Slack is configured from the Harlo dashboard. Use one channel for all leads or point different agents at different channels.
          </p>
        </div>
        <div className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            {installSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className="rounded-lg border border-harlo-line bg-white p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-harlo-teal text-sm font-bold text-white">{index + 1}</span>
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                      <Icon size={18} />
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-harlo-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-harlo-muted">{step.body}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg border border-slate-800 bg-[#08111c] p-4 font-mono text-xs leading-6 text-slate-200 shadow-sm">
            <p className="text-slate-500">{"// In Slack, from the selected channel"}</p>
            <p>/invite @Harlo</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section id="use-cases" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Ways teams use it"
          title="Keep Slack close to the moments that need a human."
          align="center"
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {useCases.map((item) => (
            <div key={item} className="flex items-start gap-4 rounded-lg border border-harlo-line bg-white p-5 shadow-sm">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={18} />
              </span>
              <p className="text-base font-semibold leading-7 text-harlo-ink">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section id="security" className="bg-[#07111a] px-4 py-20 text-white sm:px-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_28px_90px_rgba(2,6,23,0.28)] backdrop-blur sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionBadge variant="dark">
              <ShieldCheck size={15} />
              Controlled handoff
            </SectionBadge>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Slack notifications stay scoped to the channels and agents you configure.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Harlo sends lead capture notifications through Slack OAuth and posts only to the channel ID saved for the integration.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "Channel-level routing", body: "Choose exactly where lead alerts should post.", icon: Hash },
              { title: "Agent selection", body: "Enable Slack only for the Harlo agents that need it.", icon: Settings2 },
              { title: "Lead context", body: "Send the captured details without making teammates dig.", icon: Inbox },
              { title: "Reconnect anytime", body: "Disconnect and reconnect Slack from the dashboard.", icon: ShieldCheck }
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
                  <Icon size={22} className="text-harlo-blue" />
                  <p className="mt-4 text-base font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section id="cta" className="relative overflow-hidden bg-[#07111a] px-4 py-20 text-white sm:px-6">
      <div className="relative mx-auto max-w-7xl">
        <div className="relative min-h-[500px] overflow-hidden rounded-2xl bg-harlo-navy px-6 py-14 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_30px_90px_rgba(2,6,23,0.32)] md:px-16 md:py-16 lg:pr-[28rem]">
          <div className="absolute inset-0 bg-gradient-to-br from-harlo-navy via-harlo-ink to-harlo-teal" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:56px_56px] opacity-40" />
          <CtaPhoneGraphic />
          <div className="relative flex min-h-[380px] max-w-3xl flex-col justify-center">
            <SectionBadge variant="dark">Harlo + Slack</SectionBadge>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">Turn website conversations into Slack-ready follow-up.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Launch Harlo, connect Slack, and send warm website leads into the channel your team already checks.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={getSignupHref()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-harlo-blue px-6 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(13,143,170,0.32)] transition hover:-translate-y-0.5 hover:bg-harlo-teal focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                Start free trial <ArrowRight size={16} />
              </Link>
              <CalendlyDemoButton className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60">
                <CalendarCheck size={16} />
                Book a demo
              </CalendlyDemoButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
  align = "left"
}: {
  eyebrow: string;
  title: string;
  body?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-harlo-teal">{eyebrow}</p>
      <h2 className="mt-4 text-4xl font-semibold tracking-tight text-harlo-ink md:text-5xl">{title}</h2>
      {body ? <p className="mt-4 text-base leading-7 text-harlo-muted">{body}</p> : null}
    </div>
  );
}

function SectionBadge({
  children,
  variant = "light"
}: {
  children: ReactNode;
  variant?: "light" | "dark";
}) {
  return (
    <span className={`inline-flex w-fit self-start items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold ${variant === "dark" ? "border border-white/15 bg-white/10 text-white" : "bg-harlo-mist text-harlo-teal"}`}>
      {children}
    </span>
  );
}

function LogoMark({ tone }: { tone: "dark" | "light" }) {
  return (
    <div className={`flex items-center gap-2 ${tone === "dark" ? "text-white" : "text-harlo-ink"}`}>
      <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg">
        <img src="/icon.png" alt="" className="h-full w-full object-contain" />
      </span>
      <span className="text-xl font-semibold tracking-tight">Harlo</span>
    </div>
  );
}

function SlackLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <img src="/slack-logo.svg" alt="" aria-hidden="true" className={className} />
  );
}
