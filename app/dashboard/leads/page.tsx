import { Users } from "lucide-react";
import { AgentFilter } from "@/components/dashboard/agent-filter";
import { EmptyState } from "@/components/empty-state";
import { LeadsWorkspace } from "@/components/leads/leads-workspace";
import { Card, CardBody } from "@/components/ui/card";
import { getPaginatedLeads, getWorkspaceOrRedirect } from "@/lib/harlo/data";

type LeadsPageProps = {
  searchParams?: Promise<{
    agent?: string;
    lead?: string;
    page?: string;
  }>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const workspace = await getWorkspaceOrRedirect();
  const params = await searchParams;
  const activeAgentId = workspace.bots.some((bot) => bot.id === params?.agent) ? params?.agent : undefined;
  const requestedPage = parsePage(params?.page);
  const paginatedLeads = await getPaginatedLeads(workspace, { page: requestedPage, pageSize: 10, agentId: activeAgentId });
  const initialLeadId = paginatedLeads.items.some((lead) => lead.id === params?.lead) ? params?.lead : undefined;

  return (
    <div className="flex min-h-[calc(100svh-10rem)] flex-col gap-5 lg:h-[calc(100vh-7rem)] lg:overflow-hidden">
      <header className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-harlo-ink sm:text-3xl">Leads</h1>
          <p className="mt-2 text-harlo-muted">Manage and qualify leads captured by your agents.</p>
        </div>
        <AgentFilter
          basePath="/dashboard/leads"
          bots={workspace.bots}
          activeAgentId={activeAgentId}
          counts={paginatedLeads.agentCounts}
          allCount={Object.values(paginatedLeads.agentCounts).reduce((sum, count) => sum + count, 0)}
        />
      </header>

      {paginatedLeads.items.length === 0 ? (
        <Card className="flex min-h-0 flex-1">
          <CardBody className="flex min-h-0 flex-1">
            <EmptyState
              icon={Users}
              title={activeAgentId ? "No leads for this agent yet" : "No leads captured yet"}
              body={
                activeAgentId
                  ? "Visitors captured by this agent will appear here with their conversation context."
                  : "When Harlo cannot answer confidently, it will collect contact details and show them here."
              }
              className="min-h-full flex-1"
            />
          </CardBody>
        </Card>
      ) : (
        <LeadsWorkspace
          leads={paginatedLeads.items}
          initialLeadId={initialLeadId}
          activeAgentId={activeAgentId}
          page={paginatedLeads.page}
          pageSize={paginatedLeads.pageSize}
          totalCount={paginatedLeads.total}
        />
      )}
    </div>
  );
}

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
