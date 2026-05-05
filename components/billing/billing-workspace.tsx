"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Bot, CheckCircle2, CreditCard, Sparkles, UserPlus, Zap } from "lucide-react";
import {
  BILLING_ADD_ONS,
  BILLING_PLANS,
  formatPrice,
  type AddOnKey,
  type BillingInterval
} from "@/lib/billing/plans";
import type { BillingOverview } from "@/lib/harlo/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToastViewport, useToast } from "@/components/ui/toast";

const addOnIcons: Record<AddOnKey, typeof Zap> = {
  auto_recharge_credits: Zap,
  extra_agent: Bot,
  extra_seat: UserPlus,
  remove_branding: Sparkles
};

const addOnLabels: Record<AddOnKey, string> = {
  auto_recharge_credits: "Usage protection",
  extra_agent: "Workspace expansion",
  extra_seat: "Team access",
  remove_branding: "Branding"
};

const addOnCtas: Record<AddOnKey, string> = {
  auto_recharge_credits: "Configure",
  extra_agent: "Add agent",
  extra_seat: "Add seat",
  remove_branding: "Remove branding"
};

const addOnGradients: Record<AddOnKey, string> = {
  auto_recharge_credits: "from-sky-100 to-cyan-50 text-sky-700",
  extra_agent: "from-emerald-100 to-teal-50 text-emerald-700",
  extra_seat: "from-violet-100 to-sky-50 text-violet-700",
  remove_branding: "from-rose-100 to-amber-50 text-rose-700"
};

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

type BillingWorkspaceProps = {
  billing: BillingOverview;
};

