import { BillingControls, BillingWorkspace } from "@/components/billing/billing-workspace";
import { TRIAL_CONFIG } from "@/lib/billing/plans";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getBillingOverview, getWorkspaceOrRedirect } from "@/lib/harlo/data";

export default async function BillingPage() {
  const workspace = await getWorkspaceOrRedirect();
  const billing = await getBillingOverview(workspace);
  const formatter = new Intl.NumberFormat("en");
  const periodEnd = new Date(billing.periodEnd);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Badge>Billing</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">Billing</h1>
        <p className="mt-2 text-harlo-muted">Manage plan, monthly credits, and subscription settings.</p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-harlo-ink">Current plan</h2>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-3xl font-semibold text-harlo-ink">{billing.plan.name}</p>
                  <Badge>{formatBillingStatus(billing.status)}</Badge>
                </div>
                <p className="mt-2 text-sm text-harlo-muted">
                  {billing.status === "trialing" ? `${TRIAL_CONFIG.credits} trial credits` : `${billing.plan.monthlyCredits.toLocaleString()} monthly credits`} · Renews {formatDate(periodEnd)}
                </p>
              </div>
              <div className="rounded-lg border border-harlo-line bg-harlo-canvas px-4 py-3 text-sm font-semibold text-harlo-ink">
                {formatter.format(billing.creditsUsed)} / {formatter.format(billing.creditLimit)} used
              </div>
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-harlo-line">
              <div className="h-full rounded-full bg-harlo-teal" style={{ width: `${billing.percentUsed}%` }} />
            </div>
          </CardBody>
        </Card>

        <BillingControls billing={billing} />
      </section>

      <BillingWorkspace billing={billing} />
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
