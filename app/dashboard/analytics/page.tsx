import { AlertCircle, CheckCircle2, MessageSquare, Sparkles, Users } from "lucide-react";
import { MessageVolumeCard } from "@/components/analytics/message-volume-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getInboxConversations, getKnowledgeSources, getLeads, getWorkspaceOrRedirect } from "@/lib/harlo/data";

export default async function AnalyticsPage() {
  const workspace = await getWorkspaceOrRedirect();
  const [conversations, leads, sources] = await Promise.all([
    getInboxConversations(workspace),
    getLeads(workspace),
    getKnowledgeSources(workspace)
  ]);
  const messages = conversations.flatMap((conversation) => conversation.messages);
  const visitorMessages = messages.filter((message) => message.role === "user");
  const assistantMessages = messages.filter((message) => message.role === "assistant");
  const answeredCount = conversations.filter((conversation) => conversation.outcome === "Answered").length;
  const needsReviewCount = conversations.filter((conversation) => conversation.outcome === "Needs review").length;
  const leadConversationCount = conversations.filter((conversation) => conversation.outcome === "Lead captured").length;
  const resolutionRate = conversations.length > 0 ? Math.round((answeredCount / conversations.length) * 100) : 0;
  const leadRate = conversations.length > 0 ? Math.round((leadConversationCount / conversations.length) * 100) : 0;
  const readySources = sources.filter((source) => source.status === "ready").length;
  const knowledgeHealth = sources.length > 0 ? Math.round((readySources / sources.length) * 100) : 0;
  const dailyVolume = getDailyVolume(messages);
  const knowledgeGaps = getKnowledgeGaps(conversations);
  const sourceUsage = getSourceUsage(assistantMessages);

  return (
    <div className="space-y-6">
      <div>
        <Badge>Analytics</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">Performance</h1>
        <p className="mt-2 text-harlo-muted">Track volume, resolution, leads, and knowledge gaps.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Conversations" value={conversations.length.toString()} detail={`${visitorMessages.length} visitor messages`} icon={<MessageSquare size={18} />} />
        <Metric label="Resolution rate" value={`${resolutionRate}%`} detail={`${answeredCount} answered by AI`} icon={<Sparkles size={18} />} />
        <Metric label="Lead conversion" value={`${leadRate}%`} detail={`${leads.length} leads captured`} icon={<Users size={18} />} />
        <Metric label="Knowledge health" value={`${knowledgeHealth}%`} detail={`${readySources}/${sources.length} sources ready`} icon={<CheckCircle2 size={18} />} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <MessageVolumeCard data={dailyVolume} />

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-harlo-ink">Outcomes</h2>
          </CardHeader>
          <CardBody>
            <OutcomeSummary
              answered={answeredCount}
              leads={leadConversationCount}
              needsReview={needsReviewCount}
              total={conversations.length}
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold text-harlo-ink">Knowledge gaps</h2>
              <p className="mt-1 text-sm text-harlo-muted">Questions where Harlo did not have enough context.</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {knowledgeGaps.length === 0 ? (
              <EmptyNote icon={<CheckCircle2 size={18} />} title="No gaps found" body="Fallback conversations will appear here when Harlo needs more knowledge." />
            ) : knowledgeGaps.map((gap) => (
              <div key={gap.id} className="rounded-lg border border-harlo-line p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-amber-600"><AlertCircle size={17} /></span>
                  <div>
                    <p className="text-sm font-semibold text-harlo-ink">{gap.question}</p>
                    <p className="mt-1 text-xs text-harlo-muted">{gap.pageLabel} · {formatDateTime(gap.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold text-harlo-ink">Source usage</h2>
              <p className="mt-1 text-sm text-harlo-muted">Most referenced knowledge sources in recent answers.</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {sourceUsage.length === 0 ? (
              <EmptyNote icon={<MessageSquare size={18} />} title="No source usage yet" body="Retrieved sources will appear here after Harlo answers with RAG context." />
            ) : sourceUsage.map((source) => (
              <div key={source.title} className="rounded-lg border border-harlo-line p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-harlo-ink">{source.title}</p>
                  <Badge>{source.count} uses</Badge>
                </div>
                <div className="mt-3 h-2 rounded-full bg-harlo-line">
                  <div className="h-2 rounded-full bg-harlo-teal" style={{ width: `${source.percent}%` }} />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-harlo-muted">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-harlo-ink">{value}</p>
            <p className="mt-2 text-xs text-harlo-muted">{detail}</p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">{icon}</span>
        </div>
      </CardBody>
    </Card>
  );
}

function OutcomeSummary({ answered, leads, needsReview, total }: { answered: number; leads: number; needsReview: number; total: number }) {
  const answeredPercent = total > 0 ? Math.round((answered / total) * 100) : 0;
  const leadPercent = total > 0 ? Math.round((leads / total) * 100) : 0;
  const reviewPercent = total > 0 ? Math.round((needsReview / total) * 100) : 0;
  const leadStop = answeredPercent + leadPercent;

  return (
    <div className="space-y-5">
      <div className="grid place-items-center rounded-lg bg-harlo-canvas p-5">
        <div
          className="grid h-40 w-40 place-items-center rounded-full"
          style={{
            background: `conic-gradient(#087f95 0 ${answeredPercent}%, #7c3aed ${answeredPercent}% ${leadStop}%, #f59e0b ${leadStop}% ${leadStop + reviewPercent}%, #e2e8ee ${leadStop + reviewPercent}% 100%)`
          }}
        >
          <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center shadow-sm">
            <div>
              <p className="text-3xl font-semibold text-harlo-ink">{answeredPercent}%</p>
              <p className="text-xs font-medium text-harlo-muted">answered</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <OutcomeTile label="Answered" value={answered} percent={answeredPercent} colorClass="bg-harlo-teal" />
        <OutcomeTile label="Lead captured" value={leads} percent={leadPercent} colorClass="bg-violet-600" />
        <OutcomeTile label="Needs review" value={needsReview} percent={reviewPercent} colorClass="bg-amber-500" />
      </div>
    </div>
  );
}

function OutcomeTile({ label, value, percent, colorClass }: { label: string; value: number; percent: number; colorClass: string }) {
  return (
    <div className="rounded-lg border border-harlo-line bg-white p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-semibold text-harlo-ink">
          <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
          {label}
        </span>
        <span className="text-harlo-muted">{value} · {percent}%</span>
      </div>
    </div>
  );
}

function EmptyNote({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-harlo-line p-5 text-center">
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">{icon}</span>
      <p className="mt-3 text-sm font-semibold text-harlo-ink">{title}</p>
      <p className="mt-1 text-sm leading-6 text-harlo-muted">{body}</p>
    </div>
  );
}

function getDailyVolume(messages: Array<{ created_at: string }>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 30 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - index));
    const key = date.toISOString().slice(0, 10);
    const count = messages.filter((message) => message.created_at.slice(0, 10) === key).length;

    return {
      key,
      count,
      label: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
      shortLabel: date.toLocaleDateString("en", { day: "numeric" })
    };
  });
}

function getKnowledgeGaps(conversations: Awaited<ReturnType<typeof getInboxConversations>>) {
  return conversations
    .filter((conversation) => conversation.outcome === "Needs review")
    .map((conversation) => {
      const userMessage = conversation.messages.find((message) => message.role === "user");

      return {
        id: conversation.id,
        question: userMessage?.content ?? "No visitor question saved",
        createdAt: conversation.last_message_at,
        pageLabel: formatPageLabel(conversation.page_url)
      };
    })
    .slice(0, 6);
}

function getSourceUsage(messages: Array<{ metadata: Record<string, unknown> }>) {
  const counts = new Map<string, number>();

  messages.forEach((message) => {
    const retrieval = message.metadata?.retrieval;

    if (!Array.isArray(retrieval)) {
      return;
    }

    retrieval.forEach((item) => {
      if (!item || typeof item !== "object") {
        return;
      }

      const sourceTitle = (item as Record<string, unknown>).sourceTitle;

      if (typeof sourceTitle === "string") {
        counts.set(sourceTitle, (counts.get(sourceTitle) ?? 0) + 1);
      }
    });
  });

  const max = Math.max(1, ...counts.values());

  return Array.from(counts.entries())
    .map(([title, count]) => ({
      title,
      count,
      percent: Math.round((count / max) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function formatPageLabel(value: string | null) {
  if (!value) {
    return "Website visitor";
  }

  try {
    const url = new URL(value);
    return url.pathname === "/" ? url.host : `${url.host}${url.pathname}`;
  } catch {
    return value;
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
