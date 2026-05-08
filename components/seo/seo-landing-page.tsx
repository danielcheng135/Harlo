"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Code2,
  Database,
  FileText,
  Gauge,
  Info,
  LifeBuoy,
  MessageCircle,
  MousePointerClick,
  Plug,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UsersRound,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CtaPhoneGraphic } from "@/components/cta-phone-graphic";
import { CurvedLineBackdrop } from "@/components/curved-line-backdrop";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingNav } from "@/components/marketing-nav";
import { AnimatedFaqList } from "@/components/seo/animated-faq-list";
import {
  BILLING_PLANS,
  TRIAL_CONFIG,
  formatPrice,
  type BillingInterval,
  type BillingPlanKey
} from "@/lib/billing/plans";
import type { SeoLandingPage } from "@/lib/seo";

type SeoLandingPageTemplateProps = {
  page: SeoLandingPage;
};

type VisualKind = "website" | "lead" | "support" | "small-business" | "pricing";

type Feature = {
  title: string;
  body: string;
  icon: LucideIcon;
  tone: string;
  graphic: "sources" | "chat" | "lead" | "code" | "routes" | "chart";
};

type LandingContent = {
  eyebrow: string;
  visualKind: VisualKind;
  heroMetric: string;
  heroMetricLabel: string;
  heroAside: string;
  sectionHeadline: string;
  sectionIntro: string;
  proof: string[];
  features: Feature[];
  steps: Array<{ title: string; body: string; stat: string }>;
  useCases: Array<{ title: string; body: string; metric: string }>;
  faqs: Array<{ question: string; answer: string }>;
  finalCta: string;
};

const START_FREE_TRIAL_HREF = "/auth/sign-up";

const planIcons: Record<BillingPlanKey, { shape: string; gradient: string; inner: string }> = {
  starter: {
    shape: "rounded-md",
    gradient: "from-sky-100 to-teal-50",
    inner: "rounded-sm bg-sky-400"
  },
  growth: {
    shape: "rounded-full",
    gradient: "from-emerald-100 to-cyan-50",
    inner: "rounded-full bg-emerald-400"
  },
  pro: {
    shape: "rounded-[0.45rem] rotate-45",
    gradient: "from-rose-100 to-amber-50",
    inner: "rounded-[0.2rem] bg-rose-400"
  }
};

const landingPlanDescriptions: Record<BillingPlanKey, string> = {
  starter: "For small teams launching one chatbot.",
  growth: "For steady traffic and automation.",
  pro: "For higher volume and priority support."
};

const defaultContent: LandingContent = {
  eyebrow: "Website AI agent",
  visualKind: "website",
  heroMetric: "2.4k",
  heroMetricLabel: "conversations handled",
  heroAside: "Visitor questions become answered chats, lead records, and routed handoffs from one assistant.",
  sectionHeadline: "Everything a website AI agent needs to be useful.",
  sectionIntro:
    "Harlo combines support automation, lead capture, approved knowledge, and a simple dashboard so your website can answer and qualify visitors without a custom build.",
  proof: ["Built for lean B2B teams", "Answers from approved knowledge", "Launches with one snippet", "Lead capture included"],
  features: [
    {
      title: "Knowledge-grounded answers",
      body: "Connect website pages, support docs, policies, and notes so Harlo answers from sources your team trusts.",
      icon: Database,
      tone: "bg-cyan-50 text-harlo-teal",
      graphic: "sources"
    },
    {
      title: "Qualified lead capture",
      body: "Collect contact details, intent, timing, and conversation history before your team follows up.",
      icon: UsersRound,
      tone: "bg-rose-50 text-rose-500",
      graphic: "lead"
    },
    {
      title: "No-code website install",
      body: "Add Harlo to your site with a lightweight snippet and manage the widget from one dashboard.",
      icon: Code2,
      tone: "bg-indigo-50 text-indigo-500",
      graphic: "code"
    },
    {
      title: "Brand-safe conversations",
      body: "Tune greetings, voice, colors, lead fields, and handoff rules to match how your business works.",
      icon: Sparkles,
      tone: "bg-emerald-50 text-emerald-600",
      graphic: "chat"
    },
    {
      title: "Useful escalation",
      body: "When AI is not enough, Harlo routes the moment with the context a person needs to act quickly.",
      icon: MousePointerClick,
      tone: "bg-amber-50 text-amber-600",
      graphic: "routes"
    },
    {
      title: "Simple analytics",
      body: "Track conversations, leads, resolution, and knowledge gaps so the assistant improves over time.",
      icon: BarChart3,
      tone: "bg-sky-50 text-sky-600",
      graphic: "chart"
    }
  ],
  steps: [
    { title: "Connect approved knowledge", body: "Point Harlo at the pages, files, FAQs, and internal notes that should shape customer-facing answers.", stat: "Sources" },
    { title: "Tune the assistant", body: "Set the widget voice, colors, lead fields, escalation behavior, and fallback guidance from the dashboard.", stat: "Voice" },
    { title: "Launch and improve", body: "Install the snippet, review conversations, and keep answers fresh as new questions appear.", stat: "Live" }
  ],
  useCases: [
    { title: "Support teams", body: "Deflect repeat questions before visitors create tickets or wait for a person.", metric: "Fewer repeats" },
    { title: "Sales teams", body: "Qualify visitor intent and preserve context for faster, warmer follow-up.", metric: "Warmer leads" },
    { title: "Operations teams", body: "Keep website answers consistent across policies, locations, services, and team guidance.", metric: "One source" }
  ],
  faqs: [
    { question: "How fast can we launch Harlo?", answer: "Most teams can connect approved knowledge, tune the widget, and install the snippet in one working session." },
    { question: "Does Harlo replace our support team?", answer: "No. Harlo handles repeat website questions and captures context so your team can focus on conversations that need judgment." },
    { question: "Can Harlo capture leads?", answer: "Yes. You can configure lead fields and capture contact details, intent, and conversation history when a visitor needs follow-up." },
    { question: "What does Harlo use to answer questions?", answer: "Harlo answers from approved business knowledge such as site pages, support docs, policies, FAQs, and workspace guidance." }
  ],
  finalCta: "Turn website visitors into answered questions and qualified leads."
};

