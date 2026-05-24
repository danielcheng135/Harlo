"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Code2,
  Database,
  Info,
  Mail,
  Menu,
  MessageCircle,
  MousePointerClick,
  Plus,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  UsersRound,
  X,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CalendlyDemoButton } from "@/components/calendly-demo-button";
import { CtaPhoneGraphic } from "@/components/cta-phone-graphic";
import { HeroVideo } from "@/components/hero-video";
import {
  BILLING_ADD_ONS,
  BILLING_PLANS,
  TRIAL_CONFIG,
  formatPrice,
  type BillingInterval,
  type BillingPlan,
  type BillingPlanKey
} from "@/lib/billing/plans";
import { getSignupHref } from "@/lib/onboarding/signup-url";

const metrics = [
  { value: "84%", label: "Questions answered without human help", icon: MessageCircle },
  { value: "32", label: "High-intent leads captured this week", icon: UserPlus },
  { value: "2.4K", label: "Conversations handled this month", icon: TrendingUp },
  { value: "18h+", label: "Saved for support teams each week", icon: Clock3 }
];

const leverageCards = [
  {
    title: "Answer repeat questions",
    body: "Visitors get approved answers before they bounce or open a ticket.",
    icon: MessageCircle,
    tone: "teal"
  },
  {
    title: "Qualify intent",
    body: "Pricing, timeline, service fit, and urgency become structured lead signals.",
    icon: UsersRound,
    tone: "coral"
  },
  {
    title: "Route handoffs",
    body: "Your team gets the question, transcript, and next step in one view.",
    icon: RouteIcon,
    tone: "blue"
  },
  {
    title: "Reveal knowledge gaps",
    body: "See what visitors ask and where your website needs clearer answers.",
    icon: BarChart3,
    tone: "gold"
  }
] satisfies Array<{ title: string; body: string; icon: LucideIcon; tone: "teal" | "coral" | "blue" | "gold" }>;

const faqItems = [
  {
    question: "What counts as a message credit?",
    answer:
      "Message credits are used when Harlo generates assistant replies. Plan credits reset each billing period, and add-on credits can extend capacity when traffic spikes."
  },
  {
    question: "Can I change plans later?",
    answer:
      "Yes. You can start with Starter, move to Growth as traffic increases, or upgrade to Pro for higher volume and priority support."
  },
  {
    question: "Do I need engineering help to install Harlo?",
    answer:
      "Most teams only need to paste one widget snippet into their website. The dashboard handles knowledge, styling, lead fields, and behavior."
  },
  {
    question: "What happens when Harlo cannot answer?",
    answer:
      "Harlo can collect lead details, preserve the conversation context, and help route the visitor to your team instead of guessing."
  },
  {
    question: "Where do captured leads show up?",
    answer:
      "Captured leads appear in the Harlo dashboard with contact details, conversation context, and the visitor intent your team needs for follow-up."
  },
  {
    question: "Can my team manage Harlo together?",
    answer:
      "Yes. Team members can help manage knowledge, review leads, update widget settings, and keep the website assistant aligned as your workspace grows."
  }
];

const compareRows = [
  {
    label: "Message credits",
    detail: "Included assistant replies each billing period.",
    values: { starter: "500", growth: "4,000", pro: "15,000" }
  },
  {
    label: "Included agents",
    detail: "Separate assistants for sites, brands, or workflows.",
    values: { starter: "1", growth: "1", pro: "1" }
  },
  {
    label: "Included seats",
    detail: "Team members who can manage Harlo.",
    values: { starter: "1", growth: "3", pro: "5" }
  },
  {
    label: "Knowledge updates",
    detail: "How Harlo keeps approved answers current.",
    values: { starter: "Manual", growth: "Auto-retrain", pro: "Auto-retrain" }
  },
  {
    label: "Support",
    detail: "Help level included with the workspace.",
    values: { starter: "Standard", growth: "Standard", pro: "Priority" }
  },
  {
    label: "Lead capture",
    detail: "Capture intent, contact details, and conversation context.",
    values: { starter: "Included", growth: "Included", pro: "Included" }
  },
  {
    label: "Analytics",
    detail: "Conversation trends, top intents, and knowledge gaps.",
    values: { starter: "Basic", growth: "Advanced", pro: "Advanced" }
  }
] satisfies Array<{ label: string; detail: string; values: Record<BillingPlanKey, string> }>;

const planDescriptions: Record<BillingPlanKey, string> = {
  starter: "For small teams launching one assistant.",
  growth: "For steady traffic and automation.",
  pro: "For higher volume and priority support."
};

const addOnMeta = {
  auto_recharge_credits: { label: "Usage", icon: Zap, accent: "bg-sky-50 text-sky-600" },
  extra_agent: { label: "Agents", icon: Bot, accent: "bg-emerald-50 text-emerald-600" },
  extra_seat: { label: "Seats", icon: UsersRound, accent: "bg-indigo-50 text-indigo-600" },
  remove_branding: { label: "Brand", icon: Sparkles, accent: "bg-rose-50 text-rose-500" }
};

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "#hero" },
      { label: "Features", href: "#product" },
      { label: "Pricing", href: "#pricing" },
      { label: "Compare", href: "#compare" }
    ]
  },
  {
    title: "Solutions",
    links: [
      { label: "Customer Support", href: "/customer-support-ai-agent" },
      { label: "Lead Generation", href: "/ai-lead-capture-chatbot" },
      { label: "Small Business", href: "/website-chatbot-for-small-business" },
      { label: "Website Chatbot", href: "/ai-website-chatbot" }
    ]
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "FAQ", href: "#faq" },
      { label: "Demo", href: "#cta" },
      { label: "Sign in", href: "/auth/sign-in" }
    ]
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "mailto:support@harloai.co" },
      { label: "Privacy", href: "/privacy" },
      { label: "Cookies", href: "/cookie-policy" },
      { label: "Terms", href: "/terms" }
    ]
  }
];

export function RootHomepage() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className="min-h-screen bg-white text-harlo-ink">
      <StickyNav />
      <HeroSection />
      <ResultsPanel />
      <BeforeAfterSection />
      <LeverageSection />
      <ProductProofSection />
      <LaunchSessionSection />
      <WorkflowSection />
      <FormsComparisonSection />
      <PricingSection interval={interval} onIntervalChange={setInterval} />
      <AddOnsSection />
      <ComparePlansSection interval={interval} onIntervalChange={setInterval} />
      <FaqSection openFaq={openFaq} onOpenFaq={setOpenFaq} />
      <CtaSection interval={interval} />
      <HomeFooter />
    </main>
  );
}

function StickyNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [
    { label: "Product", href: "#product" },
    { label: "Solutions", href: "#leverage" },
    { label: "Resources", href: "#faq" },
    { label: "Pricing", href: "#pricing" }
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
              <Link
                key={item.label}
                href={item.href as Route}
                className="inline-flex items-center rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/auth/sign-in" className="rounded-full px-4 py-2 text-sm font-semibold text-white/76 transition hover:bg-white/10 hover:text-white">
              Sign in
            </Link>
            <Link
              href={getSignupHref()}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-harlo-blue px-5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(13,143,170,0.34)] transition hover:-translate-y-0.5 hover:bg-harlo-teal focus:outline-none focus:ring-2 focus:ring-white/60"
            >
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

        <div
          className={`absolute left-0 right-0 top-full z-[120] px-3 pt-3 transition-all duration-300 lg:hidden ${isOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
            }`}
        >
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#07111a]/95 p-2 shadow-[0_24px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href as Route}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
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
    <section id="hero" className="relative overflow-hidden bg-[#07111a] px-4 pb-24 pt-28 text-white sm:px-6 sm:pb-28 lg:pb-32 lg:pt-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_26%,rgba(8,127,149,0.38),transparent_34%),linear-gradient(135deg,#07111a_0%,#08131d_48%,#063f4c_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.98fr_1.02fr] lg:gap-6">
        <div className="min-w-0">
          <SectionBadge variant="dark">
            <Sparkles size={14} className="text-white" />
            AI agent for websites
          </SectionBadge>
          <h1 className="mt-6 max-w-3xl text-[2.65rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl sm:leading-[0.98] lg:text-5xl xl:text-6xl">
            <span className="block">Stop losing</span>
            <span className="block md:whitespace-nowrap">high-intent visitors</span>
            <span className="block"><span className="text-harlo-blue">to unanswered</span></span>
            <span className="block text-harlo-blue">questions.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Harlo answers instantly from approved knowledge, captures qualified leads, and hands off with full conversation context.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={getSignupHref()}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-harlo-blue px-6 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(13,143,170,0.34)] transition hover:-translate-y-0.5 hover:bg-harlo-teal focus:outline-none focus:ring-2 focus:ring-white/60 sm:w-auto"
            >
              Start free trial <ArrowRight size={16} />
            </Link>
            <CalendlyDemoButton className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60 sm:w-auto">
              <CalendarCheck size={16} />
              Book a demo
            </CalendlyDemoButton>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-300">
            {[
              `${TRIAL_CONFIG.days}-day free trial`,
              `${TRIAL_CONFIG.credits} trial credits`,
              "Cancel anytime"
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 size={14} className="text-harlo-blue" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[28rem] sm:max-w-[34rem] lg:mx-0 lg:max-w-[520px] lg:justify-self-end xl:max-w-[600px]">
          <HeroVideo className="rounded-lg border-white/12 shadow-[0_38px_120px_rgba(0,0,0,0.42)]" />
        </div>
      </div>
    </section>
  );
}

