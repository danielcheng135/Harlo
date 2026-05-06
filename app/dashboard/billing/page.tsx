import { BillingControls, BillingWorkspace } from "@/components/billing/billing-workspace";
import { TRIAL_CONFIG } from "@/lib/billing/plans";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getBillingOverview, getWorkspaceOrRedirect, requireWorkspaceAdmin } from "@/lib/harlo/data";

export default async function BillingPage() {
  const workspace = await getWorkspaceOrRedirect();
  requireWorkspaceAdmin(workspace);
  const billing = await getBillingOverview(workspace);
  const formatter = new Intl.NumberFormat("en");
  const periodEnd = new Date(billing.periodEnd);
  const planRemaining = Math.max(0, billing.planCreditLimit - billing.planCreditsUsed);
  const hasAddOnCredits = billing.addOnCreditsAvailable > 0 || billing.addOnCreditsUsed > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Badge>Billing</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">Billing</h1>
        <p className="mt-2 text-harlo-muted">Manage plan, monthly credits, and subscription settings.</p>
      </div>

      <section className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-harlo-ink">Current plan</h2>
                <p className="mt-1 text-sm text-harlo-muted">
                  {billing.status === "trialing" ? `${TRIAL_CONFIG.credits} trial credits` : `${billing.plan.monthlyCredits.toLocaleString()} monthly plan credits`} · Renews {formatDate(periodEnd)}
                </p>
              </div>
              <Badge>{formatBillingStatus(billing.status)}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-3xl font-semibold text-harlo-ink">{billing.plan.name}</p>
                <p className="mt-2 text-sm text-harlo-muted">
                  {formatter.format(billing.creditsUsed)} of {formatter.format(billing.creditLimit)} total available credits used this period.
                </p>
              </div>
              <div className="rounded-lg border border-harlo-line bg-harlo-canvas px-4 py-3 text-sm font-semibold text-harlo-ink">
                {formatter.format(Math.max(0, billing.creditLimit - billing.creditsUsed))} remaining
              </div>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-harlo-line">
              <div className="h-full rounded-full bg-harlo-teal" style={{ width: `${billing.percentUsed}%` }} />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <CreditStat
                label="Plan credits"
                value={`${formatter.format(billing.planCreditsUsed)} / ${formatter.format(billing.planCreditLimit)}`}
                detail={`${formatter.format(planRemaining)} resets on ${formatDate(periodEnd)}`}
              />
              <CreditStat
                label="Add-on credits used"
                value={formatter.format(billing.addOnCreditsUsed)}
                detail={hasAddOnCredits ? "Used after plan credits ran out" : "No add-on credits used yet"}
              />
              <CreditStat
                label="Add-on credits available"
                value={formatter.format(billing.addOnCreditsAvailable)}
                detail={billing.activeCreditGrants.length > 0 ? `${billing.activeCreditGrants.length} active recharge ${billing.activeCreditGrants.length === 1 ? "grant" : "grants"}` : "No active recharge grants"}
              />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <CapacityStat
                label="Agent capacity"
                value={`${billing.capacity.agents.used} / ${billing.capacity.agents.limit}`}
                detail={`${billing.capacity.agents.included} included${billing.capacity.agents.extra > 0 ? `, ${billing.capacity.agents.extra} add-on` : ""}`}
                percent={getCapacityPercent(billing.capacity.agents.used, billing.capacity.agents.limit)}
              />
              <CapacityStat
                label="Seat capacity"
                value={`${billing.capacity.seats.used} / ${billing.capacity.seats.limit}`}
                detail={`${billing.capacity.seats.included} included${billing.capacity.seats.extra > 0 ? `, ${billing.capacity.seats.extra} add-on` : ""}${billing.capacity.seats.pending > 0 ? `, ${billing.capacity.seats.pending} pending` : ""}`}
                percent={getCapacityPercent(billing.capacity.seats.used, billing.capacity.seats.limit)}
              />
            </div>

            {billing.activeCreditGrants.length > 0 ? (
              <div className="mt-5 rounded-lg border border-harlo-line bg-white">
                <div className="border-b border-harlo-line px-4 py-3">
                  <p className="text-sm font-semibold text-harlo-ink">Active recharge credits</p>
                  <p className="mt-1 text-xs text-harlo-muted">Each recharge expires one month from the day it was added.</p>
                </div>
                <div className="max-h-44 divide-y divide-harlo-line overflow-y-auto">
                  {billing.activeCreditGrants.map((grant) => (
                    <div key={grant.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-harlo-ink">{formatter.format(grant.creditsRemaining)} credits remaining</p>
                        <p className="mt-1 text-xs text-harlo-muted">
                          {formatter.format(grant.creditsUsed)} of {formatter.format(grant.creditsGranted)} used
                        </p>
                      </div>
                      <div className="text-left text-xs font-medium text-harlo-muted sm:text-right">
                        <p>Added {formatDate(new Date(grant.grantedAt))}</p>
                        <p>Expires {formatDate(new Date(grant.expiresAt))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <BillingControls billing={billing} />
      </section>

      <BillingWorkspace billing={billing} />
    </div>
  );
}

function CapacityStat({ label, value, detail, percent }: { label: string; value: string; detail: string; percent: number }) {
  return (
    <div className="rounded-lg border border-harlo-line bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-harlo-muted">{label}</p>
          <p className="mt-2 text-lg font-semibold text-harlo-ink">{value}</p>
        </div>
        <span className="rounded-full bg-harlo-mist px-2 py-1 text-xs font-semibold text-harlo-teal">{percent}%</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-harlo-line">
        <div className="h-full rounded-full bg-gradient-to-r from-harlo-teal to-cyan-500" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs leading-5 text-harlo-muted">{detail}</p>
    </div>
  );
}

function getCapacityPercent(used: number, limit: number) {
  return limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
}

function CreditStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-harlo-line bg-harlo-canvas p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-harlo-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-harlo-ink">{value}</p>
      <p className="mt-1 text-xs leading-5 text-harlo-muted">{detail}</p>
    </div>
  );
}

function formatBillingStatus(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replace("_", " ");
}

function formatDate(value: Date) {
  return value.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
