"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BillingIntervalToggle } from "@/components/landing/pricing-landing-sections";
import {
  BILLING_PLANS,
  getBillingPlan,
  formatPrice,
  type BillingInterval,
  type BillingPlanKey
} from "@/lib/billing/plans";

type CheckoutRecoveryProps = {
  organizationName: string;
  initialPlanKey: BillingPlanKey;
  initialInterval: BillingInterval;
  checkoutState?: string;
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
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center px-6 py-12">
      <div className="relative w-full overflow-hidden rounded-2xl border border-harlo-line bg-white p-6 shadow-soft sm:p-8">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.045)_1px,transparent_1px),linear-gradient(rgba(17,24,39,0.045)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-harlo-line bg-white px-3 py-1.5 text-sm font-semibold text-harlo-teal shadow-sm">
              <span className="h-2 w-2 rounded-full bg-harlo-blue" />
              Choose plan
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-harlo-ink sm:text-5xl">
              Choose a plan for {organizationName}.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-harlo-muted">
              Your workspace is ready. Pick a plan, then continue to secure card-required checkout to unlock the dashboard.
            </p>
            {checkoutState === "canceled" ? (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                Checkout was canceled. Your workspace is saved, and you can continue from here whenever you sign back in.
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-harlo-line bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-harlo-muted">Selected plan</p>
                <p className="mt-1 text-2xl font-semibold text-harlo-ink">{plan.name}</p>
              </div>
              <BillingIntervalToggle interval={interval} onChange={setInterval} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {BILLING_PLANS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPlanKey(item.key)}
                  className={`rounded-lg border p-4 text-left transition ${
                    planKey === item.key
                      ? "border-harlo-teal bg-harlo-mist text-harlo-ink shadow-sm"
                      : "border-harlo-line bg-white text-harlo-muted hover:border-harlo-teal/60"
                  }`}
                >
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-2 text-2xl font-semibold text-harlo-ink">
                    {formatPrice(interval === "annual" ? item.annualMonthlyPrice : item.monthlyPrice)}
                  </p>
                  <p className="mt-1 text-xs font-semibold">per month</p>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-harlo-line bg-[#f8fbfa] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-harlo-ink">{formatPrice(price)} per month</p>
                  <p className="mt-1 text-sm text-harlo-muted">
                    {planKey === "starter" ? "14-day trial, card required." : "Subscription starts after checkout."}
                  </p>
                </div>
                <CreditCard className="text-harlo-teal" size={22} />
              </div>
              <div className="mt-4 grid gap-2 text-sm font-medium text-harlo-muted">
                {plan.features.slice(0, 3).map((feature) => (
                  <span key={feature} className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-harlo-teal" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <Button onClick={handleCheckout} disabled={isPending} className="mt-5 w-full">
              {isPending ? <Loader2 className="animate-spin" size={16} /> : null}
              Continue to secure checkout
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
