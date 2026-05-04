import Link from "next/link";
import { Zap } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { getBillingOverview, getInitials, getWorkspaceOrRedirect } from "@/lib/harlo/data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const workspace = await getWorkspaceOrRedirect();
  const billingOverview = await getBillingOverview(workspace);
  const initials = getInitials(workspace.user.email);

  return (
    <div className="min-h-screen bg-harlo-canvas">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-harlo-line bg-white p-5 lg:flex lg:flex-col">
        <div>
          <BrandLogo />
          <SidebarNav />
        </div>
        <div className="mt-auto space-y-3">
          <CreditUsageIndicator
            used={billingOverview.creditsUsed}
            limit={billingOverview.creditLimit}
            title={billingOverview.status === "trialing" ? "Trial credits" : "Credits"}
          />
          <button className="flex w-full items-center gap-3 rounded-lg border border-harlo-line bg-harlo-canvas p-3 text-left text-sm font-semibold text-harlo-ink transition hover:border-harlo-teal">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-harlo-ink text-xs text-white">{initials}</span>
            <span className="min-w-0">
              <span className="block truncate">{workspace.user.email ?? "Account"}</span>
              <span className="block text-xs font-medium text-harlo-muted">{workspace.role}</span>
            </span>
          </button>
        </div>
      </aside>
      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-harlo-line bg-harlo-canvas/90 px-6 backdrop-blur">
          <div className="flex min-w-0 items-center gap-4">
            <BusinessNamePill name={workspace.organization.name} />
          </div>
          <div className="flex items-center gap-3">
            {billingOverview.hasHigherTier ? (
              <Link
                href="/dashboard/billing#plans"
                className="hidden h-10 items-center justify-center rounded-lg bg-harlo-ink px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-harlo-navy sm:inline-flex"
              >
                Upgrade
              </Link>
            ) : null}
            <Link
              href="/dashboard/billing"
              className="hidden h-10 items-center justify-center rounded-lg border border-harlo-line bg-white px-4 text-sm font-semibold text-harlo-ink shadow-sm transition hover:border-harlo-teal hover:text-harlo-teal sm:inline-flex"
            >
              Billing
            </Link>
            <button className="flex h-9 items-center gap-2 rounded-lg border border-harlo-line bg-white px-2.5 text-sm font-semibold text-harlo-ink shadow-sm lg:hidden">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-harlo-ink text-xs text-white">{initials}</span>
              <span className="hidden max-w-32 truncate md:inline">{workspace.user.email ?? "Account"}</span>
            </button>
          </div>
        </header>
        <main className="min-w-0 overflow-x-hidden p-6">{children}</main>
      </div>
    </div>
  );
}

function CreditUsageIndicator({ used, limit, title }: { used: number; limit: number; title: string }) {
  const formatter = new Intl.NumberFormat("en");
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <div className="rounded-lg border border-harlo-line bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
          <Zap size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-harlo-muted">{title}</p>
            <p className="text-xs font-semibold text-harlo-teal">{percent}%</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-harlo-line">
            <div className="h-full rounded-full bg-harlo-teal" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-harlo-muted">
            {formatter.format(used)} / {formatter.format(limit)} used
          </p>
        </div>
      </div>
    </div>
  );
}

function BusinessNamePill({ name }: { name: string }) {
  return (
    <div className="hidden h-10 items-center gap-2 rounded-lg border border-harlo-line bg-white px-3 text-sm font-semibold text-harlo-ink shadow-sm sm:flex">
      <span className="h-2 w-2 rounded-full bg-harlo-teal" />
      {name}
    </div>
  );
}
