"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Bot, CheckCircle2, CreditCard, Loader2, Minus, Plus, Settings2, Sparkles, UserPlus, X, Zap } from "lucide-react";
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
import { trackInitiateCheckout } from "@/lib/meta-pixel";

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
  auto_recharge_credits: "Enable",
  extra_agent: "Add agent",
  extra_seat: "Add seat",
  remove_branding: "Remove"
};

const addOnGradients: Record<AddOnKey, string> = {
  auto_recharge_credits: "from-sky-100 to-cyan-50 text-sky-700",
  extra_agent: "from-emerald-100 to-teal-50 text-emerald-700",
  extra_seat: "from-violet-100 to-sky-50 text-violet-700",
  remove_branding: "from-rose-100 to-amber-50 text-rose-700"
};

function isQuantityAddOnKey(addOnKey: AddOnKey): addOnKey is "extra_agent" | "extra_seat" {
  return addOnKey === "extra_agent" || addOnKey === "extra_seat";
}

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

  async function startPaidNow(actionLabel = "Start paid now") {
    setPendingAction(actionLabel);

    try {
      const response = await fetch("/api/billing/start-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventSourceUrl: window.location.href })
      });
      const payload = await response.json();

      if (!response.ok) {
        showToast("error", payload.error ?? "Payment could not be collected.");
        return;
      }

      if (payload.url) {
        trackInitiateCheckout({
          content_name: actionLabel
        });
        window.location.assign(payload.url);
        return;
      }

      showToast("success", "Your paid Starter subscription is active.");
      window.location.reload();
    } catch {
      showToast("error", "Payment could not be collected.");
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

  return (
    <section id="start-paid" className="rounded-lg border border-harlo-line bg-white shadow-sm">
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
            <Badge>{billing.cancelAtPeriodEnd ? "Canceling" : formatBillingStatus(billing.status)}</Badge>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-harlo-muted">Renewal</span>
            <span className="text-right text-sm font-semibold text-harlo-ink">{formatDate(periodEnd)}</span>
          </div>
        </div>
        {billing.status === "trialing" ? (
          <Button type="button" variant="primary" className="mt-4 w-full" onClick={() => startPaidNow()} disabled={pendingAction === "Start paid now"}>
            {pendingAction === "Start paid now" ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            {pendingAction === "Start paid now" ? "Opening Stripe..." : "Start paid now"}
          </Button>
        ) : (
          <Button type="button" variant="primary" className="mt-4 w-full" onClick={() => openBillingPortal()} disabled={pendingAction === "Manage billing"}>
            {pendingAction === "Manage billing" ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            {pendingAction === "Manage billing" ? "Opening..." : "Manage billing"}
          </Button>
        )}
      </div>
    </section>
  );
}

export function BillingWorkspace({ billing }: BillingWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutNoticeShown = useRef<string | null>(null);
  const checkoutSyncStarted = useRef<string | null>(null);
  const [interval, setInterval] = useState<BillingInterval>(billing.interval);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [checkoutSyncing, setCheckoutSyncing] = useState(false);
  const [configuredAddOnKey, setConfiguredAddOnKey] = useState<AddOnKey | null>(null);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<"extra_agent" | "extra_seat", number>>({
    extra_agent: billing.addOns.find((item) => item.key === "extra_agent")?.quantity ?? 0,
    extra_seat: billing.addOns.find((item) => item.key === "extra_seat")?.quantity ?? 0
  });
  const { toast, showToast, dismissToast } = useToast();
  const currentPlanIndex = BILLING_PLANS.findIndex((plan) => plan.key === billing.planKey);
  const addOnsLocked = billing.isInternal || billing.status !== "active";

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    const addOnKey = searchParams.get("add_on");
    const checkoutKey = `${checkout}:${addOnKey ?? ""}:${sessionId ?? ""}`;

    if (!checkout || checkoutNoticeShown.current === checkoutKey) {
      return;
    }

    checkoutNoticeShown.current = checkoutKey;

    if (checkout === "success") {
      showToast("success", addOnKey ? "Checkout completed. Syncing your add-on now." : "Checkout completed. Your subscription is syncing with Stripe.");
    }

    if (checkout === "canceled") {
      showToast("error", "Checkout was canceled. No billing changes were made.");
    }
    if (checkout !== "success" || !sessionId || !addOnKey || checkoutSyncStarted.current === sessionId) {
      return;
    }

    checkoutSyncStarted.current = sessionId;
    setCheckoutSyncing(true);

    fetch("/api/billing/checkout-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error ?? "Checkout could not be synced.");
        }

        showToast("success", "Your add-on is active.");
        router.refresh();
      })
      .catch((error) => {
        showToast("error", error instanceof Error ? error.message : "Checkout could not be synced.");
      })
      .finally(() => setCheckoutSyncing(false));
  }, [router, searchParams, showToast]);

  useEffect(() => {
    setQuantityDrafts({
      extra_agent: billing.addOns.find((item) => item.key === "extra_agent")?.quantity ?? 0,
      extra_seat: billing.addOns.find((item) => item.key === "extra_seat")?.quantity ?? 0
    });
  }, [billing.addOns]);

  function changeInterval(nextInterval: BillingInterval) {
    setInterval(nextInterval);
  }

  async function startCheckout(planKey: string, actionLabel: string) {
    setPendingAction(actionLabel);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, interval, eventSourceUrl: window.location.href })
      });
      const payload = await response.json();

      if (!response.ok || !payload.url) {
        showToast("error", payload.error ?? "Checkout could not be started.");
        return;
      }

      trackInitiateCheckout({
        content_name: actionLabel
      });
      window.location.assign(payload.url);
    } catch {
      showToast("error", "Checkout could not be started.");
    } finally {
      setPendingAction(null);
    }
  }

  async function startPaidNow(actionLabel = "Start paid now") {
    setPendingAction(actionLabel);

    try {
      const response = await fetch("/api/billing/start-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventSourceUrl: window.location.href })
      });
      const payload = await response.json();

      if (!response.ok) {
        showToast("error", payload.error ?? "Payment could not be collected.");
        return;
      }

      if (payload.url) {
        trackInitiateCheckout({
          content_name: actionLabel
        });
        window.location.assign(payload.url);
        return;
      }

      showToast("success", "Your paid Starter subscription is active.");
      router.refresh();
    } catch {
      showToast("error", "Payment could not be collected.");
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

  async function updateAddOn({
    addOnKey,
    enabled,
    quantity,
    actionLabel,
    successMessage
  }: {
    addOnKey: AddOnKey;
    enabled?: boolean;
    quantity?: number;
    actionLabel: string;
    successMessage: string;
  }) {
    setPendingAction(actionLabel);

    try {
      const response = await fetch("/api/billing/add-ons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addOnKey, enabled, quantity, eventSourceUrl: window.location.href })
      });
      const payload = await response.json();

      if (!response.ok) {
        showToast("error", payload.error ?? "Add-on could not be updated.");
        return;
      }

      if (payload.url) {
        trackInitiateCheckout({
          content_name: actionLabel
        });
        window.location.assign(payload.url);
        return;
      }

      showToast("success", successMessage);
      router.refresh();
    } catch {
      showToast("error", "Add-on could not be updated.");
    } finally {
      setPendingAction(null);
    }
  }

  function toggleAddOn(addOnKey: AddOnKey, enabled: boolean) {
    const label = `${enabled ? "Enable" : "Disable"} ${addOnKey}`;

    updateAddOn({
      addOnKey,
      enabled,
      actionLabel: label,
      successMessage: enabled ? "Add-on is on." : "Add-on is off."
    });
  }

  function setQuantityAddOn(addOnKey: AddOnKey, quantity: number) {
    const nextQuantity = Math.max(0, quantity);

    updateAddOn({
      addOnKey,
      quantity: nextQuantity,
      actionLabel: `Update ${addOnKey}`,
      successMessage: nextQuantity > 0 ? "Add-on quantity updated." : "Add-on removed."
    });
  }

  function setQuantityDraft(addOnKey: "extra_agent" | "extra_seat", quantity: number) {
    setQuantityDrafts((current) => ({
      ...current,
      [addOnKey]: Math.max(0, quantity)
    }));
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
              <p className="mt-1 text-sm leading-6 text-harlo-muted">
                {checkoutSyncing
                  ? "Verifying the Stripe checkout and activating your add-on."
                  : `Stripe is syncing the ${searchParams.get("add_on") ? "add-on" : "subscription"}. This page will update after the webhook finishes.`}
              </p>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={() => openBillingPortal()} disabled={pendingAction === "Manage billing"}>
            {pendingAction === "Manage billing" ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
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
        <div className="grid w-full shrink-0 grid-cols-2 rounded-full border border-harlo-line bg-white/95 p-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:w-auto sm:min-w-max">
          {(["monthly", "annual"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={interval === option}
              onClick={() => changeInterval(option)}
              className={`inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold capitalize transition sm:min-w-28 ${
                interval === option
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
      </div>

      <section id="plans" className="grid gap-4 lg:grid-cols-3">
        {BILLING_PLANS.map((plan, index) => {
          const isCurrent = plan.key === billing.planKey;
          const isCurrentInterval = isCurrent && interval === billing.interval;
          const isUpgrade = index > currentPlanIndex;
          const price = interval === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;
          const previousPrice = interval === "annual" ? plan.monthlyPrice : plan.annualMonthlyPrice;
          const annualTotal = plan.annualMonthlyPrice * 12;
          const canStartPaidNow = isCurrent && billing.status === "trialing";
          const actionLabel = canStartPaidNow ? "Start paid now" : isCurrent ? "Switch interval" : isUpgrade ? `Upgrade to ${plan.name}` : `Downgrade to ${plan.name}`;
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
              <Button
                type="button"
                variant={canStartPaidNow || isUpgrade ? "primary" : "secondary"}
                disabled={(!canStartPaidNow && isCurrentInterval) || pendingAction === actionLabel}
                className={`mt-5 w-full ${((!canStartPaidNow && isCurrentInterval) || pendingAction === actionLabel) ? "cursor-default opacity-70" : ""}`}
                onClick={() => canStartPaidNow ? startPaidNow(actionLabel) : startCheckout(plan.key, actionLabel)}
              >
                {pendingAction === actionLabel ? <Loader2 size={16} className="animate-spin" /> : null}
                {pendingAction === actionLabel ? "Opening Stripe..." : canStartPaidNow ? "Start paid now" : isCurrentInterval ? "Current plan" : isCurrent ? "Switch interval" : isUpgrade ? "Upgrade" : "Downgrade"}
              </Button>
              <div className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm font-semibold text-harlo-muted">
                    <CheckCircle2 size={16} className="text-harlo-teal" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-lg border border-harlo-line bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-harlo-line p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-harlo-ink">Add-ons</h2>
            <p className="mt-1 text-sm text-harlo-muted">
              {billing.isInternal ? "This internal Harlo workspace already includes expanded capacity." : addOnsLocked ? "Available after your paid Starter subscription begins." : "Configure capacity here, then confirm paid add-ons in Stripe."}
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-harlo-line bg-harlo-canvas px-3 py-2 text-xs font-semibold text-harlo-muted">
            <CreditCard size={14} className="text-harlo-teal" />
            Stripe checkout
          </div>
        </div>
        <div className="space-y-3 p-5">
          {BILLING_ADD_ONS.map((addOn) => {
            const activeAddOn = billing.addOns.find((item) => item.key === addOn.key);
            const Icon = addOnIcons[addOn.key];
            const quantityAddOnKey = isQuantityAddOnKey(addOn.key) ? addOn.key : null;
            const opensConfigPanel = Boolean(quantityAddOnKey);
            const activeQuantity = activeAddOn?.quantity ?? 0;
            const draftQuantity = quantityAddOnKey ? quantityDrafts[quantityAddOnKey] : activeQuantity;
            const quantityChanged = draftQuantity !== activeQuantity;
            const hasPendingChange = quantityAddOnKey ? quantityChanged : true;
            const pendingQuantityUpdate = pendingAction === `Update ${addOn.key}`;
            const pendingToggle = pendingAction === `Enable ${addOn.key}` || pendingAction === `Disable ${addOn.key}`;
            const capacity = addOn.key === "extra_agent" ? billing.capacity.agents : addOn.key === "extra_seat" ? billing.capacity.seats : null;
            const addOnNoun = addOn.key === "extra_agent" ? "agent" : addOn.key === "extra_seat" ? "seat" : "add-on";
            const billingQuantity = quantityAddOnKey ? draftQuantity : 1;
            const monthlyTotal = billingQuantity * addOn.price;
            const configOpen = configuredAddOnKey === addOn.key;
            const portalActionLabel = `Manage ${addOn.key}`;
            const directActionUsesPortal = addOn.key === "remove_branding" && activeAddOn?.enabled;
            const directActionLabel = addOn.key === "auto_recharge_credits"
              ? activeAddOn?.enabled ? "Disable" : "Enable"
              : addOn.key === "remove_branding"
                ? activeAddOn?.enabled ? "Cancel" : "Remove"
                : activeAddOn?.enabled ? "Turn off" : addOnCtas[addOn.key];
            const DirectActionIcon = addOn.key === "auto_recharge_credits"
              ? activeAddOn?.enabled ? X : Zap
              : addOn.key === "remove_branding"
                ? activeAddOn?.enabled ? X : Sparkles
                : null;
            const pendingDirectPortal = pendingAction === portalActionLabel;
            const statusLabel = activeAddOn?.enabled
              ? quantityAddOnKey ? `${activeQuantity} active` : "Active"
              : addOnsLocked ? "Locked" : "Available";

            return (
              <article key={addOn.key} className={`relative rounded-lg border bg-white p-4 shadow-sm transition ${configOpen ? "border-harlo-teal shadow-md" : "border-harlo-line hover:border-harlo-teal/50"}`}>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_170px_132px] lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${addOnGradients[addOn.key]}`}>
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-harlo-muted">{addOnLabels[addOn.key]}</p>
                        <Badge>{statusLabel}</Badge>
                      </div>
                      <h3 className="mt-1 text-base font-semibold text-harlo-ink">{addOn.name}</h3>
                      <p className="mt-1 text-sm leading-6 text-harlo-muted">{addOn.description}</p>
                    </div>
                  </div>
                  <div className="h-12 rounded-lg border border-harlo-line bg-harlo-canvas px-3 py-2">
                    <p className="text-sm font-semibold leading-4 text-harlo-ink">{formatPrice(addOn.price)}</p>
                    <p className="mt-0.5 truncate text-xs font-medium text-harlo-muted">{addOn.unit}</p>
                  </div>
                  <div className="flex">
                    {opensConfigPanel ? (
                      <Button
                        type="button"
                        variant={configOpen ? "primary" : "secondary"}
                        onClick={() => setConfiguredAddOnKey(configOpen ? null : addOn.key)}
                        disabled={addOnsLocked || pendingQuantityUpdate}
                        className="w-full"
                      >
                        <Settings2 size={15} />
                        Configure
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant={activeAddOn?.enabled ? "secondary" : "primary"}
                        className={`w-full ${activeAddOn?.enabled ? "hover:!text-harlo-ink" : "hover:!text-white"}`}
                        onClick={() => directActionUsesPortal ? openBillingPortal(portalActionLabel) : toggleAddOn(addOn.key, !(activeAddOn?.enabled ?? false))}
                        disabled={(addOnsLocked && !(activeAddOn?.enabled ?? false)) || pendingToggle || pendingDirectPortal}
                      >
                        {pendingToggle || pendingDirectPortal ? <Loader2 size={15} className="animate-spin" /> : DirectActionIcon ? <DirectActionIcon size={15} /> : null}
                        {pendingToggle || pendingDirectPortal
                          ? addOn.key === "auto_recharge_credits" ? "Updating..." : "Opening Stripe..."
                          : directActionLabel}
                      </Button>
                    )}
                  </div>
                </div>

                {configOpen && opensConfigPanel ? (
                  <div className="mt-4 rounded-lg border border-harlo-line bg-gradient-to-br from-white to-harlo-canvas p-4 shadow-inner">
                    <div className="grid gap-3 xl:grid-cols-[minmax(180px,1fr)_minmax(180px,220px)_minmax(150px,190px)_minmax(150px,190px)] xl:items-center">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-harlo-ink">Configure {addOn.name.toLowerCase()}</p>
                          <p className="mt-1 text-sm leading-6 text-harlo-muted">
                            {quantityAddOnKey ? "Choose the quantity before continuing to Stripe." : "Review this add-on before continuing to Stripe."}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-harlo-muted transition hover:bg-white hover:text-harlo-ink xl:hidden"
                          onClick={() => setConfiguredAddOnKey(null)}
                          aria-label="Close add-on configuration"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {quantityAddOnKey ? (
                        <div>
                          <p className="mb-2 text-sm font-semibold text-harlo-ink">Quantity</p>
                          <div className="grid h-12 grid-cols-3 overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm">
                            <button
                              type="button"
                              className="grid place-items-center border-r border-harlo-line text-harlo-ink transition hover:bg-harlo-mist hover:text-harlo-teal disabled:cursor-not-allowed disabled:opacity-40"
                              onClick={() => setQuantityDraft(quantityAddOnKey, draftQuantity - 1)}
                              disabled={draftQuantity <= 0 || pendingQuantityUpdate}
                              aria-label={`Remove ${addOn.name}`}
                            >
                              <Minus size={16} />
                            </button>
                            <span className="grid place-items-center text-lg font-semibold tabular-nums text-harlo-ink">
                              {draftQuantity}
                            </span>
                            <button
                              type="button"
                              className="grid place-items-center border-l border-harlo-line text-harlo-ink transition hover:bg-harlo-mist hover:text-harlo-teal disabled:cursor-not-allowed disabled:opacity-40"
                              onClick={() => setQuantityDraft(quantityAddOnKey, draftQuantity + 1)}
                              disabled={addOnsLocked || pendingQuantityUpdate}
                              aria-label={`Add ${addOn.name}`}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <p className="mt-2 text-sm text-harlo-muted">{formatPrice(addOn.price)} {addOn.unit}</p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-harlo-muted">Status</p>
                          <p className="mt-2 text-lg font-semibold text-harlo-ink">{activeAddOn?.enabled ? "Active" : "Ready"}</p>
                          <p className="mt-1 text-xs font-medium text-harlo-muted">{activeAddOn?.enabled ? "Branding is hidden" : "Branding will be hidden"}</p>
                        </div>
                      )}

                      <div className="h-24 rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
                        <p className="text-sm font-semibold text-harlo-ink">Monthly total</p>
                        <p className="mt-3 flex items-end gap-2 text-harlo-teal">
                          <span className="text-2xl font-semibold leading-none">{formatPrice(monthlyTotal)}</span>
                          <span className="text-sm font-medium text-harlo-muted">per month</span>
                        </p>
                      </div>

                      <div className="h-24 rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
                        <p className="text-sm font-semibold text-harlo-ink">{quantityAddOnKey ? "Capacity after purchase" : "Widget branding"}</p>
                        <p className="mt-3 flex items-end gap-2 text-harlo-teal">
                          <span className="text-2xl font-semibold leading-none">{quantityAddOnKey && capacity ? `${capacity.used} / ${capacity.included + draftQuantity}` : "Off"}</span>
                          <span className="text-sm font-medium text-harlo-muted">{quantityAddOnKey ? `${addOnNoun}s` : "powered by text"}</span>
                        </p>
                      </div>

                      <div className="flex justify-end xl:col-span-4">
                        <Button
                          type="button"
                          variant={quantityAddOnKey && draftQuantity === 0 ? "secondary" : "primary"}
                          className={`w-full sm:w-56 ${quantityAddOnKey && draftQuantity === 0 ? "" : "bg-harlo-teal hover:bg-harlo-teal/90"}`}
                          onClick={() => quantityAddOnKey && draftQuantity === 0 && activeQuantity > 0 ? openBillingPortal(portalActionLabel) : quantityAddOnKey ? setQuantityAddOn(addOn.key, draftQuantity) : toggleAddOn(addOn.key, !(activeAddOn?.enabled ?? false))}
                          disabled={addOnsLocked || !hasPendingChange || pendingQuantityUpdate || pendingToggle || pendingDirectPortal}
                        >
                          {pendingQuantityUpdate || pendingToggle || pendingDirectPortal ? <Loader2 size={15} className="animate-spin" /> : null}
                          {pendingQuantityUpdate || pendingToggle || pendingDirectPortal
                            ? "Opening Stripe..."
                            : quantityAddOnKey
                              ? draftQuantity === 0 && activeQuantity > 0 ? "Cancel in Stripe" : activeQuantity > 0 ? "Continue in Stripe" : "Continue to Stripe"
                              : activeAddOn?.enabled ? "Turn off" : "Continue to Stripe"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>
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

function formatBillingStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
