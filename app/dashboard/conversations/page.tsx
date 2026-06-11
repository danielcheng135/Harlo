import { MessageSquare } from "lucide-react";
import { ConversationHistory } from "@/components/conversations/conversation-history";
import { AgentFilter } from "@/components/dashboard/agent-filter";
import { EmptyState } from "@/components/empty-state";
import { Card, CardBody } from "@/components/ui/card";
import { getPaginatedInboxConversations, getWorkspaceOrRedirect } from "@/lib/harlo/data";

type ConversationsPageProps = {
  searchParams?: Promise<{
    agent?: string;
    conversation?: string;
    page?: string;
  }>;
};

export default async function ConversationsPage({ searchParams }: ConversationsPageProps) {
  const workspace = await getWorkspaceOrRedirect();
  const params = await searchParams;
  const activeAgentId = workspace.bots.some((bot) => bot.id === params?.agent) ? params?.agent : undefined;
  const paginatedConversations = await getPaginatedInboxConversations(workspace, {
    page: parsePage(params?.page),
    pageSize: 10,
    agentId: activeAgentId
  });
  const visibleConversations = paginatedConversations.items;
  const selectedConversation =
    visibleConversations.find((conversation) => conversation.id === params?.conversation) ?? visibleConversations[0] ?? null;

  return (
    <div className="flex min-h-[calc(100svh-10rem)] flex-col gap-5 lg:h-[calc(100vh-7rem)] lg:overflow-hidden">
      <header className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-harlo-ink sm:text-3xl">Conversations</h1>
          <p className="mt-2 text-harlo-muted">View and respond to conversations with your agents.</p>
        </div>
        <AgentFilter
          basePath="/dashboard/conversations"
          bots={workspace.bots}
          activeAgentId={activeAgentId}
          counts={paginatedConversations.agentCounts}
          allCount={Object.values(paginatedConversations.agentCounts).reduce((sum, count) => sum + count, 0)}
        />
      </header>

      {visibleConversations.length === 0 ? (
        <Card className="flex min-h-0 flex-1">
          <CardBody className="flex min-h-0 flex-1">
            <EmptyState
              icon={MessageSquare}
              title={activeAgentId ? "No conversations for this agent yet" : "No conversations yet"}
              body={
                activeAgentId
                  ? "When this agent handles visitor chats, they will appear here with the full transcript."
                  : "Visitor conversations will be saved here once the embeddable widget starts sending chat messages."
              }
              className="min-h-full flex-1"
            />
          </CardBody>
        </Card>
      ) : (
        <ConversationHistory
          conversations={visibleConversations}
          initialConversationId={selectedConversation?.id}
          activeAgentId={activeAgentId}
          businessLogoUrl={workspace.organization.brand_logo_url}
          page={paginatedConversations.page}
          pageSize={paginatedConversations.pageSize}
          totalCount={paginatedConversations.total}
        />
      )}
    </div>
  );
}

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
