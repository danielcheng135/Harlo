import type { Metadata } from "next";
import Link from "next/link";
import { Zap } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ProfileMenu } from "@/components/dashboard/profile-menu";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { getBillingOverview, getInitials, getWorkspaceOrRedirect, isWorkspaceAdmin } from "@/lib/harlo/data";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const workspace = await getWorkspaceOrRedirect();
  const billingOverview = await getBillingOverview(workspace);
  const initials = getInitials(workspace.user.email);
  const canManageBilling = isWorkspaceAdmin(workspace.role);

  return (
    <div className="min-h-screen bg-harlo-canvas">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-harlo-line bg-white p-5 lg:flex lg:flex-col">
        <div>
          <BrandLogo />
          <SidebarNav role={workspace.role} />
        </div>
        <div className="mt-auto space-y-3">
          <CreditUsageIndicator
            used={billingOverview.creditsUsed}
            limit={billingOverview.creditLimit}
            title={billingOverview.status === "trialing" ? "Trial credits" : "Credits"}
          />
          <ProfileMenu
            brandLogoUrl={workspace.organization.brand_logo_url ?? null}
            businessName={workspace.organization.name}
            canManageBilling={canManageBilling}
            email={workspace.user.email}
            hasHigherTier={billingOverview.hasHigherTier}
            initials={initials}
            role={workspace.role}
          />
        </div>
      </aside>
      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-harlo-line bg-harlo-canvas/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <BrandLogo />
            <ProfileMenu
              brandLogoUrl={workspace.organization.brand_logo_url ?? null}
              businessName={workspace.organization.name}
              canManageBilling={canManageBilling}
              email={workspace.user.email}
              hasHigherTier={billingOverview.hasHigherTier}
              initials={initials}
              role={workspace.role}
              variant="mobile"
            />
          </div>
          <div className="mt-3">
            <SidebarNav role={workspace.role} variant="mobile" />
          </div>
        </header>
        <main className="min-w-0 overflow-x-clip px-4 py-5 sm:p-6">
          <AutoRechargeFailureBanner failure={billingOverview.autoRechargeFailure} />
          <CreditUsageBanner canManageBilling={canManageBilling} status={billingOverview.status} used={billingOverview.creditsUsed} limit={billingOverview.creditLimit} />
          {children}
        </main>
      </div>
    </div>
  );
}

function AutoRechargeFailureBanner({ failure }: { failure: { reason: string; failedAt: string } | null }) {
  if (!failure) {
    return null;
  }

  return (
    <div className="mb-5 overflow-hidden rounded-lg border border-harlo-teal/25 bg-gradient-to-r from-harlo-mist via-white to-cyan-50 p-[1px] shadow-sm shadow-harlo-teal/10">
      <div className="rounded-[calc(0.5rem-1px)] bg-white/80 px-4 py-3 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-harlo-teal to-cyan-500 text-white shadow-sm shadow-harlo-teal/20">
              <Zap size={16} />
            </span>
            <div>
              <p className="font-semibold text-harlo-ink">Auto-recharge needs attention</p>
              <p className="mt-1 text-sm leading-6 text-harlo-muted">
                Harlo could not add credits because {formatAutoRechargeFailureReason(failure.reason)}. Update billing to resume automatic recharges.
              </p>
            </div>
          </div>
          <Link href="/dashboard/billing" className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-harlo-ink px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gradient-to-r hover:from-harlo-teal hover:to-cyan-500 hover:shadow-harlo-teal/20">
            Open billing
          </Link>
        </div>
      </div>
    </div>
  );
}

