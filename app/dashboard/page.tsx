import { BookOpen, MessageSquare } from "lucide-react";
import { ChatWidgetPreview } from "@/components/chat-widget-preview";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  getChartBars,
  getConversations,
  getDashboardStats,
  getKnowledgeSources,
  getWorkspaceOrRedirect
} from "@/lib/harlo/data";

export default async function DashboardPage() {
  const workspace = await getWorkspaceOrRedirect();
  const [stats, conversations, sources] = await Promise.all([
    getDashboardStats(workspace),
    getConversations(workspace),
    getKnowledgeSources(workspace)
  ]);
  const conversationCount = Number(stats[0]?.value ?? 0);
  const chartBars = getChartBars(conversationCount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge>{workspace.bot.name}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">Overview</h1>
          <p className="mt-2 text-harlo-muted">Monitor chatbot performance, lead capture, and knowledge health.</p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-harlo-ink">Message volume</h2>
            <p className="text-sm text-harlo-muted">Last 12 days</p>
          </CardHeader>
          <CardBody>
            <div className="flex h-64 items-end gap-3">
              {chartBars.map((value, index) => (
                <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg bg-harlo-teal"
                    style={{ height: `${value === 0 ? 8 : Math.max(18, value * 12)}px`, opacity: value === 0 ? 0.15 : 0.45 + index / 28 }}
                  />
                  <span className="text-xs text-harlo-muted">{index + 1}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <ChatWidgetPreview />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-harlo-ink">Recent conversations</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {conversations.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No conversations yet"
                body="Once the widget starts receiving visitor questions, recent conversations will appear here."
              />
            ) : conversations.map((conversation) => (
              <div key={conversation.id} className="flex items-center justify-between gap-4 border-b border-harlo-line pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-harlo-ink">{conversation.page_url ?? "Website visitor"}</p>
                  <p className="mt-1 text-xs text-harlo-muted">{new Date(conversation.created_at).toLocaleString()}</p>
                </div>
                <Badge>{conversation.visitor_id ? "Known visitor" : "Anonymous"}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-harlo-ink">Knowledge sources</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {sources.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No knowledge sources"
                body="Add a website URL or upload a file so Harlo has business context to retrieve."
              />
            ) : sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between gap-4 border-b border-harlo-line pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-harlo-ink">{source.name}</p>
                  <p className="mt-1 text-xs text-harlo-muted">{source.source_type} · {new Date(source.created_at).toLocaleDateString()}</p>
                </div>
                <Badge className={source.status !== "ready" ? "bg-white text-harlo-muted" : ""}>{source.status}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
