import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getCurrentBillingPlan, getMonthlyCreditUsage, getWorkspaceOrRedirect } from "@/lib/harlo/data";

const plans = [
  { name: "Starter", price: "$39", credits: "1,000 credits", description: "For owner-led sites getting started." },
  { name: "Growth", price: "$89", credits: "5,000 credits", description: "For growing teams with more conversations." },
  { name: "Pro", price: "$249", credits: "20,000 credits", description: "For higher-volume support and lead capture." }
];

export default async function BillingPage() {
  const workspace = await getWorkspaceOrRedirect();
  const usage = await getMonthlyCreditUsage(workspace);
  const currentPlan = getCurrentBillingPlan(workspace);
  const percent = usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
  const formatter = new Intl.NumberFormat("en");

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
                <p className="text-3xl font-semibold text-harlo-ink">{currentPlan.name}</p>
                <p className="mt-2 text-sm text-harlo-muted">{usage.label} credit usage</p>
              </div>
              <div className="rounded-lg border border-harlo-line bg-harlo-canvas px-4 py-3 text-sm font-semibold text-harlo-ink">
                {formatter.format(usage.used)} / {formatter.format(usage.limit)} used
              </div>
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-harlo-line">
              <div className="h-full rounded-full bg-harlo-teal" style={{ width: `${percent}%` }} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-harlo-ink">Subscription</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm leading-6 text-harlo-muted">
              Stripe checkout and customer portal will connect here when billing is implemented.
            </p>
          </CardBody>
        </Card>
      </section>

      <section id="plans" className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.name === currentPlan.name;

          return (
            <Card key={plan.name} className={isCurrent ? "border-harlo-teal" : ""}>
              <CardBody>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-harlo-ink">{plan.name}</p>
                  {isCurrent ? <Badge>Current</Badge> : null}
                </div>
                <p className="mt-4 text-3xl font-semibold text-harlo-ink">{plan.price}</p>
                <p className="mt-2 text-sm font-medium text-harlo-teal">{plan.credits}</p>
                <p className="mt-3 text-sm leading-6 text-harlo-muted">{plan.description}</p>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-harlo-muted">
                  <CheckCircle2 size={16} className="text-harlo-teal" />
                  Monthly billing
                </div>
              </CardBody>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