function CreditUsageBanner({ canManageBilling, status, used, limit }: { canManageBilling: boolean; status: string; used: number; limit: number }) {
  const formatter = new Intl.NumberFormat("en");
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  if (percent < 80) {
    return null;
  }

  const isOverLimit = percent >= 100;

  if (isOverLimit) {
    const trialing = status === "trialing";
    const href = canManageBilling ? "/dashboard/billing#start-paid" : "/dashboard/billing";
    const cta = canManageBilling && trialing ? "Start paid now" : "Open billing";

    return (
      <div className="mb-5 overflow-hidden rounded-lg border border-harlo-teal/25 bg-gradient-to-r from-harlo-mist via-white to-cyan-50 p-[1px] shadow-sm shadow-harlo-teal/10">
        <div className="rounded-[calc(0.5rem-1px)] bg-white/80 px-4 py-3 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-harlo-teal to-cyan-500 text-white shadow-sm shadow-harlo-teal/20">
                <Zap size={16} />
              </span>
              <div>
                <p className="font-semibold text-harlo-ink">Message credits are used up</p>
                <p className="mt-1 text-sm leading-6 text-harlo-muted">
                  {formatter.format(used)} of {formatter.format(limit)} credits used. {trialing ? "Start your paid Starter subscription to unlock monthly credits and resume the website chatbot." : "The website chatbot is paused until credits renew, auto-recharge succeeds, or the plan is updated."}
                </p>
              </div>
            </div>
            <Link href={href} className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-harlo-ink px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gradient-to-r hover:from-harlo-teal hover:to-cyan-500 hover:shadow-harlo-teal/20">
              {cta}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Message credits are running low</p>
          <p className="mt-1 text-sm opacity-80">
            {formatter.format(used)} of {formatter.format(limit)} credits used. Upgrade or enable add-on credits before the chatbot pauses.
          </p>
        </div>
        <Link href="/dashboard/billing" className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-harlo-ink px-3 text-sm font-semibold text-white transition hover:bg-harlo-navy">
          Open billing
        </Link>
      </div>
    </div>
  );
}

function CreditUsageIndicator({ used, limit, title }: { used: number; limit: number; title: string }) {
  const formatter = new Intl.NumberFormat("en");
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isOverLimit = percent >= 100;
  const isLow = percent >= 80;
  const accentClass = isOverLimit ? "text-harlo-teal" : isLow ? "text-amber-600" : "text-harlo-teal";
  const barClass = isOverLimit ? "bg-gradient-to-r from-harlo-teal to-cyan-500" : isLow ? "bg-amber-500" : "bg-harlo-teal";
  const cardClass = isOverLimit
    ? "rounded-lg border border-harlo-teal/25 bg-gradient-to-br from-harlo-mist via-white to-cyan-50 p-3 shadow-sm shadow-harlo-teal/10"
    : isLow
      ? "rounded-lg border border-amber-200 bg-amber-50 p-3 shadow-sm"
      : "rounded-lg border border-harlo-line bg-white p-3 shadow-sm";
  const iconClass = isOverLimit
    ? "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-harlo-teal to-cyan-500 text-white shadow-sm shadow-harlo-teal/20"
    : "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-harlo-mist text-harlo-teal";

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-3">
        <span className={iconClass}>
          <Zap size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-harlo-muted">{title}</p>
            <p className={`text-xs font-semibold ${accentClass}`}>{percent}%</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-harlo-line">
            <div className={`h-full rounded-full ${barClass}`} style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-harlo-muted">
            {formatter.format(used)} / {formatter.format(limit)} used
          </p>
        </div>
      </div>
    </div>
  );
}

function formatAutoRechargeFailureReason(reason: string) {
  if (reason === "missing_payment_method") {
    return "there is no saved payment method";
  }

  if (reason === "payment_failed") {
    return "the payment failed";
  }

  if (reason === "missing_stripe_customer") {
    return "this workspace is not linked to a Stripe customer";
  }

  if (reason === "stripe_not_configured") {
    return "payments are not configured";
  }

  if (reason.startsWith("payment_")) {
    return reason.replace("payment_", "the payment status is ").replaceAll("_", " ");
  }

  return "the recharge could not be completed";
}
