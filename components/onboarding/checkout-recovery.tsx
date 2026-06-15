"use client";

import { useState } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BILLING_PLANS,
  TRIAL_CONFIG,
  formatPrice,
  getBillingPlan,
  type BillingInterval,
  type BillingPlanKey
} from "@/lib/billing/plans";

type CheckoutRecoveryProps = {
  organizationName: string;
  initialPlanKey: BillingPlanKey;
  initialInterval: BillingInterval;
  checkoutState?: string;
};

const planIcons: Record<BillingPlanKey, LucideIcon> = {
  starter: MessageSquareText,
  growth: Users,
  pro: Bot
};

export function CheckoutRecovery({
  organizationName,
  initialPlanKey,
  initialInterval,
  checkoutState
}: CheckoutRecoveryProps) {
  const [planKey, setPlanKey] = useState(initialPlanKey);
  const [interval, setInterval] = useState(initialInterval);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const plan = getBillingPlan(planKey);
  const price = interval === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;
  const annualTotal = plan.annualMonthlyPrice * 12;

  async function handleCheckout() {
    setIsPending(true);
    setError(null);

    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        planKey,
        interval,
        successPath: "/onboarding/checkout/success?welcome=1",
        cancelPath: "/onboarding/checkout?checkout=canceled"
      })
    });
    const result = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

    if (!response.ok || !result?.url) {
      setError(result?.error ?? "Could not open checkout.");
      setIsPending(false);
      return;
    }

    window.location.assign(result.url);
  }

  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-6 sm:pb-14 sm:pt-9">
      <div className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(400px,1.1fr)] lg:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold uppercase text-white/75">
            <CheckCircle2 size={14} className="text-harlo-blue" />
            Workspace ready
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.04] text-white sm:text-5xl lg:text-6xl">
            Choose how {organizationName} launches.
          </h1>
        </div>
        <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg lg:pb-1">
          Select the plan that fits your traffic today. You can change plans as your website conversations grow.
        </p>
      </div>

      {checkoutState === "canceled" ? (
        <div className="mb-5 rounded-lg border border-amber-300/30 bg-amber-200/10 px-4 py-3 text-sm font-medium text-amber-100">
          Checkout was canceled. Your workspace is saved, so you can continue whenever you are ready.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-white/10 bg-white shadow-[0_32px_100px_rgba(0,0,0,0.28)]">
        <div className="grid xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 p-5 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-harlo-teal">Plan selection</p>
                <h2 className="mt-2 text-2xl font-semibold text-harlo-ink sm:text-3xl">Pick the right starting point.</h2>
                <p className="mt-2 text-sm leading-6 text-harlo-muted">All plans include the website widget, inbox, knowledge, and lead capture.</p>
              </div>
              <BillingIntervalToggle interval={interval} onChange={setInterval} />
            </div>

            <div className="mt-7 grid gap-3 lg:grid-cols-3">
              {BILLING_PLANS.map((item) => {
                const Icon = planIcons[item.key];
                const selected = planKey === item.key;
                const itemPrice = interval === "annual" ? item.annualMonthlyPrice : item.monthlyPrice;

                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setPlanKey(item.key)}
                    className={`relative flex min-h-56 flex-col rounded-lg border p-5 text-left transition ${selected
                      ? "border-harlo-teal bg-harlo-mist/60 shadow-sm"
                      : "border-harlo-line bg-white hover:-translate-y-0.5 hover:border-harlo-teal/60 hover:shadow-sm"
                      }`}
                  >
                    {item.key === "growth" ? (
                      <span className="absolute right-4 top-4 rounded-full bg-harlo-ink px-2.5 py-1 text-[10px] font-semibold uppercase text-white">
                        Popular
                      </span>
                    ) : null}
                    <span className={`grid h-10 w-10 place-items-center rounded-lg ${selected ? "bg-harlo-teal text-white" : "bg-slate-100 text-harlo-muted"}`}>
                      <Icon size={18} />
                    </span>
                    <span className="mt-5 text-lg font-semibold text-harlo-ink">{item.name}</span>
                    <span className="mt-2 flex items-end gap-1 text-harlo-ink">
                      <span className="text-3xl font-semibold">{formatPrice(itemPrice)}</span>
                      <span className="pb-1 text-xs font-medium text-harlo-muted">/month</span>
                    </span>
                    <span className="mt-3 text-xs leading-5 text-harlo-muted">{item.description}</span>
                    <span className={`mt-auto pt-5 text-xs font-semibold ${selected ? "text-harlo-teal" : "text-harlo-muted"}`}>
                      {selected ? "Selected" : "Choose plan"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 grid gap-x-8 gap-y-3 border-t border-harlo-line pt-6 sm:grid-cols-2">
              {plan.features.map((feature) => (
                <span key={feature} className="flex items-start gap-2.5 text-sm font-medium text-harlo-muted">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-harlo-teal" />
                  {feature}
                </span>
              ))}
            </div>
          </div>

          <aside className="relative overflow-hidden bg-[#07111a] p-6 text-white sm:p-8 xl:min-h-[680px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(13,143,170,0.38),transparent_38%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:auto,48px_48px,48px_48px]" />
            <div className="relative flex h-full flex-col">
              <div>
                <p className="text-xs font-semibold uppercase text-white/50">Order summary</p>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-semibold">{plan.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{interval === "annual" ? "Annual billing" : "Monthly billing"}</p>
                  </div>
                  <CreditCard size={23} className="text-harlo-blue" />
                </div>

                <div className="mt-7 border-y border-white/10 py-6">
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-sm text-slate-400">Plan price</span>
                    <span className="text-3xl font-semibold">
                      {formatPrice(price)}
                      <span className="ml-1 text-xs font-medium text-slate-400">/month</span>
                    </span>
                  </div>
                  {interval === "annual" ? (
                    <p className="mt-2 text-right text-xs font-medium text-harlo-blue">{formatPrice(annualTotal)} billed annually</p>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-3 text-sm text-slate-300">
                  <span className="flex items-center gap-2.5">
                    <ShieldCheck size={16} className="shrink-0 text-harlo-blue" />
                    Secure Stripe checkout
                  </span>
                  <span className="flex items-center gap-2.5">
                    <LockKeyhole size={16} className="shrink-0 text-harlo-blue" />
                    Cancel or change plans later
                  </span>
                  <span className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="shrink-0 text-harlo-blue" />
                    {planKey === "starter"
                      ? `${TRIAL_CONFIG.days}-day trial with ${TRIAL_CONFIG.credits} credits`
                      : "Access starts after checkout"}
                  </span>
                </div>
              </div>

              <div className="mt-8 xl:mt-auto">
                {error ? (
                  <div role="alert" className="mb-4 rounded-lg border border-red-300/30 bg-red-300/10 px-3 py-3 text-sm text-red-100">
                    {error}
                  </div>
                ) : null}
                <Button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isPending}
                  className="h-14 w-full border border-white/20 text-base font-semibold text-harlo-ink shadow-[0_12px_34px_rgba(255,255,255,0.18)] transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-harlo-blue hover:shadow-[0_16px_40px_rgba(255,255,255,0.24)] focus-visible:ring-2 focus-visible:ring-harlo-blue focus-visible:ring-offset-2 focus-visible:ring-offset-harlo-ink disabled:translate-y-0 disabled:bg-white/70 disabled:shadow-none"
                >
                  {isPending ? <Loader2 className="animate-spin" size={17} /> : null}
                  Continue to checkout
                  <ArrowRight size={17} />
                </Button>
                <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                  Your workspace setup is already saved.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
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
          className={`inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold capitalize transition sm:min-w-28 ${interval === option
            ? "bg-harlo-ink text-white shadow-[0_10px_24px_rgba(17,24,39,0.18)]"
            : "text-harlo-muted hover:bg-harlo-mist hover:text-harlo-ink"
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
