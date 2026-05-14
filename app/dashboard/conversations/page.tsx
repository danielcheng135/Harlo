import { MessageSquare } from "lucide-react";
import { ConversationHistory } from "@/components/conversations/conversation-history";
import { AgentFilter } from "@/components/dashboard/agent-filter";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { getInboxConversations, getWorkspaceOrRedirect, type InboxConversationRow } from "@/lib/harlo/data";

type ConversationsPageProps = {
  searchParams?: Promise<{
    agent?: string;
    conversation?: string;
  }>;
};

export default async function ConversationsPage({ searchParams }: ConversationsPageProps) {
  const workspace = await getWorkspaceOrRedirect();
  const conversations = await getInboxConversations(workspace);
  const params = await searchParams;
  const activeAgentId = workspace.bots.some((bot) => bot.id === params?.agent) ? params?.agent : undefined;
  const visibleConversations = activeAgentId
    ? conversations.filter((conversation) => conversation.bot_id === activeAgentId)
    : conversations;
  const selectedConversation =
    visibleConversations.find((conversation) => conversation.id === params?.conversation) ?? visibleConversations[0] ?? null;
  const agentCounts = getAgentCounts(conversations);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-6 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge>Conversation history</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">Conversations</h1>
          <p className="mt-2 text-harlo-muted">Review what visitors ask and how Harlo responds.</p>
        </div>
        <AgentFilter
          basePath="/dashboard/conversations"
          bots={workspace.bots}
          activeAgentId={activeAgentId}
          counts={agentCounts}
          allCount={conversations.length}
        />
      </div>

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
        />
      )}
    </div>
  );
}

function getAgentCounts(conversations: InboxConversationRow[]) {
  return conversations.reduce<Record<string, number>>((current, conversation) => {
    if (conversation.bot_id) {
      current[conversation.bot_id] = (current[conversation.bot_id] ?? 0) + 1;
    }

    return current;
  }, {});
}