function ResultsPanel() {
  return (
    <section className="relative z-10 -mt-16 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl rounded-lg border border-harlo-line bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
        <p className="text-center text-xs font-bold uppercase tracking-[0.24em] text-harlo-muted">Real results from real conversations</p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div key={metric.value} className="flex items-center gap-4 rounded-lg border border-transparent p-3 md:border-r md:last:border-r-0">
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
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-harlo-line pt-5">
          <span className="mr-2 text-sm font-semibold text-harlo-muted">Built for support, sales, and operations teams</span>
          {["Support ops", "Revenue teams", "Founder-led", "Service businesses"].map((item) => (
            <span key={item} className="rounded-full border border-harlo-line bg-harlo-canvas px-3 py-1.5 text-xs font-semibold text-harlo-muted">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function BeforeAfterSection() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="What changes after Harlo"
          title="Every visitor gets a useful answer. Every high-intent visitor gets captured."
          align="center"
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <FlowCard
            label="Before Harlo"
            tone="muted"
            steps={[
              { icon: MessageCircle, label: "Visitor has a question" },
              { icon: Clock3, label: "Can't find an answer" },
              { icon: MousePointerClick, label: "Leaves or waits" },
              { icon: X, label: "Opportunity lost" }
            ]}
          />
          <FlowCard
            label="After Harlo"
            tone="active"
            steps={[
              { icon: Sparkles, label: "Visitor asks on your website" },
              { icon: Database, label: "Harlo answers instantly" },
              { icon: UsersRound, label: "Intent detected and captured" },
              { icon: CheckCircle2, label: "Routed with full context" }
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function LeverageSection() {
  return (
    <section id="leverage" className="bg-harlo-canvas px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Where Harlo creates leverage"
          title="One website assistant, four business outcomes."
          body="Harlo is built around the moments that decide whether a visitor becomes an answered customer, a qualified lead, or another missed signal."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {leverageCards.map((card) => (
            <OutcomeCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductProofSection() {
  return (
    <section id="product" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Product proof"
          title="Approved answers, captured intent, and improvement signals in one place."
          body="Harlo gives teams the result they want: fewer repeated questions, warmer handoffs, and a website assistant that keeps learning from real conversations."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <ApprovedKnowledgeCard />
          <LeadCaptureCard />
          <InsightsCard />
        </div>
      </div>
    </section>
  );
}

function LaunchSessionSection() {
  const steps = [
    { label: "Connect sources", detail: "Pages, docs, policies", icon: Database },
    { label: "Customize widget", detail: "Voice, greeting, color", icon: Sparkles },
    { label: "Install snippet", detail: "One script on the site", icon: Code2 },
    { label: "Review conversations", detail: "Improve from demand", icon: BarChart3 }
  ];

  return (
    <section className="bg-white px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div>
          <SectionBadge>Launch in one working session</SectionBadge>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-harlo-ink md:text-5xl">
            Connect the assistant, tune the experience, and start learning from real visitors.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-harlo-muted">
            The launch path is intentionally short: start with approved knowledge, style the widget, paste the snippet, then refine Harlo from real conversations.
          </p>
        </div>
        <div className="rounded-lg border border-harlo-line bg-harlo-canvas p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.label} className="relative rounded-lg border border-harlo-line bg-white p-4">
                  {index < steps.length - 1 ? <span className="absolute left-[calc(100%-0.25rem)] top-10 hidden h-px w-4 bg-harlo-line md:block" /> : null}
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                    <Icon size={18} />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-harlo-ink">{step.label}</p>
                  <p className="mt-1 text-xs leading-5 text-harlo-muted">{step.detail}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-lg border border-slate-800 bg-[#08111c] p-4 font-mono text-xs leading-6 text-slate-200 shadow-sm">
              <p className="text-slate-500">{"// Install Harlo once"}</p>
              <p>&lt;script src=&quot;https://cdn.harlo.ai/widget.js&quot;</p>
              <p className="pl-4">data-workspace=&quot;workspace_live&quot;</p>
              <p className="pl-4">data-agent=&quot;website-assistant&quot; /&gt;</p>
            </div>
            <div className="rounded-lg border border-harlo-line bg-white p-4">
              {[
                ["Brand voice", true],
                ["Lead capture", true],
                ["Fallback handoff", true],
                ["Source citations", false]
              ].map(([label, enabled]) => (
                <div key={label as string} className="flex items-center justify-between border-b border-harlo-line py-2 last:border-b-0">
                  <span className="text-sm font-semibold text-harlo-muted">{label}</span>
                  <span className={`h-6 w-11 rounded-full p-1 transition ${enabled ? "bg-harlo-teal" : "bg-slate-200"}`}>
                    <span className={`block h-4 w-4 rounded-full bg-white transition ${enabled ? "translate-x-5" : ""}`} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="workflow" className="bg-harlo-canvas px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-[92rem] overflow-hidden rounded-[1.75rem] border border-harlo-line bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.1)] sm:p-8 lg:p-10">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-harlo-mist px-3.5 py-2 text-sm font-bold text-harlo-teal">
              <Zap size={17} />
              Launch path
            </span>
            <h2 className="mt-7 max-w-4xl text-4xl font-semibold leading-[1.06] tracking-tight text-harlo-ink md:text-5xl lg:text-6xl">
              Launch the assistant, then improve from real conversations.
            </h2>
            <p className="mt-5 text-lg leading-8 text-harlo-muted">
              Three simple steps to go live fast and get better with every conversation.
            </p>
          </div>
          <span className="text-base font-semibold text-harlo-muted lg:pt-5">setup.harlo/workflow</span>
        </div>

        <div className="mt-10 xl:hidden">
          <WorkflowTimeline />
          <WorkflowLivePreview />
        </div>

        <div className="relative mt-10 hidden gap-x-6 gap-y-6 xl:grid xl:grid-cols-[1.04fr_0.96fr]">
          <div className="pointer-events-none absolute bottom-10 left-6 top-24 w-0.5 bg-harlo-teal" aria-hidden="true" />
          <div />
          <WorkflowPreviewHeader />
          <WorkflowTimelineStep
            number="01"
            icon={Database}
            title="Connect"
            body="Add your content. Harlo learns from the sources you approve."
            status="Sources syncing"
            visual={<SourceListMini />}
          />
          <WorkflowPreviewPanel>
            <TrainingPreviewPanel />
          </WorkflowPreviewPanel>
          <WorkflowTimelineStep
            number="02"
            icon={RouteIcon}
            title="Tune"
            body="Customize the experience to match your brand and capture what matters."
            status="Widget published"
            visual={<WidgetSettingsMini />}
          />
          <div className="grid gap-5 rounded-lg border border-harlo-line bg-white p-4 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <TuneChatVisual />
            <TuneSettings />
          </div>
          <WorkflowTimelineStep
            number="03"
            icon={MousePointerClick}
            title="Capture"
            body="Capture intent, route with context, and hand off faster."
            status="Leads captured"
            visual={<LeadCapturedMini />}
          />
          <WorkflowPreviewPanel>
            <LeadPreviewPanel />
          </WorkflowPreviewPanel>
        </div>

        <div className="mt-9 grid gap-5 border-t border-harlo-line pt-7 lg:grid-cols-3">
          {[
            { icon: Clock3, title: "Ready in one session", body: "Go live in 5-10 minutes." },
            { icon: TrendingUp, title: "Improve continuously", body: "Insights from every conversation." },
            { icon: ShieldCheck, title: "Secure by design", body: "Your data stays protected." }
          ].map((item, index) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className={`flex items-center gap-4 ${index > 0 ? "lg:border-l lg:border-harlo-line lg:pl-10" : ""}`}>
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-harlo-teal text-harlo-teal">
                  <Icon size={27} />
                </span>
                <div>
                  <p className="text-lg font-semibold text-harlo-ink">{item.title}</p>
                  <p className="mt-1 text-base font-semibold text-harlo-muted">{item.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const workflowSources = [
  { label: "Website pages", tone: "bg-harlo-mist text-harlo-teal" },
  { label: "Support policy", tone: "bg-emerald-50 text-emerald-600" },
  { label: "Pricing guide", tone: "bg-rose-50 text-rose-500" },
  { label: "Team notes", tone: "bg-violet-50 text-violet-500" }
];

function WorkflowTimeline() {
  return (
    <div className="relative">
      <div className="absolute left-[1.35rem] top-10 hidden h-[calc(100%-5rem)] w-0.5 bg-harlo-teal lg:block" aria-hidden="true" />
      <div className="lg:pl-0">
        <WorkflowTimelineStep
          number="01"
          icon={Database}
          title="Connect"
          body="Add your content. Harlo learns from the sources you approve."
          status="Sources syncing"
          visual={<SourceListMini />}
        />
        <WorkflowTimelineStep
          number="02"
          icon={RouteIcon}
          title="Tune"
          body="Customize the experience to match your brand and capture what matters."
          status="Widget published"
          visual={<WidgetSettingsMini />}
        />
        <WorkflowTimelineStep
          number="03"
          icon={MousePointerClick}
          title="Capture"
          body="Capture intent, route with context, and hand off faster."
          status="Leads captured"
          visual={<LeadCapturedMini />}
        />
      </div>
    </div>
  );
}

function WorkflowTimelineStep({
  number,
  icon: Icon,
  title,
  body,
  status,
  visual
}: {
  number: string;
  icon: LucideIcon;
  title: string;
  body: string;
  status: string;
  visual: React.ReactNode;
}) {
  return (
    <div className="relative grid gap-5 py-6 first:pt-0 last:pb-0 before:absolute before:left-0 before:right-0 before:top-0 before:h-px before:bg-harlo-line first:before:hidden md:grid-cols-[3.5rem_1fr_15rem] md:items-center lg:grid-cols-[4.5rem_1fr_16rem] xl:before:left-[4.5rem] xl:first:pt-6 xl:first:before:block xl:last:pb-6">
      <div className="relative z-10 flex md:justify-start">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[linear-gradient(135deg,#0d8faa,#087f95)] text-lg font-bold text-white shadow-[0_14px_26px_rgba(8,127,149,0.18)]">
          {number}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-[3.75rem_1fr] sm:items-start">
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
          <Icon size={24} />
        </span>
        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-harlo-ink">{title}</h3>
          <p className="mt-3 max-w-xs text-base leading-7 text-harlo-muted">{body}</p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-harlo-teal">
            <CheckCircle2 size={16} />
            {status}
          </p>
        </div>
      </div>
      <div>{visual}</div>
    </div>
  );
}

function SourceListMini({ progress = false }: { progress?: boolean }) {
  return (
    <div className="w-full rounded-lg border border-harlo-line bg-white p-3 shadow-sm">
      <div className="space-y-2">
        {workflowSources.map((source) => (
          <div key={source.label} className="flex items-center gap-2 rounded-lg border border-harlo-line bg-white px-2.5 py-2">
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${source.tone}`}>
              <Database size={12} />
            </span>
            <span className="min-w-0 flex-1 truncate text-xs font-bold text-harlo-ink">{source.label}</span>
            {progress ? (
              <>
                <span className="hidden h-1.5 min-w-24 rounded-full bg-harlo-teal sm:block" />
                <span className="text-xs font-semibold text-harlo-muted">100%</span>
              </>
            ) : (
              <span className="text-[11px] font-bold text-harlo-muted">Synced</span>
            )}
            <CheckCircle2 size={14} className="shrink-0 fill-emerald-500 text-white" />
          </div>
        ))}
      </div>
      {!progress ? (
        <button type="button" className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-harlo-line bg-white text-sm font-bold text-harlo-ink">
          <Plus size={15} />
          Add source
        </button>
      ) : null}
    </div>
  );
}

function TuneChatVisual() {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm">
      <div className="flex items-center justify-between bg-harlo-teal px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-white/15">
            <Sparkles size={14} />
          </span>
          <span className="text-sm font-bold">Harlo</span>
        </div>
        <span className="text-xs font-bold">Online</span>
      </div>
      <div className="p-4">
        <div className="max-w-[120px] rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold leading-5 text-harlo-ink">How can I help you?</div>
        <div className="ml-auto mt-3 max-w-[160px] rounded-lg bg-harlo-teal px-4 py-3 text-sm font-bold leading-5 text-white">I need pricing and a callback.</div>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <span className="text-xs font-semibold text-harlo-muted">Ask a question...</span>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-harlo-teal text-white">
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}

function TuneSettings() {
  return (
    <div className="grid gap-3 text-xs md:grid-cols-[5.75rem_1fr_auto] md:items-center">
      <span className="font-bold text-harlo-muted">Brand color</span>
      <div className="flex items-center gap-2">
        <span className="h-6 w-6 rounded-md bg-[#077F95]" />
        <span className="rounded-md border border-harlo-line bg-white px-2.5 py-2 font-bold text-harlo-muted">#077F95</span>
      </div>
      <span />
      <span className="font-bold text-harlo-muted">Welcome message</span>
      <span className="rounded-md border border-harlo-line bg-white px-3 py-2 font-semibold text-harlo-muted">How can I help you?</span>

    </div>
  );
}

function WidgetSettingsMini() {
  return (
    <div className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-bold text-harlo-ink">Widget</p>
      <TuneSettings />
    </div>
  );
}

function LeadCapturedMini() {
  return (
    <div className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
      <LeadDetails compact />
      <button type="button" className="mt-3 flex h-8 w-full items-center justify-center gap-1 rounded-lg bg-slate-100 text-xs font-bold text-harlo-ink">
        View full conversation <ArrowRight size={13} />
      </button>
    </div>
  );
}

function LeadDetails({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-harlo-ink">Lead captured</p>
        {!compact ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">New lead</span> : null}
      </div>
      <div className={`${compact ? "mt-3 space-y-2 text-[11px]" : "mt-4 space-y-3 text-xs"}`}>
        {[
          ["Name", "Alex Johnson"],
          ["Email", "alex@acme.com"],
          ["Intent", "Pricing"],
          ["Source", "/pricing"]
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <span className="font-medium text-harlo-muted">{label}</span>
            <span className="font-bold text-harlo-ink">{value}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function WorkflowPreviewHeader() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-t-xl xl:px-4 xl:pb-4">
      <h3 className="text-lg font-semibold text-harlo-ink">Live preview</h3>
      <div className="flex items-center gap-2 text-xs font-bold">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-harlo-teal text-white">1</span>
        <span className="grid h-6 w-6 place-items-center rounded-full border border-harlo-line text-harlo-muted">2</span>
        <span className="grid h-6 w-6 place-items-center rounded-full border border-harlo-line text-harlo-muted">3</span>
      </div>
    </div>
  );
}

function WorkflowPreviewPanel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-harlo-line bg-white p-4">{children}</div>;
}

function TrainingPreviewPanel() {
  return (
    <>
      <p className="text-sm font-bold text-harlo-ink">Training your assistant</p>
      <p className="mt-1 text-xs font-medium text-harlo-muted">Harlo is reading and indexing your approved sources.</p>
      <div className="mt-4">
        <SourceListMini progress />
      </div>
      <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-harlo-teal">
        <CheckCircle2 size={16} />
        All sources synced
      </p>
    </>
  );
}

function LeadPreviewPanel() {
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-harlo-ink">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          New lead captured
        </p>
        <span className="text-xs font-medium text-harlo-muted">Just now</span>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_0.18fr_1fr] md:items-center">
        <div className="rounded-lg border border-harlo-line bg-white p-4">
          <LeadDetails />
          <button type="button" className="mt-4 flex h-9 w-full items-center justify-center gap-1 rounded-lg bg-slate-100 text-sm font-bold text-harlo-ink">
            View full conversation <ArrowRight size={14} />
          </button>
        </div>
        <div className="hidden justify-center text-harlo-teal md:flex">
          <svg width="62" height="64" viewBox="0 0 62 64" fill="none" aria-hidden="true">
            <path d="M4 52C28 52 18 13 51 13" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" />
            <path d="M45 7L53 13L46 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="rounded-lg border border-harlo-line bg-white p-4">
          <div className="flex items-center gap-3 border-b border-harlo-line pb-3">
            <RouteIcon size={22} className="text-harlo-teal" />
            <div>
              <p className="text-sm font-bold text-harlo-ink">Routed to</p>
              <p className="text-sm font-bold text-harlo-ink">Sales Team</p>
            </div>
          </div>
          <p className="mt-3 text-xs font-bold text-harlo-muted">Context included</p>
          <div className="mt-2 space-y-2 text-xs font-medium text-harlo-muted">
            {["Visitor asked about pricing", "Viewed /pricing"].map((item) => (
              <p key={item} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                {item}
              </p>
            ))}
          </div>
          <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-harlo-teal">
            Open in inbox <ArrowRight size={14} />
          </p>
        </div>
      </div>
    </>
  );
}

function WorkflowLivePreview() {
  return (
    <div className="rounded-xl border border-harlo-line bg-white p-4 shadow-sm">
      <WorkflowPreviewHeader />
      <div className="mt-4 space-y-4">
        <WorkflowPreviewPanel>
          <TrainingPreviewPanel />
        </WorkflowPreviewPanel>

        <div className="grid gap-5 rounded-lg border border-harlo-line bg-white p-4 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <TuneChatVisual />
          <TuneSettings />
        </div>

        <WorkflowPreviewPanel>
          <LeadPreviewPanel />
        </WorkflowPreviewPanel>
      </div>
    </div>
  );
}

function FormsComparisonSection() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Why teams switch from static forms"
          title="Forms wait for perfect visitors. Harlo helps visitors become qualified."
          align="center"
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <ComparisonCard
            title="Old website form"
            tone="old"
            items={[
              "Same fields for every visitor",
              "No answer before the ask",
              "Context disappears before follow-up",
              "Team learns only after someone submits"
            ]}
          />
          <ComparisonCard
            title="Harlo conversation"
            tone="new"
            items={[
              "Answers from approved knowledge first",
              "Captures intent when the moment is warm",
              "Routes the transcript with lead details",
              "Reveals gaps from every visitor question"
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function PricingSection({
  interval,
  onIntervalChange
}: {
  interval: BillingInterval;
  onIntervalChange: (interval: BillingInterval) => void;
}) {
  return (
    <section id="pricing" className="bg-harlo-canvas px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <SectionHeader
            eyebrow="Pricing"
            title="Simple plans that scale with your conversations."
            body="Start with trial credits, then choose the monthly or annual plan that matches your website traffic."
          />
          <div className="flex w-full flex-col items-start gap-3 lg:w-auto lg:items-end">
            <BillingIntervalToggle interval={interval} onChange={onIntervalChange} />
          </div>
        </div>

        <div className="mt-9 grid gap-5 lg:grid-cols-3">
          {BILLING_PLANS.map((plan) => (
            <PlanCard key={plan.key} plan={plan} interval={interval} />
          ))}
        </div>
        <p className="mt-4 text-sm font-medium text-harlo-muted">Billed monthly or annually. Cancel anytime.</p>
      </div>
    </section>
  );
}

function AddOnsSection() {
  return (
    <section id="add-ons" className="bg-white px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Add-ons"
          title="Simple upgrades when your workspace grows."
          body="Add more capacity, agents, seats, or a cleaner branded widget without changing how your team works."
        />
        <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {BILLING_ADD_ONS.map((addOn) => {
            const meta = addOnMeta[addOn.key];
            const Icon = meta.icon;

            return (
              <div key={addOn.key} className="flex min-h-64 flex-col rounded-lg border border-harlo-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-harlo-teal/50 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${meta.accent}`}>
                    <Icon size={18} />
                  </span>
                  <span className="rounded-full bg-harlo-canvas px-2.5 py-1 text-sm font-semibold text-harlo-muted">{meta.label}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-harlo-ink">{addOn.name}</h3>
                <p className="mt-2 text-base leading-7 text-harlo-muted">{addOn.description}</p>
                <div className="mt-auto pt-6">
                  <p className="text-2xl font-semibold text-harlo-ink">{formatPrice(addOn.price)}</p>
                  <p className="mt-1 text-sm font-medium text-harlo-muted">{addOn.unit}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ComparePlansSection({
  interval,
  onIntervalChange
}: {
  interval: BillingInterval;
  onIntervalChange: (interval: BillingInterval) => void;
}) {
  return (
    <section id="compare" className="bg-white px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <SectionHeader
            eyebrow="Compare"
            title="Pick the plan that matches your website traffic."
            body="Compare the limits that matter before launch, then choose the billing interval that fits your traffic and budget."
          />
          <BillingIntervalToggle interval={interval} onChange={onIntervalChange} />
        </div>

        <div className="mt-9 overflow-hidden rounded-lg border border-harlo-line bg-white p-3 shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[920px]">
              <div className="grid grid-cols-[1.02fr_repeat(3,1fr)] gap-3">
                <div className="rounded-lg border border-harlo-line bg-harlo-canvas p-4">
                  <p className="text-base font-semibold text-harlo-ink">Plan snapshot</p>
                  <p className="mt-2 text-sm leading-6 text-harlo-muted">
                    Growth stays highlighted for teams with steady traffic and frequent customer questions.
                  </p>
                </div>
                {BILLING_PLANS.map((plan) => (
                  <PlanSnapshot key={plan.key} plan={plan} interval={interval} />
                ))}
              </div>

              <div className="mt-3 space-y-2">
                {compareRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[1.02fr_repeat(3,1fr)] gap-3 rounded-lg border border-harlo-line bg-white p-2">
                    <div className="rounded-md bg-harlo-canvas p-3">
                      <p className="text-base font-semibold text-harlo-ink">{row.label}</p>
                      <p className="mt-1 text-sm leading-6 text-harlo-muted">{row.detail}</p>
                    </div>
                    {BILLING_PLANS.map((plan) => (
                      <div
                        key={plan.key}
                        className={`flex items-center rounded-md px-3 text-base font-semibold transition ${plan.key === "growth" ? "bg-harlo-mist text-harlo-teal" : "bg-white text-harlo-muted"
                          }`}
                      >
                        {row.values[plan.key]}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection({
  openFaq,
  onOpenFaq
}: {
  openFaq: number;
  onOpenFaq: (index: number) => void;
}) {
  return (
    <section id="faq" className="relative overflow-hidden bg-[#07111a] px-4 py-20 text-white sm:px-6">
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-55" viewBox="0 0 1440 520" fill="none" aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <linearGradient id="faqWaveGradient" x1="0" y1="520" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0D8FAA" stopOpacity="0" />
            <stop offset="0.3" stopColor="#0D8FAA" stopOpacity="0.28" />
            <stop offset="0.62" stopColor="#5BD5E8" stopOpacity="0.16" />
            <stop offset="1" stopColor="#0D8FAA" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M-150 520C112 392 300 470 514 330C748 177 916 213 1136 95C1276 20 1385 -4 1530 -72" stroke="url(#faqWaveGradient)" strokeWidth="70" strokeLinecap="round" />
        <path d="M-120 552C142 426 318 510 552 370C806 218 936 272 1170 148C1310 74 1408 48 1540 8" stroke="url(#faqWaveGradient)" strokeWidth="32" strokeLinecap="round" />
        <path d="M-190 474C54 356 272 414 476 278C708 124 874 172 1080 64C1240 -20 1380 -50 1510 -105" stroke="url(#faqWaveGradient)" strokeWidth="24" strokeLinecap="round" />
      </svg>
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <SectionBadge variant="dark">FAQ</SectionBadge>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Questions teams ask before launching.</h2>
          <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
            Clear answers for the plan, setup, and handoff questions that come up before Harlo goes live.
          </p>
        </div>
        <div className="divide-y divide-white/10 rounded-lg border border-white/10 bg-white/[0.03] shadow-[0_24px_70px_rgba(2,6,23,0.25)] backdrop-blur">
          {faqItems.map((item, index) => {
            const isOpen = openFaq === index;

            return (
              <div key={item.question} className="p-5">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => onOpenFaq(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 text-left text-base font-semibold text-white"
                >
                  {item.question}
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-harlo-blue transition duration-300 ${isOpen ? "rotate-45" : ""}`}>
                    <Plus size={16} />
                  </span>
                </button>
                <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <p className="max-w-2xl pt-3 text-sm leading-6 text-slate-300">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CtaSection({ interval }: { interval: BillingInterval }) {
  return (
    <section id="cta" className="relative overflow-hidden bg-[#07111a] px-4 py-20 text-white sm:px-6">
      <div className="relative mx-auto max-w-7xl">
        <div className="relative min-h-[500px] overflow-hidden rounded-2xl bg-harlo-navy px-6 py-14 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_30px_90px_rgba(2,6,23,0.32)] md:px-16 md:py-16 lg:pr-[28rem]">
          <div className="absolute inset-0 bg-gradient-to-br from-harlo-navy via-harlo-ink to-harlo-teal" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:56px_56px] opacity-40" />
          <CtaPhoneGraphic />
          <div className="relative flex min-h-[380px] max-w-3xl flex-col justify-center">
            <SectionBadge variant="dark">Launch</SectionBadge>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">Turn website visitors into qualified leads today.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Start your trial, add the widget, and let Harlo handle the first customer conversation.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={getSignupHref("starter", interval)}
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

function HomeFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_repeat(4,0.7fr)]">
        <div>
          <LogoMark tone="light" />
          <p className="mt-5 max-w-xs text-sm leading-6 text-harlo-muted">
            AI agent for websites. Answer questions, capture leads, and hand off with full context.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <Link
              href="mailto:support@harloai.co"
              aria-label="Email Harlo support"
              className="grid h-9 w-9 place-items-center rounded-full border border-harlo-line text-harlo-muted transition hover:border-harlo-teal hover:text-harlo-teal"
            >
              <Mail size={16} />
            </Link>
            <div>
              <p className="text-sm font-semibold text-harlo-ink">Customer Support</p>
              <Link href="mailto:support@harloai.co" className="text-sm font-medium text-harlo-muted transition hover:text-harlo-teal">
                support@harloai.co
              </Link>
            </div>
          </div>
          <p className="mt-6 text-xs font-medium text-harlo-muted">© {currentYear} Harlo AI LLC. All rights reserved.</p>
        </div>
        {footerColumns.map((column) => (
          <div key={column.title}>
            <h2 className="text-sm font-semibold text-harlo-ink">{column.title}</h2>
            <div className="mt-4 grid gap-3 text-sm text-harlo-muted">
              {column.links.map((link) => (
                <Link key={link.label} href={link.href as Route} className="transition hover:text-harlo-teal">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}

function PlanCard({ plan, interval }: { plan: BillingPlan; interval: BillingInterval }) {
  const isGrowth = plan.key === "growth";

  return (
    <div
      className={`rounded-lg border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-harlo-teal/50 hover:shadow-md ${isGrowth ? "border-harlo-teal shadow-[0_18px_45px_rgba(8,127,149,0.12)]" : "border-harlo-line"
        }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-4">
          <PlanMark planKey={plan.key} />
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-harlo-ink">{plan.name}</h3>
            <p className="mt-2 text-sm leading-6 text-harlo-muted">{planDescriptions[plan.key]}</p>
          </div>
        </div>
        {isGrowth ? <Badge>Popular</Badge> : null}
      </div>
      <PlanPrice plan={plan} interval={interval} idPrefix="pricing" />
      <Link
        href={getSignupHref(plan.key, interval)}
        className={`group/trial mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-harlo-teal focus:ring-offset-2 ${isGrowth ? "bg-harlo-ink text-white hover:bg-harlo-navy" : "border border-harlo-line bg-white text-harlo-ink hover:border-harlo-teal hover:text-harlo-teal"
          }`}
      >
        {plan.key === "starter" ? "Start free trial" : "Subscribe"}
        {plan.key === "starter" ? (
          <span className="relative inline-flex">
            <Info size={15} className="text-harlo-teal" />
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-[calc(100%+0.65rem)] right-0 z-20 w-56 rounded-lg border border-harlo-line bg-white p-3 text-left text-xs font-semibold leading-5 text-harlo-muted opacity-0 shadow-soft transition group-hover/trial:opacity-100 group-focus/trial:opacity-100"
            >
              Includes a two-week trial with {TRIAL_CONFIG.credits} free credits.
            </span>
          </span>
        ) : null}
      </Link>
      <div className="mt-5 space-y-3">
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-sm font-semibold text-harlo-muted">
            <CheckCircle2 size={17} className="text-harlo-teal" />
            {feature}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanSnapshot({ plan, interval }: { plan: BillingPlan; interval: BillingInterval }) {
  const isGrowth = plan.key === "growth";

  return (
    <div className={`rounded-lg border bg-white p-4 ${isGrowth ? "border-harlo-teal shadow-sm" : "border-harlo-line"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PlanMark planKey={plan.key} compact />
          <p className="text-lg font-semibold text-harlo-ink">{plan.name}</p>
        </div>
        {isGrowth ? <Badge>Popular</Badge> : null}
      </div>
      <PlanPrice plan={plan} interval={interval} idPrefix="compare" compact />
    </div>
  );
}

function PlanPrice({
  plan,
  interval,
  idPrefix,
  compact = false
}: {
  plan: BillingPlan;
  interval: BillingInterval;
  idPrefix: string;
  compact?: boolean;
}) {
  const price = interval === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;
  const annualTotal = plan.annualMonthlyPrice * 12;

  return (
    <>
      <div className={`mt-5 flex min-h-11 flex-wrap items-center gap-2 ${compact ? "mt-4" : ""}`}>
        <div className={`inline-flex shrink-0 items-baseline whitespace-nowrap tabular-nums ${compact ? "min-w-24" : "min-w-28"}`}>
          <span className={`${compact ? "text-3xl" : "text-4xl"} font-semibold leading-none text-harlo-ink`}>$</span>
          <span
            key={`${idPrefix}-${plan.key}-${interval}-price`}
            className={`inline-block ${compact ? "text-3xl" : "text-4xl"} font-semibold leading-none text-harlo-ink [animation:harloPriceSwap_260ms_ease-out_forwards]`}
          >
            {price}
          </span>
        </div>
        {interval === "annual" ? (
          <span
            key={`${idPrefix}-${plan.key}-${interval}-badge`}
            className="rounded-full bg-gradient-to-r from-rose-500 to-red-300 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-red-100 [animation:harloBadgeSwap_260ms_ease-out_forwards]"
          >
            20% off
          </span>
        ) : null}
      </div>
      <p
        key={`${idPrefix}-${plan.key}-${interval}-subcopy`}
        className="mt-2 min-h-5 text-sm font-medium text-harlo-muted [animation:harloPriceSwap_260ms_ease-out_forwards]"
      >
        per month
        {interval === "annual" ? <span className="ml-2 text-harlo-teal">{formatPrice(annualTotal)} billed annually</span> : null}
      </p>
    </>
  );
}

function PlanMark({ planKey, compact = false }: { planKey: BillingPlanKey; compact?: boolean }) {
  const size = compact ? "h-10 w-10" : "h-14 w-14";

  if (planKey === "starter") {
    return (
      <span className={`grid shrink-0 place-items-center rounded-lg bg-sky-50 ${size}`} aria-hidden="true">
        <span className={`${compact ? "h-4 w-4" : "h-6 w-6"} rounded bg-sky-400`} />
      </span>
    );
  }

  if (planKey === "growth") {
    return (
      <span className={`grid shrink-0 place-items-center rounded-full bg-emerald-50 ${size}`} aria-hidden="true">
        <span className={`${compact ? "h-4 w-4" : "h-6 w-6"} rounded-full bg-emerald-400`} />
      </span>
    );
  }

  return (
    <span className={`grid shrink-0 place-items-center rounded-lg bg-rose-50 ${size} rotate-45`} aria-hidden="true">
      <span className={`${compact ? "h-4 w-4" : "h-6 w-6"} rounded bg-rose-400`} />
    </span>
  );
}

function BillingIntervalToggle({
  interval,
  onChange
}: {
  interval: BillingInterval;
  onChange: (interval: BillingInterval) => void;
}) {
  return (
    <div className="grid w-full shrink-0 grid-cols-2 rounded-full border border-harlo-line bg-white/95 p-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:inline-grid sm:w-auto sm:min-w-max">
      {(["monthly", "annual"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={interval === option}
          onClick={() => onChange(option)}
          className={`inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold capitalize transition sm:min-w-28 ${interval === option ? "bg-harlo-ink text-white shadow-[0_10px_24px_rgba(17,24,39,0.18)]" : "text-harlo-muted hover:bg-harlo-mist hover:text-harlo-ink"
            }`}
        >
          {option}
          {option === "annual" ? (
            <span className="rounded-full bg-gradient-to-r from-rose-500 to-red-300 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-red-100">
              20%
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function ApprovedKnowledgeCard() {
  const sources = [
    { label: "Website pages", detail: "Synced and indexed", icon: Database, color: "text-harlo-teal bg-harlo-mist" },
    { label: "Support policy", detail: "Used for source-grounded replies", icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50" },
    { label: "Lead fields", detail: "Captured when a person is needed", icon: UsersRound, color: "text-rose-500 bg-rose-50" },
    { label: "Widget install", detail: "One snippet across the site", icon: Code2, color: "text-amber-600 bg-amber-50" }
  ];

  return (
    <ProductCard icon={Database} title="Approved knowledge" body="Answers from the sources you trust.">
      <div className="rounded-lg border border-harlo-line bg-white p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-harlo-ink">Knowledge</p>
          <span className="rounded-full bg-harlo-mist px-2 py-1 text-[10px] font-bold text-harlo-teal">Synced</span>
        </div>
        <div className="space-y-2">
          {sources.map((source) => {
            const Icon = source.icon;

            return (
              <div key={source.label} className="flex items-center gap-3 rounded-md border border-harlo-line bg-white p-3">
                <span className={`grid h-9 w-9 place-items-center rounded-lg ${source.color}`}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-harlo-ink">{source.label}</p>
                  <p className="text-xs text-harlo-muted">{source.detail}</p>
                </div>
                <CheckCircle2 size={16} className="text-harlo-teal" />
              </div>
            );
          })}
        </div>
      </div>
    </ProductCard>
  );
}

function LeadCaptureCard() {
  return (
    <ProductCard icon={UsersRound} title="Lead capture with context" body="Capture intent, details, and conversation.">
      <div className="rounded-lg border border-harlo-line bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-harlo-ink">Lead captured</p>
          <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-500">Pricing</span>
        </div>
        <div className="mt-4 space-y-2 text-xs">
          {[
            ["Lead", "Alex Johnson"],
            ["Email", "alex@acme.com"],
            ["Phone", "(555) 123-4567"],
            ["Timeline", "Q2 2026"]
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="text-harlo-muted">{label}</span>
              <span className="font-semibold text-harlo-ink">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-harlo-canvas p-3">
          <p className="text-xs font-semibold text-harlo-muted">Conversation preview</p>
          <div className="mt-3 ml-auto max-w-[86%] rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-harlo-ink">
            I need pricing and a callback.
          </div>
          <div className="mt-2 max-w-[92%] rounded-lg bg-harlo-teal px-3 py-2 text-xs font-semibold leading-5 text-white">
            Starter includes 500 credits. I can capture your details for the team.
          </div>
        </div>
      </div>
    </ProductCard>
  );
}

function InsightsCard() {
  return (
    <ProductCard icon={BarChart3} title="Actionable insights" body="See what visitors ask and where to improve.">
      <div className="rounded-lg border border-harlo-line bg-white p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-harlo-ink">Conversations</p>
            <p className="text-xs text-harlo-muted">Last 30 days</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">+24%</span>
        </div>
        <p className="mt-4 text-3xl font-semibold tracking-tight text-harlo-ink">2,435</p>
        <MiniLineChart />
        <div className="mt-4 space-y-2">
          {[
            ["Pricing", "32%"],
            ["Integrations", "21%"],
            ["Policy / Terms", "17%"]
          ].map(([label, value], index) => (
            <div key={label} className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2 text-xs">
              <span className="font-semibold text-harlo-muted">{label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-harlo-mist">
                <span className="block h-full rounded-full bg-harlo-teal" style={{ width: index === 0 ? "76%" : index === 1 ? "52%" : "42%" }} />
              </span>
              <span className="text-right font-semibold text-harlo-muted">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </ProductCard>
  );
}

function ProductCard({
  icon: Icon,
  title,
  body,
  children
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-harlo-line bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
          <Icon size={18} />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-harlo-ink">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-harlo-muted">{body}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function FlowCard({
  label,
  steps,
  tone
}: {
  label: string;
  steps: Array<{ icon: LucideIcon; label: string }>;
  tone: "muted" | "active";
}) {
  return (
    <div className={`rounded-lg border bg-white p-6 shadow-sm ${tone === "active" ? "border-harlo-teal" : "border-harlo-line"}`}>
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone === "active" ? "bg-harlo-teal text-white" : "bg-slate-100 text-harlo-muted"}`}>
        {label}
      </span>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div key={step.label} className="relative text-center">
              {index < steps.length - 1 ? <span className="absolute left-[calc(50%+1.6rem)] top-5 hidden h-px w-[calc(100%-3.2rem)] bg-harlo-line sm:block" /> : null}
              <span className={`mx-auto grid h-11 w-11 place-items-center rounded-full ${tone === "active" ? "bg-harlo-mist text-harlo-teal" : "bg-slate-100 text-slate-500"}`}>
                <Icon size={18} />
              </span>
              <p className="mt-3 text-xs font-semibold leading-5 text-harlo-muted">{step.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OutcomeCard({
  title,
  body,
  icon: Icon,
  tone
}: {
  title: string;
  body: string;
  icon: LucideIcon;
  tone: "teal" | "coral" | "blue" | "gold";
}) {
  const toneClass = {
    teal: "bg-harlo-mist text-harlo-teal",
    coral: "bg-rose-50 text-rose-500",
    blue: "bg-sky-50 text-sky-600",
    gold: "bg-amber-50 text-amber-600"
  }[tone];

  return (
    <div className="rounded-lg border border-harlo-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className={`grid h-11 w-11 place-items-center rounded-lg ${toneClass}`}>
          <Icon size={19} />
        </span>
        <span className="rounded-full bg-harlo-canvas px-2.5 py-1 text-xs font-semibold text-harlo-muted">Outcome</span>
      </div>
      <OutcomeVisual tone={tone} />
      <h3 className="mt-5 text-lg font-semibold text-harlo-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-harlo-muted">{body}</p>
    </div>
  );
}

function OutcomeVisual({ tone }: { tone: "teal" | "coral" | "blue" | "gold" }) {
  if (tone === "teal") {
    return (
      <div className="mt-5 rounded-lg border border-harlo-line bg-harlo-canvas p-3">
        <div className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-harlo-ink shadow-sm">Do you offer annual plans?</div>
        <div className="mt-2 max-w-[88%] rounded-md bg-harlo-teal px-3 py-2 text-xs font-semibold leading-5 text-white shadow-sm">
          Yes. Annual plans save 20% and keep the same lead capture workflow.
        </div>
      </div>
    );
  }

  if (tone === "coral") {
    return (
      <div className="mt-5 rounded-lg border border-harlo-line bg-rose-50/50 p-3">
        <div className="flex items-center justify-between rounded-md bg-white p-3 shadow-sm">
          <span className="text-xs font-semibold text-harlo-muted">Intent score</span>
          <span className="text-lg font-semibold text-rose-500">92%</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-rose-500">
          {["Pricing", "Q2", "Callback"].map((item) => (
            <span key={item} className="rounded-full bg-white px-2 py-1 shadow-sm">{item}</span>
          ))}
        </div>
      </div>
    );
  }

  if (tone === "blue") {
    return (
      <div className="mt-5 rounded-lg border border-harlo-line bg-sky-50/60 p-3">
        <div className="flex items-center justify-between gap-2">
          {["Chat", "Lead", "Team"].map((item, index) => (
            <div key={item} className="flex flex-1 items-center gap-2">
              <span className="grid h-9 flex-1 place-items-center rounded-md bg-white text-[10px] font-bold text-sky-700 shadow-sm">{item}</span>
              {index < 2 ? <ArrowRight size={14} className="shrink-0 text-sky-500" /> : null}
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-md bg-white p-2 text-xs font-semibold text-harlo-muted shadow-sm">Transcript and lead fields attached</div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-lg border border-harlo-line bg-amber-50/60 p-3">
      <div className="rounded-md bg-white p-3 shadow-sm">
        <div className="flex items-end gap-1.5">
          {[34, 54, 42, 70, 58].map((height, index) => (
            <span key={height} className={`block w-full rounded-t ${index === 3 ? "bg-amber-400" : "bg-harlo-teal"}`} style={{ height }} />
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-amber-700">
        <span>Top gap</span>
        <span className="rounded-full bg-white px-2 py-1 shadow-sm">Policy terms</span>
      </div>
    </div>
  );
}

function ComparisonCard({ title, items, tone }: { title: string; items: string[]; tone: "old" | "new" }) {
  return (
    <div className={`rounded-lg border p-6 shadow-sm ${tone === "new" ? "border-harlo-teal bg-white" : "border-harlo-line bg-harlo-canvas"}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-harlo-ink">{title}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone === "new" ? "bg-harlo-mist text-harlo-teal" : "bg-rose-50 text-rose-500"}`}>
          {tone === "new" ? "Conversation" : "Static"}
        </span>
      </div>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3 rounded-lg border border-harlo-line bg-white p-3">
            {tone === "new" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-harlo-teal" /> : <X size={18} className="mt-0.5 shrink-0 text-rose-500" />}
            <p className="text-sm font-semibold leading-6 text-harlo-muted">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniLineChart() {
  const points = "4,58 34,34 64,72 94,42 124,28 154,62 184,48 214,72 244,30";

  return (
    <svg viewBox="0 0 248 88" className="mt-4 h-24 w-full rounded-lg bg-harlo-canvas" role="img" aria-label="Conversation volume trend chart">
      {[18, 44, 70].map((y) => (
        <line key={y} x1="0" y1={y} x2="248" y2={y} stroke="#e2e8ee" strokeWidth="1" />
      ))}
      <polyline points={points} fill="none" stroke="#087f95" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.split(" ").map((point) => {
        const [cx, cy] = point.split(",");

        return <circle key={point} cx={cx} cy={cy} r="3.5" fill="#ffffff" stroke="#087f95" strokeWidth="2" />;
      })}
    </svg>
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
      <div className={align === "center" ? "flex justify-center" : ""}>
        <SectionBadge>{eyebrow}</SectionBadge>
      </div>
      <h2 className="mt-4 text-4xl font-semibold tracking-tight text-harlo-ink md:text-5xl">{title}</h2>
      {body ? <p className={`mt-4 text-base leading-7 text-harlo-muted ${align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>{body}</p> : null}
    </div>
  );
}

function SectionBadge({ children, variant = "light" }: { children: React.ReactNode; variant?: "light" | "dark" }) {
  return (
    <span
      className={`inline-flex w-fit self-start items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${variant === "dark" ? "border-white/15 bg-white/8 text-harlo-blue" : "border-harlo-line bg-white text-harlo-teal shadow-sm"
        }`}
    >
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-harlo-mist px-2.5 py-1 text-xs font-bold text-harlo-teal">
      {children}
    </span>
  );
}