export function BillingControls({ billing }: BillingWorkspaceProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const { toast, showToast, dismissToast } = useToast();
  const periodEnd = new Date(billing.periodEnd);

  async function openBillingPortal(actionLabel = "Manage billing") {
    setPendingAction(actionLabel);

    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = await response.json();

      if (!response.ok || !payload.url) {
        showToast("error", payload.error ?? "Billing portal could not be opened.");
        return;
      }

      window.location.assign(payload.url);
    } catch {
      showToast("error", "Billing portal could not be opened.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="rounded-lg border border-harlo-line bg-white shadow-sm">
      <ToastViewport toast={toast} onDismiss={dismissToast} />
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
            <CreditCard size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-harlo-ink">Subscription</h2>
            <p className="mt-1 text-sm leading-6 text-harlo-muted">Manage payment details, invoices, and subscription changes in Stripe.</p>
          </div>
        </div>
        <div className="mt-5 space-y-3 rounded-lg border border-harlo-line bg-harlo-canvas p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-harlo-muted">Status</span>
            <Badge>{billing.cancelAtPeriodEnd ? "Canceling" : billing.status === "active" ? "Active" : billing.status}</Badge>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-harlo-muted">Renewal</span>
            <span className="text-right text-sm font-semibold text-harlo-ink">{formatDate(periodEnd)}</span>
          </div>
        </div>
        <Button type="button" variant="primary" className="mt-4 w-full" onClick={() => openBillingPortal()} disabled={pendingAction === "Manage billing"}>
          <CreditCard size={16} />
          {pendingAction === "Manage billing" ? "Opening..." : "Manage billing"}
        </Button>
      </div>
    </section>
  );
}

export function BillingWorkspace({ billing }: BillingWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutNoticeShown = useRef(false);
  const [interval, setInterval] = useState<BillingInterval>(billing.interval);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const { toast, showToast, dismissToast } = useToast();
  const currentPlanIndex = BILLING_PLANS.findIndex((plan) => plan.key === billing.planKey);

  useEffect(() => {
    const checkout = searchParams.get("checkout");

    if (checkoutNoticeShown.current || !checkout) {
      return;
    }

    checkoutNoticeShown.current = true;

    if (checkout === "success") {
      showToast("success", "Checkout completed. Your subscription is syncing with Stripe.");
    }

    if (checkout === "canceled") {
      showToast("error", "Checkout was canceled. No billing changes were made.");
    }
  }, [searchParams]);

  function changeInterval(nextInterval: BillingInterval) {
    setInterval(nextInterval);
  }

  async function startCheckout(planKey: string, actionLabel: string) {
    setPendingAction(actionLabel);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, interval })
      });
      const payload = await response.json();

      if (!response.ok || !payload.url) {
        showToast("error", payload.error ?? "Checkout could not be started.");
        return;
      }

      window.location.assign(payload.url);
    } catch {
      showToast("error", "Checkout could not be started.");
    } finally {
      setPendingAction(null);
    }
  }

  async function openBillingPortal(actionLabel = "Manage billing") {
    setPendingAction(actionLabel);

    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = await response.json();

      if (!response.ok || !payload.url) {
        showToast("error", payload.error ?? "Billing portal could not be opened.");
        return;
      }

      window.location.assign(payload.url);
    } catch {
      showToast("error", "Billing portal could not be opened.");
    } finally {
      setPendingAction(null);
    }
  }

  async function toggleAutoRecharge(enabled: boolean) {
    const actionLabel = enabled ? "Enable auto-recharge" : "Disable auto-recharge";
    setPendingAction(actionLabel);

    try {
      const response = await fetch("/api/billing/add-ons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addOnKey: "auto_recharge_credits", enabled })
      });
      const payload = await response.json();

      if (!response.ok) {
        showToast("error", payload.error ?? "Auto-recharge could not be updated.");
        return;
      }

      showToast("success", enabled ? "Auto-recharge is on." : "Auto-recharge is off.");
      router.refresh();
    } catch {
      showToast("error", "Auto-recharge could not be updated.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <ToastViewport toast={toast} onDismiss={dismissToast} />

      {searchParams.get("checkout") === "success" ? (
        <div className="flex flex-col gap-3 rounded-lg border border-harlo-teal/30 bg-harlo-mist p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-harlo-teal text-white">
              <BadgeCheck size={18} />
            </span>
            <div>
              <p className="font-semibold text-harlo-ink">Checkout completed</p>
              <p className="mt-1 text-sm leading-6 text-harlo-muted">Stripe is syncing the subscription. This page will reflect the new plan after the webhook finishes.</p>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={() => openBillingPortal()} disabled={pendingAction === "Manage billing"}>
            <CreditCard size={16} />
            {pendingAction === "Manage billing" ? "Opening..." : "Manage billing"}
          </Button>
        </div>
      ) : null}

      <style jsx global>{`
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

      <div className="flex flex-col gap-4 rounded-lg border border-harlo-line bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-harlo-ink">Billing interval</p>
          <p className="mt-1 text-sm text-harlo-muted">Annual pricing shows the effective monthly rate.</p>
        </div>
        <div className="grid grid-cols-2 rounded-lg border border-harlo-line bg-harlo-canvas p-1">
          {(["monthly", "annual"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => changeInterval(option)}
              className={`rounded-md px-4 py-2 text-sm font-semibold capitalize transition ${
                interval === option ? "bg-white text-harlo-ink shadow-sm" : "text-harlo-muted hover:text-harlo-ink"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <section id="plans" className="grid gap-4 lg:grid-cols-3">
        {BILLING_PLANS.map((plan, index) => {
          const isCurrent = plan.key === billing.planKey;
          const isCurrentInterval = isCurrent && interval === billing.interval;
          const isUpgrade = index > currentPlanIndex;
          const price = interval === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;
          const previousPrice = interval === "annual" ? plan.monthlyPrice : plan.annualMonthlyPrice;
          const annualTotal = plan.annualMonthlyPrice * 12;
          const actionLabel = isCurrent ? "Switch interval" : isUpgrade ? `Upgrade to ${plan.name}` : `Downgrade to ${plan.name}`;
          const planIcon = planIcons[plan.key];

          return (
            <div key={plan.key} className={`rounded-lg border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-harlo-teal/50 hover:shadow-md ${isCurrent ? "border-harlo-teal" : "border-harlo-line"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center bg-gradient-to-br ${planIcon.gradient} ${planIcon.shape}`}>
                    <span className={`block h-3.5 w-3.5 ${planIcon.inner}`} />
                  </span>
                  <p className="text-lg font-semibold text-harlo-ink">{plan.name}</p>
                </div>
                {isCurrent ? <Badge>Current</Badge> : null}
              </div>
              <div className="mt-4 flex min-h-11 flex-wrap items-center gap-1.5">
                <div className="flex w-[82px] shrink-0 items-end leading-none">
                  <span className="text-3xl font-semibold text-harlo-ink">$</span>
                  <span className="relative inline-block h-9 min-w-16 overflow-hidden tabular-nums">
                    <span key={`${plan.key}-${interval}-old-price`} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 text-3xl font-semibold text-harlo-muted opacity-0 [animation:harloPriceSlotGhost_920ms_cubic-bezier(0.2,0.8,0.2,1)_forwards]">
                      {previousPrice}
                    </span>
                    <span key={`${plan.key}-${interval}-price`} className="absolute inset-x-0 top-0 text-3xl font-semibold text-harlo-ink [animation:harloPriceSlot_920ms_cubic-bezier(0.2,0.8,0.2,1)_forwards]">
                      {price}
                    </span>
                  </span>
                </div>
                {interval === "annual" ? (
                  <span key={`${plan.key}-annual-badge`} className="rounded-full bg-gradient-to-r from-rose-500 to-red-300 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-red-100 [animation:harloBadgeSwap_240ms_ease-out_forwards]">
                    20% off
                  </span>
                ) : null}
              </div>
              <div className="mt-2 min-h-5 overflow-hidden">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-harlo-muted">
                  <span>per month</span>
                  {interval === "annual" ? <span key={`${plan.key}-annual-total`} className="text-harlo-teal [animation:harloPriceSwap_320ms_ease-out]">{formatPrice(annualTotal)} billed annually</span> : null}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-harlo-muted">{plan.description}</p>
              <div className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm font-semibold text-harlo-muted">
                    <CheckCircle2 size={16} className="text-harlo-teal" />
                    {feature}
                  </div>
                ))}
              </div>
              <Button type="button" variant={isCurrent ? "secondary" : isUpgrade ? "primary" : "secondary"} disabled={isCurrentInterval || pendingAction === actionLabel} className={`mt-6 w-full ${(isCurrentInterval || pendingAction === actionLabel) ? "cursor-default opacity-70" : ""}`} onClick={() => startCheckout(plan.key, actionLabel)}>
                {pendingAction === actionLabel ? "Starting..." : isCurrentInterval ? "Current plan" : isCurrent ? "Switch interval" : isUpgrade ? "Upgrade" : "Downgrade"}
              </Button>
            </div>
          );
        })}
      </section>

      <section className="rounded-lg border border-harlo-line bg-white shadow-sm">
        <div className="border-b border-harlo-line p-5">
          <h2 className="text-lg font-semibold text-harlo-ink">Add-ons</h2>
          <p className="mt-1 text-sm text-harlo-muted">Simple upgrades for capacity, teammates, and branding.</p>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
          {BILLING_ADD_ONS.map((addOn) => {
            const activeAddOn = billing.addOns.find((item) => item.key === addOn.key);
            const Icon = addOnIcons[addOn.key];

            return (
              <div key={addOn.key} className="group flex min-h-64 flex-col rounded-lg border border-harlo-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-harlo-teal/50 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${addOnGradients[addOn.key]}`}>
                    <Icon size={18} />
                  </span>
                  {activeAddOn?.enabled ? <Badge>Active</Badge> : null}
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-harlo-muted">{addOnLabels[addOn.key]}</p>
                  <h3 className="mt-2 text-base font-semibold text-harlo-ink">{addOn.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-harlo-muted">{addOn.description}</p>
                </div>
                <div className="mt-auto pt-5">
                  <p className="text-sm font-semibold text-harlo-ink">{formatPrice(addOn.price)}</p>
                  <p className="mt-1 text-xs font-medium text-harlo-muted">{addOn.unit}</p>
                  {addOn.key === "auto_recharge_credits" ? (
                    <Button
                      type="button"
                      variant={activeAddOn?.enabled ? "secondary" : "primary"}
                      className="mt-4 w-full group-hover:border-harlo-teal group-hover:text-harlo-teal"
                      onClick={() => toggleAutoRecharge(!(activeAddOn?.enabled ?? false))}
                      disabled={pendingAction === "Enable auto-recharge" || pendingAction === "Disable auto-recharge"}
                    >
                      {pendingAction === "Enable auto-recharge" || pendingAction === "Disable auto-recharge"
                        ? "Saving..."
                        : activeAddOn?.enabled
                          ? "Turn off"
                          : "Turn on"}
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" className="mt-4 w-full group-hover:border-harlo-teal group-hover:text-harlo-teal" onClick={() => openBillingPortal("Manage billing")}>
                      {activeAddOn?.enabled ? "Manage" : addOnCtas[addOn.key]}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function formatDate(value: Date) {
  return value.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}
