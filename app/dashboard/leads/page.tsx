import { Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LeadsWorkspace } from "@/components/leads/leads-workspace";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { getLeads, getWorkspaceOrRedirect } from "@/lib/harlo/data";

export default async function LeadsPage() {
  const workspace = await getWorkspaceOrRedirect();
  const leads = await getLeads(workspace);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-6 overflow-hidden">
      <div className="shrink-0">
        <Badge>Lead capture</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">Leads</h1>
        <p className="mt-2 text-harlo-muted">Follow up when Harlo turns a visitor question into a business opportunity.</p>
      </div>

      {leads.length === 0 ? (
        <Card className="flex min-h-0 flex-1">
          <CardBody className="flex min-h-0 flex-1">
            <EmptyState
              icon={Users}
              title="No leads captured yet"
              body="When Harlo cannot answer confidently, it will collect contact details and show them here."
              className="min-h-full flex-1"
            />
          </CardBody>
        </Card>
      ) : (
        <LeadsWorkspace leads={leads} />
      )}
    </div>
  );
}
