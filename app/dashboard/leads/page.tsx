import { Users } from "lucide-react";
import { AgentFilter } from "@/components/dashboard/agent-filter";
import { EmptyState } from "@/components/empty-state";
import { LeadsWorkspace } from "@/components/leads/leads-workspace";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { getLeads, getWorkspaceOrRedirect, type LeadRow } from "@/lib/harlo/data";

type LeadsPageProps = {
  searchParams?: Promise<{
    agent?: string;
  }>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const workspace = await getWorkspaceOrRedirect();
  const leads = await getLeads(workspace);
  const params = await searchParams;
  const activeAgentId = workspace.bots.some((bot) => bot.id === params?.agent) ? params?.agent : undefined;
  const visibleLeads = activeAgentId ? leads.filter((lead) => lead.bot_id === activeAgentId) : leads;
  const agentCounts = getAgentCounts(leads);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-6 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge>Lead capture</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">Leads</h1>
          <p className="mt-2 text-harlo-muted">Follow up when Harlo turns a visitor question into a business opportunity.</p>
        </div>
        <AgentFilter
          basePath="/dashboard/leads"
          bots={workspace.bots}
          activeAgentId={activeAgentId}
          counts={agentCounts}
          allCount={leads.length}
        />
      </div>

      {visibleLeads.length === 0 ? (
        <Card className="flex min-h-0 flex-1">
          <CardBody className="flex min-h-0 flex-1">
            <EmptyState
              icon={Users}
              title={activeAgentId ? "No leads for this agent yet" : "No leads captured yet"}
              body={
                activeAgentId
                  ? "Qualified visitors captured by this agent will appear here with their conversation context."
                  : "When Harlo cannot answer confidently, it will collect contact details and show them here."
              }
              className="min-h-full flex-1"
            />
          </CardBody>
        </Card>
      ) : (
        <LeadsWorkspace leads={visibleLeads} />
      )}
    </div>
  );
}

function getAgentCounts(leads: LeadRow[]) {
  return leads.reduce<Record<string, number>>((current, lead) => {
    if (lead.bot_id) {
      current[lead.bot_id] = (current[lead.bot_id] ?? 0) + 1;
    }

    return current;
  }, {});
}