const contentByPath: Record<string, Partial<LandingContent>> = {
  "/ai-website-chatbot": {
    eyebrow: "AI website chatbot",
    visualKind: "website",
    heroMetric: "84%",
    heroMetricLabel: "repeat questions answered",
    heroAside: "A site visitor asks, Harlo checks approved sources, answers clearly, and captures context when follow-up is needed.",
    sectionHeadline: "A website chatbot that behaves like part of the team.",
    sectionIntro:
      "This page is built for buyers comparing website chatbots: answer quality, install speed, brand control, lead capture, and what happens when AI should hand off.",
    proof: ["Answers website visitors instantly", "Uses approved business content", "Captures leads mid-chat", "No-code widget install"],
    features: [
      { title: "Page-aware replies", body: "Turn product pages, pricing pages, FAQs, and help docs into answers visitors can actually use.", icon: FileText, tone: "bg-cyan-50 text-harlo-teal", graphic: "sources" },
      { title: "Website-native chat", body: "Keep conversations on the page instead of forcing every visitor into a form or inbox.", icon: MessageCircle, tone: "bg-emerald-50 text-emerald-600", graphic: "chat" },
      { title: "Lead moments", body: "Ask for contact details only when the conversation shows intent, urgency, or fit.", icon: UserCheck, tone: "bg-rose-50 text-rose-500", graphic: "lead" },
      { title: "Brand controls", body: "Match the assistant greeting, tone, colors, and fallback behavior to your company.", icon: Sparkles, tone: "bg-indigo-50 text-indigo-500", graphic: "chat" },
      { title: "Escalation paths", body: "Route complex questions with a summary instead of leaving visitors at a dead end.", icon: MousePointerClick, tone: "bg-amber-50 text-amber-600", graphic: "routes" },
      { title: "Conversation insights", body: "See what visitors ask and where your website knowledge needs to improve.", icon: BarChart3, tone: "bg-sky-50 text-sky-600", graphic: "chart" }
    ],
    steps: [
      { title: "Index your public pages", body: "Start with the website content customers already trust, including pricing, product, service, and FAQ pages.", stat: "Pages" },
      { title: "Approve answer sources", body: "Add support docs, policies, and internal notes to keep replies accurate and business-specific.", stat: "Docs" },
      { title: "Install the widget", body: "Place Harlo on the website and let visitors ask questions directly where intent happens.", stat: "Snippet" }
    ],
    useCases: [
      { title: "Product websites", body: "Explain plans, features, implementation details, and fit without burying visitors in docs.", metric: "Better answers" },
      { title: "Service businesses", body: "Handle location, availability, policy, and pricing questions before a visitor calls.", metric: "Cleaner intake" },
      { title: "B2B teams", body: "Give buyers fast answers while preserving the chat context sales needs.", metric: "Qualified demand" }
    ],
    finalCta: "Launch a website chatbot that answers first and captures the right next step."
  },
  "/ai-lead-capture-chatbot": {
    eyebrow: "AI lead capture",
    visualKind: "lead",
    heroMetric: "+38%",
    heroMetricLabel: "more qualified leads",
    heroAside: "Harlo turns high-intent questions into lead profiles with timeline, fit, and conversation history already attached.",
    sectionHeadline: "Lead capture that starts with a helpful answer.",
    sectionIntro:
      "Instead of dropping every visitor into the same form, Harlo learns what they need, answers the first question, and captures details when intent is real.",
    proof: ["Captures intent and contact details", "Routes warm prospects", "Preserves chat history", "Built for sales handoff"],
    features: [
      { title: "Intent detection", body: "Spot pricing, scheduling, service, urgency, and buying questions while the chat is happening.", icon: Gauge, tone: "bg-rose-50 text-rose-500", graphic: "lead" },
      { title: "Adaptive fields", body: "Collect email, phone, timeline, service area, team size, or other fields based on the conversation.", icon: UserCheck, tone: "bg-emerald-50 text-emerald-600", graphic: "lead" },
      { title: "Conversation history", body: "Send the question, answer, and context with the lead so follow-up feels warm.", icon: MessageCircle, tone: "bg-cyan-50 text-harlo-teal", graphic: "chat" },
      { title: "Fit scoring", body: "Surface the conversations most likely to become useful sales or support opportunities.", icon: BarChart3, tone: "bg-sky-50 text-sky-600", graphic: "chart" },
      { title: "Smart routing", body: "Keep urgent requests, service questions, and qualified buyers moving to the right next step.", icon: MousePointerClick, tone: "bg-amber-50 text-amber-600", graphic: "routes" },
      { title: "Form fallback", body: "Use the assistant as a better front door without removing forms your team already uses.", icon: Plug, tone: "bg-indigo-50 text-indigo-500", graphic: "code" }
    ],
    steps: [
      { title: "Define qualified intent", body: "Tell Harlo which signals matter: plan interest, service area, urgency, budget, or implementation timing.", stat: "Intent" },
      { title: "Ask for the right details", body: "Use short lead fields that match the conversation instead of a long generic form.", stat: "Fields" },
      { title: "Route with context", body: "Give your team the transcript, captured fields, and reason the visitor is worth follow-up.", stat: "Handoff" }
    ],
    useCases: [
      { title: "Demand generation", body: "Turn campaign traffic into captured conversations with context attached.", metric: "More signal" },
      { title: "Sales teams", body: "Follow up with the visitor's question, timeline, and qualification details already in hand.", metric: "Faster reply" },
      { title: "Founder-led teams", body: "Keep the website qualifying visitors while the team is busy selling and serving customers.", metric: "Less manual" }
    ],
    faqs: [
      { question: "How is this different from a lead form?", answer: "A lead form asks the same fields every time. Harlo first answers the visitor, understands intent, and then captures the details that match the conversation." },
      { question: "Can we choose the fields Harlo asks for?", answer: "Yes. You can configure the lead fields your team needs, such as email, phone, timeline, service area, company size, or reason for reaching out." },
      { question: "Does Harlo keep the chat transcript?", answer: "Yes. Captured leads include conversation context so your team can follow up without asking the visitor to repeat themselves." },
      { question: "Can Harlo answer before asking for contact details?", answer: "Yes. Harlo is designed to be useful first, then capture lead details when a visitor needs follow-up or shows buying intent." }
    ],
    finalCta: "Turn more website conversations into qualified leads with useful context."
  },
  "/customer-support-ai-agent": {
    eyebrow: "Support AI agent",
    visualKind: "support",
    heroMetric: "1.3s",
    heroMetricLabel: "average first response",
    heroAside: "Visitors get grounded answers from approved support knowledge, while your team keeps the complex moments.",
    sectionHeadline: "Support automation for the questions your team repeats.",
    sectionIntro:
      "Harlo gives customers a quick first answer from approved knowledge and gives your team context when a person should step in.",
    proof: ["Deflects repeat questions", "Uses source-grounded replies", "Escalates with context", "Keeps answers consistent"],
    features: [
      { title: "Repeat question coverage", body: "Answer common questions about services, policies, pricing, availability, and next steps.", icon: LifeBuoy, tone: "bg-cyan-50 text-harlo-teal", graphic: "chat" },
      { title: "Source-grounded replies", body: "Keep customer-facing answers tied to approved documents instead of improvising.", icon: ShieldCheck, tone: "bg-emerald-50 text-emerald-600", graphic: "sources" },
      { title: "Fallback handling", body: "Escalate unclear or sensitive questions instead of guessing.", icon: Info, tone: "bg-amber-50 text-amber-600", graphic: "routes" },
      { title: "Knowledge gap review", body: "See which unanswered questions need a new source or clearer guidance.", icon: RefreshCw, tone: "bg-sky-50 text-sky-600", graphic: "chart" },
      { title: "Customer context", body: "Preserve what the visitor asked so support can continue the thread cleanly.", icon: MessageCircle, tone: "bg-rose-50 text-rose-500", graphic: "lead" },
      { title: "Team-safe controls", body: "Tune what the assistant should answer, avoid, or route to a person.", icon: Sparkles, tone: "bg-indigo-50 text-indigo-500", graphic: "code" }
    ],
    steps: [
      { title: "Upload support knowledge", body: "Add policies, service docs, FAQs, and approved answers that should guide replies.", stat: "Knowledge" },
      { title: "Set fallback rules", body: "Decide when Harlo should answer confidently and when it should collect context for the team.", stat: "Rules" },
      { title: "Review gaps weekly", body: "Use unanswered questions to improve docs and reduce future support load.", stat: "Improve" }
    ],
    useCases: [
      { title: "Customer support", body: "Answer common questions before they become tickets or interrupt the team.", metric: "Fewer tickets" },
      { title: "Success teams", body: "Give customers a clear first answer while preserving escalation paths for complex issues.", metric: "Better handoff" },
      { title: "Service businesses", body: "Help visitors understand policies, services, availability, and next steps instantly.", metric: "Always on" }
    ],
    faqs: [
      { question: "Will Harlo make up support answers?", answer: "Harlo is designed around approved business knowledge. When the available context is not enough, it can avoid guessing and route the moment with context." },
      { question: "Can support review what visitors asked?", answer: "Yes. Harlo surfaces conversations, outcomes, and knowledge gaps so your team can improve sources over time." },
      { question: "Does it work for policy-heavy questions?", answer: "Yes, as long as your approved policy sources are connected and maintained. Harlo can cite and follow those sources for customer-facing answers." },
      { question: "Can Harlo escalate to a person?", answer: "Yes. It can collect useful details and preserve the conversation so a teammate can pick up the thread faster." }
    ],
    finalCta: "Give customers faster answers without putting every website question on your team."
  },
  "/website-chatbot-for-small-business": {
    eyebrow: "Small business chatbot",
    visualKind: "small-business",
    heroMetric: "14d",
    heroMetricLabel: "Starter trial",
    heroAside: "A simple assistant for lean teams that need the website to answer, qualify, and route without a big setup project.",
    sectionHeadline: "A practical website chatbot for small teams.",
    sectionIntro:
      "Harlo is built for small businesses that need useful automation without enterprise setup, custom chatbot flows, or another inbox to babysit.",
    proof: ["Simple setup for lean teams", "Works after hours", "Grows with traffic", "No custom build needed"],
    features: [
      { title: "Fast launch", body: "Start with your existing website pages, FAQs, and service notes instead of building flows from scratch.", icon: Zap, tone: "bg-amber-50 text-amber-600", graphic: "code" },
      { title: "After-hours answers", body: "Give visitors a helpful first response even when the team is closed or busy.", icon: MessageCircle, tone: "bg-cyan-50 text-harlo-teal", graphic: "chat" },
      { title: "Simple lead capture", body: "Collect the contact details and context needed to follow up without a long form.", icon: UserCheck, tone: "bg-rose-50 text-rose-500", graphic: "lead" },
      { title: "Business knowledge", body: "Keep answers consistent with the pages, services, and policies your team already uses.", icon: Database, tone: "bg-emerald-50 text-emerald-600", graphic: "sources" },
      { title: "Room to grow", body: "Add seats, credits, and more assistants as traffic increases.", icon: UsersRound, tone: "bg-indigo-50 text-indigo-500", graphic: "chart" },
      { title: "Clear handoff", body: "Send the right moments to a person with enough detail to respond quickly.", icon: MousePointerClick, tone: "bg-sky-50 text-sky-600", graphic: "routes" }
    ],
    steps: [
      { title: "Start with one assistant", body: "Connect the website content and business notes your team already trusts.", stat: "One" },
      { title: "Install without a project", body: "Add a lightweight snippet and tune the greeting, colors, and lead fields.", stat: "No-code" },
      { title: "Grow only when needed", body: "Use credits, seats, agents, and branding controls as website traffic increases.", stat: "Scale" }
    ],
    useCases: [
      { title: "Local services", body: "Answer service area, availability, quote, and policy questions before a call.", metric: "Better intake" },
      { title: "Small B2B teams", body: "Handle product and pricing questions while preserving useful lead context.", metric: "Lean growth" },
      { title: "Owner-led teams", body: "Keep the website helpful while the team is serving customers.", metric: "Less chasing" }
    ],
    faqs: [
      { question: "Do small businesses need engineering help?", answer: "Usually no. Harlo installs with a lightweight website snippet and can be managed from the dashboard." },
      { question: "Can Harlo work outside business hours?", answer: "Yes. The assistant can answer from approved business knowledge and capture follow-up details when your team is away." },
      { question: "Can we start small?", answer: "Yes. Starter is designed for one chatbot and smaller traffic, with add-ons available as your workspace grows." },
      { question: "Will it feel generic?", answer: "You can tune the voice, greeting, colors, and lead fields so the assistant feels aligned with your business." }
    ],
    finalCta: "Make your small business website answer more visitors without adding more busywork."
  },
  "/pricing": {
    eyebrow: "AI chatbot pricing",
    visualKind: "pricing",
    heroMetric: "$39",
    heroMetricLabel: "Starter plan",
    heroAside: "Compare message credits, seats, support level, and add-ons before choosing the plan that fits your website traffic.",
    sectionHeadline: "Pricing built around real website usage.",
    sectionIntro:
      "Harlo plans are organized by message volume and team needs, so you can start small and add capacity only when traffic makes it useful.",
    proof: ["Plans by conversation volume", "Annual savings available", "Add seats and agents", "50 trial credits included"],
    features: [
      { title: "Message credits", body: "Plans scale by assistant replies, so pricing tracks website conversation volume.", icon: MessageCircle, tone: "bg-cyan-50 text-harlo-teal", graphic: "chart" },
      { title: "Starter trial", body: `Begin with ${TRIAL_CONFIG.credits} trial credits before your Starter subscription continues.`, icon: Sparkles, tone: "bg-emerald-50 text-emerald-600", graphic: "lead" },
      { title: "Seats included", body: "Give teammates access to manage sources, review conversations, and tune the assistant.", icon: UsersRound, tone: "bg-indigo-50 text-indigo-500", graphic: "sources" },
      { title: "Extra agents", body: "Add more assistants for separate brands, sites, workflows, or service lines.", icon: Bot, tone: "bg-amber-50 text-amber-600", graphic: "routes" },
      { title: "Annual savings", body: "Use annual billing when you know Harlo will be part of the website workflow.", icon: BarChart3, tone: "bg-sky-50 text-sky-600", graphic: "chart" },
      { title: "Upgrade path", body: "Move from Starter to Growth or Pro as leads, support volume, and traffic increase.", icon: RefreshCw, tone: "bg-rose-50 text-rose-500", graphic: "code" }
    ],
    steps: [
      { title: "Estimate traffic", body: "Use monthly visitor questions and expected assistant replies to choose a starting tier.", stat: "Volume" },
      { title: "Pick a plan", body: "Starter, Growth, and Pro include different message credits, seats, and support levels.", stat: "Plan" },
      { title: "Add capacity later", body: "Use add-ons for extra credits, assistants, seats, or branding controls only when needed.", stat: "Add-ons" }
    ],
    useCases: [
      { title: "Starter", body: "For small teams launching one chatbot and validating website AI support.", metric: "$39/mo" },
      { title: "Growth", body: "For steady website traffic, more monthly credits, and automated knowledge updates.", metric: "$129/mo" },
      { title: "Pro", body: "For higher-volume support and lead capture with priority support.", metric: "$399/mo" }
    ],
    faqs: [
      { question: "Which plan should I start with?", answer: "Starter is best for one chatbot and smaller traffic. Growth fits steady traffic, and Pro adds higher message capacity with priority support." },
      { question: "What counts as a message credit?", answer: "Message credits are used when Harlo generates assistant replies during website conversations." },
      { question: "Can I change plans later?", answer: "Yes. You can move between plans as website traffic, team size, or automation needs change." },
      { question: "Are add-ons available?", answer: "Yes. You can add auto-recharge credits, extra agents, more seats, or remove Harlo branding as your workspace grows." }
    ],
    finalCta: "Pick the Harlo plan that matches your website conversation volume."
  }
};

