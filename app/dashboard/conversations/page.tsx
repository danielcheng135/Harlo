import { MessageSquare } from "lucide-react";
import { ConversationHistory } from "@/components/conversations/conversation-history";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { getInboxConversations, getWorkspaceOrRedirect } from "@/lib/harlo/data";

type ConversationsPageProps = {
  searchParams?: Promise<{
    conversation?: string;
  }>;
};

export default async function ConversationsPage({ searchParams }: ConversationsPageProps) {
  const workspace = await getWorkspaceOrRedirect();
  const conversations = await getInboxConversations(workspace);
  const params = await searchParams;
  const selectedConversation =
    conversations.find((conversation) => conversation.id === params?.conversation) ?? conversations[0] ?? null;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-6 overflow-hidden">
      <div className="shrink-0">
        <Badge>Conversation history</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">Conversations</h1>
        <p className="mt-2 text-harlo-muted">Review what visitors ask and how Harlo responds.</p>
      </div>

      {conversations.length === 0 ? (
        <Card className="min-h-0 flex-1">
          <CardBody>
            <EmptyState
              icon={MessageSquare}
              title="No conversations yet"
              body="Visitor conversations will be saved here once the embeddable widget starts sending chat messages."
            />
          </CardBody>
        </Card>
      ) : (
        <ConversationHistory
          conversations={conversations}
          initialConversationId={selectedConversation?.id}
          botName={workspace.bot.name}
        />
      )}
    </div>
  );
}
