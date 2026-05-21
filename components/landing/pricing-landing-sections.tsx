"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, CalendarCheck, CheckCircle2, Info, Sparkles, UserPlus, Zap } from "lucide-react";
import { CalendlyDemoButton } from "@/components/calendly-demo-button";
import { CtaPhoneGraphic } from "@/components/cta-phone-graphic";
import { CurvedLineBackdrop } from "@/components/curved-line-backdrop";
import { Badge } from "@/components/ui/badge";
import {
  BILLING_ADD_ONS,
  BILLING_PLANS,
  TRIAL_CONFIG,
  formatPrice,
  type AddOnKey,
  type BillingInterval,
  type BillingPlanKey
} from "@/lib/billing/plans";
import { getSignupHref } from "@/lib/onboarding/signup-url";

const planIcons: Record<string, { shape: string; gradient: string; inner: string }> = {
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

const landingPlanCtas: Record<string, string> = {
  starter: "Start free trial",
  growth: "Subscribe",
  pro: "Subscribe"
};

const landingPlanDescriptions: Record<string, string> = {
  starter: "For small teams launching one chatbot.",
  growth: "For steady traffic and automation.",
  pro: "For higher volume and priority support."
};

const addOnIcons: Record<AddOnKey, typeof Zap> = {
  auto_recharge_credits: Zap,
  extra_agent: Bot,
  extra_seat: UserPlus,
  remove_branding: Sparkles
};

const addOnLabels: Record<AddOnKey, string> = {
  auto_recharge_credits: "Usage",
  extra_agent: "Agents",
  extra_seat: "Seats",
  remove_branding: "Brand"
};

const compareRows = [
  {
    label: "Message credits",
    detail: "Included assistant replies each billing period.",
    values: {
      starter: "500",
      growth: "4,000",
      pro: "15,000"
    }
  },
  {
    label: "Included agents",
    detail: "Separate assistants for sites, brands, or workflows.",
    values: {
      starter: "1",
      growth: "1",
      pro: "1"
    }
  },
  {
    label: "Included seats",
    detail: "Team members who can manage Harlo.",
    values: {
      starter: "2",
      growth: "3",
      pro: "5"
    }
  },
  {
    label: "Knowledge updates",
    detail: "How Harlo keeps approved answers current.",
    values: {
      starter: "Manual",
      growth: "Auto-retrain",
      pro: "Auto-retrain"
    }
  },
  {
    label: "Support",
    detail: "Help level included with the workspace.",
    values: {
      starter: "Standard",
      growth: "Standard",
      pro: "Priority"
    }
  }
] satisfies Array<{ label: string; detail: string; values: Record<BillingPlanKey, string> }>;

const faqItems = [
  {
    question: "What counts as a message credit?",
    answer: "Message credits are used when Harlo generates assistant replies. Plan credits reset each billing period, and add-on credits can extend capacity when traffic spikes."
  },
  {
    question: "Can I change plans later?",
    answer: "Yes. You can start with Starter, move to Growth as traffic increases, or upgrade to Pro for higher volume and priority support."
  },
  {
    question: "Do I need engineering help to install Harlo?",
    answer: "Most teams only need to paste one widget snippet into their website. The dashboard handles knowledge, styling, lead fields, and behavior."
  },
  {
    question: "What happens when Harlo cannot answer?",
    answer: "Harlo can collect lead details, preserve the conversation context, and help route the visitor to your team instead of guessing."
  },
  {
    question: "Where do captured leads show up?",
    answer: "Captured leads appear in the Harlo dashboard with contact details, conversation context, and the visitor intent your team needs for follow-up."
  },
  {
    question: "Can my team manage Harlo together?",
    answer: "Yes. Team members can help manage knowledge, review leads, update widget settings, and keep the website assistant aligned as your workspace grows."
  }
];

type PricingLandingSectionsProps = {
  ctaHeadline?: string;
};

export function PricingLandingSections({
  ctaHeadline = "Turn website visitors into qualified leads today."
}: PricingLandingSectionsProps) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [openFaq, setOpenFaq] = useState(-1);

  return (
    <>
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <SectionBadge>Pricing</SectionBadge>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink md:text-5xl">Pricing that scales with real conversations.</h2>
            <p className="mt-3 text-harlo-muted">
              Harlo starts in the same range as lightweight AI chatbot tools, then scales by conversation volume, knowledge size, and support workflow depth.
            </p>
          </div>
          <div className="shrink-0 self-start lg:self-end">
            <BillingIntervalToggle interval={interval} onChange={setInterval} />
          </div>
        </div>

        <section id="plans" className="mt-8 grid gap-4 lg:grid-cols-3">
          {BILLING_PLANS.map((plan) => {
            const price = interval === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;
            const annualTotal = plan.annualMonthlyPrice * 12;
            const planIcon = planIcons[plan.key];

            return (
              <div key={plan.key} className={`rounded-lg border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-harlo-teal/50 hover:shadow-md ${plan.key === "growth" ? "border-harlo-teal" : "border-harlo-line"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center bg-gradient-to-br ${planIcon.gradient} ${planIcon.shape}`}>
                      <span className={`block h-3.5 w-3.5 ${planIcon.inner}`} />
                    </span>
                    <p className="text-xl font-semibold text-harlo-ink">{plan.name}</p>
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
                  ) : plan.key === "growth" ? <Badge>Popular</Badge> : null}
                </div>
                <div className="mt-4 flex min-h-11 flex-wrap items-center gap-1.5">
                  <div className="flex w-[104px] shrink-0 items-end leading-none">
                    <span className="text-4xl font-semibold text-harlo-ink">$</span>
                    <span className="relative inline-block h-10 min-w-20 overflow-hidden tabular-nums">
                      <span key={`${plan.key}-${interval}-price`} className="absolute inset-x-0 top-0 text-4xl font-semibold text-harlo-ink [animation:harloPriceSlot_420ms_cubic-bezier(0.2,0.8,0.2,1)_forwards]">
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
                <div className="mt-2 min-h-5 overflow-hidden">
                  <p className="flex flex-wrap items-center gap-2 text-base font-medium text-harlo-muted">
                    <span>per month</span>
                    {interval === "annual" ? <span className="text-harlo-teal">{formatPrice(annualTotal)} billed annually</span> : null}
                  </p>
                </div>
                <p className="mt-3 text-base leading-7 text-harlo-muted">{landingPlanDescriptions[plan.key]}</p>
                <Link
                  href={getSignupHref(plan.key, interval)}
                  className={`mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-base font-semibold transition focus:outline-none focus:ring-2 focus:ring-harlo-teal focus:ring-offset-2 ${
                    plan.key === "growth"
                      ? "bg-harlo-ink text-white shadow-sm hover:bg-harlo-navy"
                      : "border border-harlo-line bg-white text-harlo-ink hover:border-harlo-teal hover:text-harlo-teal"
                  }`}
                >
                  {landingPlanCtas[plan.key]}
                </Link>
                <div className="mt-5 space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-base font-semibold text-harlo-muted">
                      <CheckCircle2 size={17} className="text-harlo-teal" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </section>

      <section id="add-ons" className="border-y border-harlo-line bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <SectionBadge>Add-ons</SectionBadge>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink md:text-5xl">Simple upgrades when your workspace grows.</h2>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {BILLING_ADD_ONS.map((addOn) => {
              const Icon = addOnIcons[addOn.key];

              return (
                <div key={addOn.key} className="flex min-h-64 flex-col rounded-lg border border-harlo-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-harlo-teal/50 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                      <Icon size={18} />
                    </span>
                    <span className="rounded-full bg-harlo-canvas px-2.5 py-1 text-sm font-semibold text-harlo-muted">
                      {addOnLabels[addOn.key]}
                    </span>
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

      <section id="compare" className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <SectionBadge>Compare</SectionBadge>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink md:text-5xl">Pick the plan that matches your website traffic.</h2>
            <p className="mt-3 text-harlo-muted">
              Compare the limits that matter most before you launch, then switch billing without losing the plan context.
            </p>
          </div>
          <div className="shrink-0 self-start lg:self-end">
            <BillingIntervalToggle interval={interval} onChange={setInterval} />
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-harlo-line bg-white p-3 shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[1.05fr_repeat(3,1fr)] gap-3">
                <div className="rounded-lg border border-harlo-line bg-harlo-canvas p-4">
                  <p className="text-base font-semibold text-harlo-ink">Plan snapshot</p>
                  <p className="mt-2 text-base leading-7 text-harlo-muted">
                    Prices update with the billing toggle and the Growth plan stays highlighted for teams with steady traffic.
                  </p>
                </div>
                {BILLING_PLANS.map((plan) => {
                  const price = interval === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;
                  const annualTotal = plan.annualMonthlyPrice * 12;
                  const planIcon = planIcons[plan.key];

                  return (
                    <div
                      key={plan.key}
                      className={`rounded-lg border bg-white p-4 ${
                        plan.key === "growth" ? "border-harlo-teal shadow-sm" : "border-harlo-line"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`grid h-8 w-8 shrink-0 place-items-center bg-gradient-to-br ${planIcon.gradient} ${planIcon.shape}`}>
                            <span className={`block h-3.5 w-3.5 ${planIcon.inner}`} />
                          </span>
                          <p className="text-lg font-semibold text-harlo-ink">{plan.name}</p>
                        </div>
                        {plan.key === "growth" ? <Badge>Popular</Badge> : null}
                      </div>
                      <div className="mt-4 flex min-h-11 flex-wrap items-center gap-1.5">
                        <div className="flex w-[104px] shrink-0 items-end leading-none">
                          <span className="text-4xl font-semibold text-harlo-ink">$</span>
                          <span className="relative inline-block h-10 min-w-20 overflow-hidden tabular-nums">
                            <span key={`compare-${plan.key}-${interval}-price`} className="absolute inset-x-0 top-0 text-4xl font-semibold text-harlo-ink [animation:harloPriceSlot_420ms_cubic-bezier(0.2,0.8,0.2,1)_forwards]">
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
                      <p className="mt-2 min-h-5 text-base font-medium text-harlo-muted">
                        per month
                        {interval === "annual" ? <span className="ml-2 text-harlo-teal">{formatPrice(annualTotal)} billed annually</span> : null}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 space-y-2">
                {compareRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[1.05fr_repeat(3,1fr)] gap-3 rounded-lg border border-harlo-line bg-white p-2">
                    <div className="rounded-md bg-harlo-canvas p-3">
                      <p className="text-base font-semibold text-harlo-ink">{row.label}</p>
                      <p className="mt-1 text-sm leading-6 text-harlo-muted">{row.detail}</p>
                    </div>
                    {BILLING_PLANS.map((plan) => (
                      <div
                        key={plan.key}
                        className={`flex items-center rounded-md px-3 text-base font-semibold ${
                          plan.key === "growth" ? "bg-harlo-mist text-harlo-teal" : "bg-white text-harlo-muted"
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
      </section>

      <section id="faq" className="relative overflow-hidden border-t border-harlo-line bg-white">
        <CurvedLineBackdrop />
        <div className="relative">
          <div className="relative mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <SectionBadge>FAQ</SectionBadge>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink md:text-5xl">Questions teams ask before launching.</h2>
            </div>
            <div className="divide-y divide-harlo-line rounded-lg border border-harlo-line bg-white/95 shadow-sm backdrop-blur">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;

                return (
                  <div key={item.question} className="p-5">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 text-left text-base font-semibold text-harlo-ink"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    >
                      {item.question}
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-harlo-mist text-harlo-teal transition duration-300 ${isOpen ? "rotate-45" : ""}`}>
                        +
                      </span>
                    </button>
                    <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <p className={`max-w-2xl pt-3 text-sm leading-6 text-harlo-muted transition duration-300 ${isOpen ? "translate-y-0" : "-translate-y-1"}`}>
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-16">
          <div className="relative overflow-hidden rounded-2xl bg-harlo-navy px-6 py-12 text-white shadow-soft md:px-16 md:py-16 lg:pr-[28rem]">
            <div className="absolute inset-0 bg-gradient-to-br from-harlo-navy via-harlo-ink to-harlo-teal" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:56px_56px] opacity-40" />
            <CtaPhoneGraphic />
            <div className="relative flex min-h-[340px] max-w-3xl flex-col justify-center">
              <SectionBadge variant="dark">Launch</SectionBadge>
              <h2 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight md:text-6xl">
                {ctaHeadline}
              </h2>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={getSignupHref("starter", interval)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-harlo-ink transition hover:bg-harlo-mist focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-harlo-ink"
                >
                  Start free trial <ArrowRight size={16} />
                </Link>
                <CalendlyDemoButton className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-harlo-ink">
                  <CalendarCheck size={16} />
                  Book a Demo
                </CalendlyDemoButton>
                <p className="flex items-center gap-2 text-sm font-medium text-white/80">
                  <Info size={16} />
                  50 trial credits included
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function BillingIntervalToggle({
  interval,
  onChange
}: {
  interval: BillingInterval;
  onChange: (interval: BillingInterval) => void;
}) {
  return (
    <div className="inline-grid min-w-max shrink-0 grid-cols-2 rounded-lg border border-harlo-line bg-white p-1 shadow-sm">
      {(["monthly", "annual"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold capitalize transition ${
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
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold shadow-sm ${
        variant === "dark" ? "border-white/20 bg-white/10 text-white" : "border-harlo-line bg-white text-harlo-teal"
      } self-start`}
    >
      <span className="h-2 w-2 rounded-full bg-harlo-blue" />
      {children}
    </span>
  );
}