export function SeoLandingPageTemplate({ page }: SeoLandingPageTemplateProps) {
  const content = mergeContent(page.path);
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const primaryCtaHref = page.primaryCta.toLowerCase().includes("trial") || page.primaryCta.toLowerCase().includes("start")
    ? START_FREE_TRIAL_HREF
    : "#pricing";
  const secondaryCtaHref = page.secondaryCta.toLowerCase().includes("outcome")
    ? "#use-cases"
    : page.secondaryCta.toLowerCase().includes("compare")
      ? "#compare"
      : page.secondaryCta.toLowerCase().includes("feature")
        ? "#features"
        : "#how-it-works";

  return (
    <main className="min-h-screen bg-[#f7faf8] text-harlo-ink">
      <style>{`
        @keyframes harloFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes harloDraw {
          from { width: 22%; }
          to { width: 88%; }
        }
        @keyframes harloPulse {
          0%, 100% { opacity: 0.55; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1); }
        }
        .harlo-float { animation: harloFloat 5.5s ease-in-out infinite; }
        .harlo-draw { animation: harloDraw 2.8s ease-in-out infinite alternate; }
        .harlo-pulse { animation: harloPulse 3.4s ease-in-out infinite; }
      `}</style>

      <MarketingNav
        links={[
          { label: "Features", href: "#features" },
          { label: "How it works", href: "#how-it-works" },
          { label: "Pricing", href: "#pricing" },
          { label: "FAQ", href: "#faq" }
        ]}
        ctaLabel="Start free trial"
        ctaHref={START_FREE_TRIAL_HREF}
        ctaVariant="dark"
      />

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-16 pt-16 lg:grid-cols-[0.92fr_1.08fr] lg:pt-20">
        <div>
          <SectionBadge>{content.eyebrow}</SectionBadge>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-harlo-ink md:text-7xl">
            {page.h1}
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-9 text-harlo-muted">{page.intro}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryCtaHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-harlo-teal px-6 text-base font-semibold text-white shadow-[0_18px_36px_rgba(8,127,149,0.22)] transition hover:-translate-y-0.5 hover:bg-harlo-navy"
            >
              {page.primaryCta} <ArrowRight size={18} />
            </Link>
            <Link
              href={secondaryCtaHref}
              className="inline-flex h-12 items-center justify-center rounded-full border border-harlo-line bg-white px-6 text-base font-semibold text-harlo-ink shadow-sm transition hover:border-harlo-teal hover:text-harlo-teal"
            >
              {page.secondaryCta}
            </Link>
          </div>
        </div>

        <ProductMockup page={page} content={content} />
      </section>

      <section className="border-y border-harlo-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-6 text-sm font-semibold text-harlo-muted md:grid-cols-4">
          {content.proof.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-harlo-blue" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <SectionBadge>Features</SectionBadge>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-harlo-ink md:text-6xl">
            {content.sectionHeadline}
          </h2>
          <p className="mt-5 text-lg leading-8 text-harlo-muted">{content.sectionIntro}</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {content.features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} visualKind={content.visualKind} />
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-harlo-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <SectionBadge>Workflow</SectionBadge>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-harlo-ink md:text-6xl">
              {workflowHeadline(content.visualKind)}
            </h2>
            <p className="mt-5 text-lg leading-8 text-harlo-muted">{workflowIntro(content.visualKind)}</p>
            <WorkflowGraphic steps={content.steps} visualKind={content.visualKind} />
          </div>
          <div className="grid gap-4">
            {content.steps.map((step, index) => (
              <article key={step.title} className="group flex gap-4 rounded-lg border border-harlo-line bg-[#f7faf8] p-5 transition duration-300 hover:-translate-y-1 hover:border-harlo-teal/40 hover:bg-white hover:shadow-soft">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-base font-semibold ${index === 1 ? "bg-harlo-teal text-white" : "bg-harlo-mist text-harlo-teal"}`}>
                  0{index + 1}
                </span>
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-semibold text-harlo-ink">{step.title}</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-harlo-teal shadow-sm">{step.stat}</span>
                  </div>
                  <p className="mt-2 text-base leading-7 text-harlo-muted">{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="use-cases" className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <SectionBadge>Use cases</SectionBadge>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-harlo-ink md:text-6xl">
              {useCaseHeadline(content.visualKind)}
            </h2>
          </div>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {content.useCases.map((useCase, index) => (
            <article key={useCase.title} className="overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-soft">
              <UseCaseGraphic index={index} visualKind={content.visualKind} metric={useCase.metric} />
              <div className="p-6">
                <p className="text-2xl font-semibold tracking-tight text-harlo-ink">{useCase.title}</p>
                <p className="mt-4 text-base leading-7 text-harlo-muted">{useCase.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-y border-harlo-line bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <SectionBadge>Pricing</SectionBadge>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-harlo-ink md:text-6xl">
                {pricingHeadline(content.visualKind)}
              </h2>
              <p className="mt-5 text-lg leading-8 text-harlo-muted">
                Start with a {TRIAL_CONFIG.days}-day Starter trial and {TRIAL_CONFIG.credits} trial credits, then choose the plan that matches your website traffic.
              </p>
            </div>
            <BillingIntervalToggle interval={interval} onChange={setInterval} />
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {BILLING_PLANS.map((plan) => (
              <PricingCard key={plan.key} plan={plan} interval={interval} />
            ))}
          </div>
        </div>
      </section>

      <section id="compare" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionBadge>Compare</SectionBadge>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-harlo-ink md:text-6xl">
              {compareHeadline(content.visualKind)}
            </h2>
            <p className="mt-5 text-lg leading-8 text-harlo-muted">
              A practical view of where Harlo fits compared with static forms, generic bots, and manual website support.
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-harlo-line bg-white shadow-sm">
            {page.comparison.map((row, index) => (
              <div key={row.label} className="grid gap-3 border-b border-harlo-line p-5 last:border-b-0 md:grid-cols-[0.42fr_1fr_1fr]">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-harlo-teal">{row.label}</p>
                <div className="rounded-lg bg-harlo-mist p-4">
                  <p className="text-sm font-semibold text-harlo-teal">Harlo</p>
                  <p className="mt-1 text-base font-semibold text-harlo-ink">{row.harlo}</p>
                </div>
                <div className={`${index % 2 === 0 ? "bg-slate-50" : "bg-white"} rounded-lg border border-harlo-line p-4`}>
                  <p className="text-sm font-semibold text-harlo-muted">Typical alternative</p>
                  <p className="mt-1 text-base text-harlo-muted">{row.alternative}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="relative overflow-hidden border-y border-harlo-line bg-white">
        <CurvedLineBackdrop />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionBadge>FAQ</SectionBadge>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-harlo-ink md:text-6xl">
              Questions before launch.
            </h2>
            <p className="mt-5 text-lg leading-8 text-harlo-muted">
              Straight answers about setup, pricing, lead capture, and how Harlo fits into your current website.
            </p>
          </div>
          <AnimatedFaqList items={content.faqs} />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-20">
          <div className="relative overflow-hidden rounded-2xl bg-harlo-navy px-6 py-12 text-white shadow-soft md:px-16 md:py-16 lg:pr-[28rem]">
          <div className="absolute inset-0 bg-gradient-to-br from-harlo-navy via-harlo-ink to-harlo-teal" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:56px_56px] opacity-40" />
          <CtaPhoneGraphic />
          <div className="relative flex min-h-[340px] max-w-3xl flex-col justify-center">
            <SectionBadge variant="dark">Launch</SectionBadge>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
              {content.finalCta}
            </h2>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={START_FREE_TRIAL_HREF} className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-harlo-ink transition hover:bg-harlo-mist">
                Start free trial
              </Link>
              <p className="flex items-center gap-2 text-sm font-medium text-white/75">
                <Info size={16} />
                {TRIAL_CONFIG.credits} trial credits included. Card required.
              </p>
            </div>
          </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}

function ProductMockup({ page, content }: { page: SeoLandingPage; content: LandingContent }) {
  const mockup = {
    website: <WebsiteHeroMockup page={page} content={content} />,
    lead: <LeadHeroMockup page={page} content={content} />,
    support: <SupportHeroMockup page={page} content={content} />,
    "small-business": <SmallBusinessHeroMockup page={page} content={content} />,
    pricing: <PricingHeroMockup page={page} content={content} />
  }[content.visualKind];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-harlo-line bg-white p-4 shadow-soft">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.045)_1px,transparent_1px),linear-gradient(rgba(17,24,39,0.045)_1px,transparent_1px)] bg-[size:42px_42px]" />
      {mockup}
    </div>
  );
}

function WebsiteHeroMockup({ page, content }: { page: SeoLandingPage; content: LandingContent }) {
  return (
    <div className="relative rounded-xl bg-gradient-to-br from-harlo-mist via-white to-cyan-50 p-6">
      <MockupHeader label={content.eyebrow} />
      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_0.72fr]">
        <div className="harlo-float rounded-xl border border-harlo-line bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-harlo-muted">Visitor</p>
          <p className="mt-2 rounded-lg bg-harlo-canvas p-3 text-sm font-medium text-harlo-ink">Do you support multi-location service teams?</p>
          <p className="mt-3 rounded-lg bg-harlo-teal p-3 text-sm font-semibold text-white">
            Yes. Harlo can answer from approved content and route by service area.
          </p>
          <div className="mt-4 grid gap-2">
            {["Website pages", "Support docs", "Policy notes"].map((source) => (
              <div key={source} className="flex items-center justify-between rounded-lg border border-harlo-line bg-white p-3 text-sm font-semibold">
                {source}
                <CheckCircle2 size={16} className="text-harlo-teal" />
              </div>
            ))}
          </div>
        </div>
        <MetricStack page={page} content={content} />
      </div>
    </div>
  );
}

function LeadHeroMockup({ page, content }: { page: SeoLandingPage; content: LandingContent }) {
  return (
    <div className="relative rounded-xl bg-gradient-to-br from-rose-50 via-white to-amber-50 p-6">
      <MockupHeader label={content.eyebrow} />
      <div className="mt-6 grid gap-4 lg:grid-cols-[0.84fr_0.78fr]">
        <div className="rounded-xl border border-harlo-line bg-white p-5 shadow-sm">
          <p className="rounded-lg bg-harlo-canvas p-3 text-sm font-semibold text-harlo-ink">Can someone follow up about Growth?</p>
          <p className="mt-3 rounded-lg bg-rose-500 p-3 text-sm font-semibold text-white">What is the best email and team size?</p>
          <p className="mt-3 rounded-lg bg-white p-3 text-sm font-semibold text-harlo-ink shadow-sm">12 people, ops@northstar.co</p>
        </div>
        <div className="harlo-float rounded-xl border border-rose-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-harlo-ink">Lead captured</p>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-500">92% fit</span>
          </div>
          <div className="mt-5 grid gap-3">
            {["Growth plan", "12 seats", "Follow-up"].map((tag) => (
              <span key={tag} className="rounded-lg bg-harlo-canvas px-3 py-2 text-sm font-semibold text-harlo-muted">{tag}</span>
            ))}
          </div>
          <div className="mt-5 h-2 rounded-full bg-rose-100"><div className="harlo-draw h-full rounded-full bg-rose-500" /></div>
        </div>
      </div>
    </div>
  );
}

function SupportHeroMockup({ page, content }: { page: SeoLandingPage; content: LandingContent }) {
  return (
    <div className="relative rounded-xl bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6">
      <MockupHeader label={content.eyebrow} />
      <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_0.84fr]">
        <div className="rounded-xl border border-harlo-line bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-harlo-muted">Knowledge health</p>
          <p className="mt-2 text-5xl font-semibold tracking-tight text-harlo-ink">100%</p>
          <div className="mt-4 grid gap-2">
            {["Returns policy", "Service FAQs", "Pricing page"].map((source) => (
              <div key={source} className="flex items-center gap-2 rounded-lg bg-harlo-mist p-3 text-sm font-semibold text-harlo-teal">
                <ShieldCheck size={15} />
                {source}
              </div>
            ))}
          </div>
        </div>
        <MetricStack page={page} content={content} />
      </div>
    </div>
  );
}

function SmallBusinessHeroMockup({ page, content }: { page: SeoLandingPage; content: LandingContent }) {
  return (
    <div className="relative rounded-xl bg-gradient-to-br from-amber-50 via-white to-cyan-50 p-6">
      <MockupHeader label={content.eyebrow} />
      <div className="mt-6 grid gap-4 lg:grid-cols-[0.78fr_0.86fr]">
        <div className="harlo-float rounded-xl border border-harlo-line bg-white p-5 shadow-sm">
          <p className="text-4xl font-semibold tracking-tight text-harlo-ink">Open after hours</p>
          <p className="mt-3 text-sm leading-6 text-harlo-muted">Harlo answers common service questions and captures follow-up while your team is offline.</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {["Quote", "Policy", "Hours", "Service"].map((item) => (
              <span key={item} className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">{item}</span>
            ))}
          </div>
        </div>
        <MetricStack page={page} content={content} />
      </div>
    </div>
  );
}

function PricingHeroMockup({ content }: { page: SeoLandingPage; content: LandingContent }) {
  return (
    <div className="relative rounded-xl bg-gradient-to-br from-harlo-mist via-white to-sky-50 p-6">
      <MockupHeader label={content.eyebrow} />
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {BILLING_PLANS.map((plan) => (
          <div key={plan.key} className={`rounded-xl border bg-white p-4 shadow-sm ${plan.key === "growth" ? "border-harlo-teal" : "border-harlo-line"}`}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-harlo-ink">{plan.name}</p>
              {plan.key === "growth" ? <span className="rounded-full bg-harlo-mist px-2 py-1 text-[10px] font-bold text-harlo-teal">Popular</span> : null}
            </div>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-harlo-ink">{formatPrice(plan.monthlyPrice)}</p>
            <p className="mt-1 text-xs font-semibold text-harlo-muted">per month</p>
            <div className="mt-5 h-2 rounded-full bg-harlo-mist">
              <div className={`h-full rounded-full ${plan.key === "growth" ? "w-4/5 bg-harlo-teal" : plan.key === "pro" ? "w-full bg-rose-400" : "w-2/5 bg-amber-400"}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupHeader({ label }: { label: string }) {
  return (
    <div className="relative flex items-center justify-between border-b border-harlo-line pb-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-harlo-teal text-white">
          <Bot size={18} />
        </span>
        <div>
          <p className="font-semibold text-harlo-ink">Harlo</p>
          <p className="text-sm text-harlo-muted">{label}</p>
        </div>
      </div>
      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-harlo-teal shadow-sm">Online</span>
    </div>
  );
}

function MetricStack({ page, content }: { page: SeoLandingPage; content: LandingContent }) {
  return (
    <div className="grid content-start gap-3">
      <div className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
        <p className="text-3xl font-semibold tracking-tight text-harlo-ink">{content.heroMetric}</p>
        <p className="mt-1 text-sm font-medium text-harlo-muted">{content.heroMetricLabel}</p>
      </div>
      {page.sections.slice(0, 2).map((section) => (
        <div key={section.title} className="rounded-lg border border-harlo-line bg-white/90 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={17} className="text-harlo-teal" />
            <p className="font-semibold text-harlo-ink">{section.title}</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-harlo-muted">{section.body}</p>
        </div>
      ))}
    </div>
  );
}

function FeatureCard({ feature, index, visualKind }: { feature: Feature; index: number; visualKind: VisualKind }) {
  const Icon = feature.icon;

  return (
    <article className="group flex min-h-[360px] flex-col rounded-lg border border-harlo-line bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-harlo-teal/40 hover:shadow-soft">
      <FeatureMiniGraphic feature={feature} index={index} visualKind={visualKind} />
      <div className="mt-5 flex items-start justify-between gap-4">
        <div className={`grid h-11 w-11 place-items-center rounded-lg ${feature.tone}`}>
          <Icon size={20} />
        </div>
        <span className="rounded-full bg-harlo-canvas px-3 py-1 text-xs font-semibold text-harlo-muted">0{index + 1}</span>
      </div>
      <p className="mt-5 text-xl font-semibold text-harlo-ink">{feature.title}</p>
      <p className="mt-3 text-base leading-7 text-harlo-muted">{feature.body}</p>
    </article>
  );
}

function FeatureMiniGraphic({ feature, index, visualKind }: { feature: Feature; index: number; visualKind: VisualKind }) {
  const accent = visualAccent(visualKind, index);

  if (feature.graphic === "sources") {
    return (
      <div className={`relative h-36 overflow-hidden rounded-lg border border-harlo-line ${accent.bg}`}>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.055)_1px,transparent_1px),linear-gradient(rgba(17,24,39,0.055)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative grid gap-2 p-4">
          {["Website pages", "Support docs", "Policies"].map((item, itemIndex) => (
            <div key={item} className="flex items-center justify-between rounded-md bg-white/90 px-3 py-2 text-sm font-semibold text-harlo-ink shadow-sm">
              <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${itemIndex === 0 ? accent.dot : "bg-harlo-mist"}`} />{item}</span>
              <CheckCircle2 size={14} className={accent.text} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (feature.graphic === "chat") {
    return (
      <div className={`relative h-36 overflow-hidden rounded-lg border border-harlo-line ${accent.bg} p-4`}>
        <div className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-harlo-ink shadow-sm">How fast can we launch?</div>
        <div className={`ml-8 mt-3 rounded-md px-3 py-3 text-sm font-semibold text-white shadow-sm ${accent.solid}`}>Today, with your brand voice.</div>
      </div>
    );
  }

  if (feature.graphic === "lead") {
    return (
      <div className={`relative h-36 overflow-hidden rounded-lg border border-harlo-line ${accent.bg} p-4`}>
        <div className="rounded-lg bg-white/90 p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Lead ready</span>
            <span className={accent.text}>92%</span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white"><div className={`h-full w-4/5 rounded-full ${accent.solid}`} /></div>
          <div className="mt-3 h-2 rounded-full bg-white"><div className="h-full w-3/5 rounded-full bg-rose-300" /></div>
        </div>
      </div>
    );
  }

  if (feature.graphic === "code") {
    return (
      <div className="relative h-36 overflow-hidden rounded-lg border border-harlo-line bg-indigo-50 p-4">
        <div className="rounded-lg bg-harlo-ink p-4 font-mono text-sm leading-7 text-cyan-100 shadow-sm">
          <p>&lt;script&gt;</p>
          <p className="text-cyan-300">harlo.mount(widget)</p>
          <p>&lt;/script&gt;</p>
        </div>
      </div>
    );
  }

  if (feature.graphic === "routes") {
    return (
      <div className={`relative h-36 overflow-hidden rounded-lg border border-harlo-line ${accent.bg} p-4`}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="rounded-lg bg-white p-3 text-sm font-semibold shadow-sm">Visitor</div>
          <ArrowRight size={18} className={accent.text} />
          <div className="rounded-lg bg-white p-3 text-sm font-semibold shadow-sm">Team</div>
        </div>
        <div className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold text-white ${accent.solid}`}>Routed with context</div>
      </div>
    );
  }

  return (
    <div className={`relative h-36 overflow-hidden rounded-lg border border-harlo-line ${accent.bg} p-4`}>
      <div className="absolute bottom-4 left-4 right-4 flex items-end gap-2">
        {[28, 46, 34, 72, 54, 88].map((height, barIndex) => (
          <div key={height} className={`flex-1 rounded-t-md ${barIndex === index % 6 ? accent.solid : "bg-white"}`} style={{ height }} />
        ))}
      </div>
    </div>
  );
}

function WorkflowGraphic({ steps, visualKind }: { steps: LandingContent["steps"]; visualKind: VisualKind }) {
  const accent = visualAccent(visualKind, 1);

  return (
    <div className={`mt-8 overflow-hidden rounded-xl border border-harlo-line ${accent.bg} p-5 shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-harlo-teal shadow-sm">{workflowLabel(visualKind)}</span>
        <span className="text-sm font-semibold text-harlo-muted">setup.harlo/workflow</span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="relative rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
            <span className={`grid h-12 w-12 place-items-center rounded-full text-base font-semibold ${index === 1 ? `${accent.solid} text-white` : "bg-harlo-mist text-harlo-teal"}`}>
              0{index + 1}
            </span>
            <p className="mt-4 text-lg font-semibold text-harlo-ink">{step.title}</p>
            <p className="mt-2 text-sm font-medium text-harlo-muted">{step.stat}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function UseCaseGraphic({ index, visualKind, metric }: { index: number; visualKind: VisualKind; metric: string }) {
  const accent = visualAccent(visualKind, index);

  return (
    <div className={`relative h-32 overflow-hidden ${accent.bg} p-5`}>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.045)_1px,transparent_1px),linear-gradient(rgba(17,24,39,0.045)_1px,transparent_1px)] bg-[size:34px_34px]" />
      <div className="relative flex items-center justify-between">
        <span className={`grid h-12 w-12 place-items-center rounded-xl text-white ${accent.solid}`}>
          {index === 0 ? <LifeBuoy size={20} /> : index === 1 ? <UsersRound size={20} /> : <Database size={20} />}
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-harlo-ink shadow-sm">{metric}</span>
      </div>
      <div className="relative mt-5 h-2 rounded-full bg-white/80"><div className={`h-full rounded-full ${accent.solid}`} style={{ width: `${64 + index * 11}%` }} /></div>
    </div>
  );
}

function PricingCard({ plan, interval }: { plan: (typeof BILLING_PLANS)[number]; interval: BillingInterval }) {
  const isGrowth = plan.key === "growth";
  const price = interval === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;
  const annualTotal = plan.annualMonthlyPrice * 12;
  const planIcon = planIcons[plan.key];

  return (
    <article className={`rounded-lg border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft ${isGrowth ? "border-harlo-teal" : "border-harlo-line"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid h-8 w-8 shrink-0 place-items-center bg-gradient-to-br ${planIcon.gradient} ${planIcon.shape}`}>
            <span className={`block h-3.5 w-3.5 ${planIcon.inner}`} />
          </span>
          <p className="text-2xl font-semibold text-harlo-ink">{plan.name}</p>
        </div>
        {plan.key === "starter" ? (
          <span className="group/trial relative inline-flex items-center gap-1.5 rounded-full border border-harlo-line bg-harlo-mist px-2.5 py-1 text-xs font-medium text-harlo-teal">
            {TRIAL_CONFIG.days}-day trial
            <Info size={13} aria-hidden="true" />
            <span
              role="tooltip"
              className="pointer-events-none absolute right-0 top-[calc(100%+0.6rem)] z-10 w-64 rounded-lg border border-harlo-line bg-white p-3 text-left text-xs leading-5 text-harlo-muted opacity-0 shadow-soft transition group-hover/trial:opacity-100 group-focus-within/trial:opacity-100"
            >
              Includes {TRIAL_CONFIG.credits} trial credits before converting to Starter. Card required.
            </span>
          </span>
        ) : isGrowth ? <span className="rounded-full bg-harlo-mist px-3 py-1 text-xs font-semibold text-harlo-teal">Popular</span> : null}
      </div>
      <div className="mt-5 flex min-h-12 flex-wrap items-center gap-2">
        <div className="flex w-[120px] shrink-0 items-end leading-none">
          <span className="text-5xl font-semibold tracking-tight text-harlo-ink">$</span>
          <span className="relative inline-block h-12 min-w-24 overflow-hidden tabular-nums">
            <span key={`${plan.key}-${interval}-seo-price`} className="absolute inset-x-0 top-0 text-5xl font-semibold tracking-tight text-harlo-ink [animation:harloPriceSlot_420ms_cubic-bezier(0.2,0.8,0.2,1)_forwards]">
              {price}
            </span>
          </span>
        </div>
        {interval === "annual" ? (
          <span className="rounded-full bg-gradient-to-r from-rose-500 to-red-300 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-red-100">
            20% off
          </span>
        ) : null}
      </div>
      <div className="mt-2 min-h-6 overflow-hidden">
        <p className="flex flex-wrap items-center gap-2 text-base font-medium text-harlo-muted">
          <span>per month</span>
          {interval === "annual" ? <span className="text-harlo-teal">{formatPrice(annualTotal)} billed annually</span> : null}
        </p>
      </div>
      <p className="mt-5 min-h-14 text-base leading-7 text-harlo-muted">{landingPlanDescriptions[plan.key]}</p>
      <Link
        href={plan.key === "starter" ? START_FREE_TRIAL_HREF : "/dashboard"}
        className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition ${
          isGrowth ? "bg-harlo-ink text-white hover:bg-harlo-navy" : "border border-harlo-line bg-white text-harlo-ink hover:border-harlo-teal hover:text-harlo-teal"
        }`}
      >
        {plan.key === "starter" ? "Start free trial" : "Subscribe"}
      </Link>
      <div className="mt-6 grid gap-3">
        {plan.features.map((feature) => (
          <p key={feature} className="flex items-center gap-2 text-base font-semibold text-harlo-muted">
            <CheckCircle2 size={17} className="text-harlo-teal" />
            {feature}
          </p>
        ))}
      </div>
    </article>
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
    <div className="grid grid-cols-2 rounded-lg border border-harlo-line bg-white p-1 shadow-sm">
      {(["monthly", "annual"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-md px-4 py-2 text-sm font-semibold capitalize transition ${
            interval === option ? "bg-harlo-ink text-white shadow-sm" : "text-harlo-muted hover:text-harlo-ink"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function SectionBadge({ children, variant = "light" }: { children: string; variant?: "light" | "dark" }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold shadow-sm ${
        variant === "dark" ? "border-white/20 bg-white/10 text-white" : "border-harlo-line bg-white text-harlo-teal"
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-harlo-blue" />
      {children}
    </span>
  );
}

function mergeContent(path: string): LandingContent {
  const overrides = contentByPath[path] ?? {};

  return {
    ...defaultContent,
    ...overrides,
    features: overrides.features ?? defaultContent.features,
    steps: overrides.steps ?? defaultContent.steps,
    useCases: overrides.useCases ?? defaultContent.useCases,
    faqs: overrides.faqs ?? defaultContent.faqs,
    proof: overrides.proof ?? defaultContent.proof
  };
}

function visualAccent(visualKind: VisualKind, index: number) {
  const palettes: Record<VisualKind, Array<{ bg: string; solid: string; text: string; dot: string }>> = {
    website: [
      { bg: "bg-cyan-50", solid: "bg-harlo-teal", text: "text-harlo-teal", dot: "bg-harlo-teal" },
      { bg: "bg-emerald-50", solid: "bg-emerald-500", text: "text-emerald-600", dot: "bg-emerald-500" },
      { bg: "bg-sky-50", solid: "bg-sky-500", text: "text-sky-600", dot: "bg-sky-500" }
    ],
    lead: [
      { bg: "bg-rose-50", solid: "bg-rose-500", text: "text-rose-500", dot: "bg-rose-500" },
      { bg: "bg-amber-50", solid: "bg-amber-500", text: "text-amber-600", dot: "bg-amber-500" },
      { bg: "bg-orange-50", solid: "bg-orange-500", text: "text-orange-600", dot: "bg-orange-500" }
    ],
    support: [
      { bg: "bg-emerald-50", solid: "bg-emerald-500", text: "text-emerald-600", dot: "bg-emerald-500" },
      { bg: "bg-cyan-50", solid: "bg-harlo-teal", text: "text-harlo-teal", dot: "bg-harlo-teal" },
      { bg: "bg-slate-50", solid: "bg-slate-700", text: "text-slate-700", dot: "bg-slate-700" }
    ],
    "small-business": [
      { bg: "bg-amber-50", solid: "bg-amber-500", text: "text-amber-600", dot: "bg-amber-500" },
      { bg: "bg-cyan-50", solid: "bg-harlo-teal", text: "text-harlo-teal", dot: "bg-harlo-teal" },
      { bg: "bg-emerald-50", solid: "bg-emerald-500", text: "text-emerald-600", dot: "bg-emerald-500" }
    ],
    pricing: [
      { bg: "bg-sky-50", solid: "bg-sky-500", text: "text-sky-600", dot: "bg-sky-500" },
      { bg: "bg-harlo-mist", solid: "bg-harlo-teal", text: "text-harlo-teal", dot: "bg-harlo-teal" },
      { bg: "bg-rose-50", solid: "bg-rose-500", text: "text-rose-500", dot: "bg-rose-500" }
    ]
  };

  return palettes[visualKind][index % palettes[visualKind].length];
}

function workflowHeadline(visualKind: VisualKind) {
  const headlines: Record<VisualKind, string> = {
    website: "From site content to useful website chatbot.",
    lead: "From visitor intent to clean lead handoff.",
    support: "From support knowledge to instant first answers.",
    "small-business": "From small setup to always-on website help.",
    pricing: "From traffic estimate to the right plan."
  };
  return headlines[visualKind];
}

function workflowIntro(visualKind: VisualKind) {
  const intros: Record<VisualKind, string> = {
    website: "Build the assistant around the pages and documents visitors already use to make decisions.",
    lead: "Capture only the details your team needs, at the moment the visitor is ready for follow-up.",
    support: "Give Harlo approved sources and guardrails so it can answer safely and escalate cleanly.",
    "small-business": "Keep setup practical, then add capacity as the website starts handling more conversations.",
    pricing: "Choose based on expected message volume, then add credits, seats, or agents when usage grows."
  };
  return intros[visualKind];
}

function workflowLabel(visualKind: VisualKind) {
  const labels: Record<VisualKind, string> = {
    website: "Website launch path",
    lead: "Lead routing path",
    support: "Support readiness path",
    "small-business": "Small team path",
    pricing: "Plan selection path"
  };
  return labels[visualKind];
}

function useCaseHeadline(visualKind: VisualKind) {
  const headlines: Record<VisualKind, string> = {
    website: "Where a website chatbot creates leverage.",
    lead: "Where better lead capture pays off.",
    support: "Where support AI reduces repeat work.",
    "small-business": "Where small teams get time back.",
    pricing: "Which plan fits your stage."
  };
  return headlines[visualKind];
}

function pricingHeadline(visualKind: VisualKind) {
  const headlines: Record<VisualKind, string> = {
    website: "Plans for website conversation volume.",
    lead: "Pricing for qualified lead capture.",
    support: "Support automation plans that can scale.",
    "small-business": "Start simple and grow when traffic grows.",
    pricing: "Compare Harlo AI chatbot pricing."
  };
  return headlines[visualKind];
}

function compareHeadline(visualKind: VisualKind) {
  const headlines: Record<VisualKind, string> = {
    website: "A more useful alternative to static website chat.",
    lead: "A better handoff than a generic form.",
    support: "A safer first answer than disconnected scripts.",
    "small-business": "More practical than enterprise chatbot suites.",
    pricing: "What each plan is built to handle."
  };
  return headlines[visualKind];
}
