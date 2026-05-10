import type { Route } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users
} from "lucide-react";
import { MessageVolumeCard } from "@/components/analytics/message-volume-card";
import type { MessageVolumePoint } from "@/components/analytics/message-volume-line-chart";
import { ChatWidgetPreview } from "@/components/chat-widget-preview";
import { WelcomeChecklist } from "@/components/dashboard/welcome-checklist";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  getInboxConversations,
  getKnowledgeSources,
  getLeads,
  getWorkspaceOrRedirect
} from "@/lib/harlo/data";

export default async function DashboardPage() {
  const workspace = await getWorkspaceOrRedirect();
  const [conversations, leads, sources] = await Promise.all([
    getInboxConversations(workspace),
    getLeads(workspace),
    getKnowledgeSources(workspace)
  ]);
  const messages = conversations.flatMap((conversation) => conversation.messages);
  const visitorMessages = messages.filter((message) => message.role === "user");
  const answeredCount = conversations.filter((conversation) => conversation.outcome === "Answered").length;
  const leadConversationCount = conversations.filter((conversation) => conversation.outcome === "Lead captured").length;
  const needsReviewCount = conversations.filter((conversation) => conversation.outcome === "Needs review").length;
  const readySources = sources.filter((source) => source.status === "ready").length;
  const resolutionRate = conversations.length > 0 ? Math.round((answeredCount / conversations.length) * 100) : 0;
  const leadRate = conversations.length > 0 ? Math.round((leadConversationCount / conversations.length) * 100) : 0;
  const knowledgeHealth = sources.length > 0 ? Math.round((readySources / sources.length) * 100) : 0;
  const dailyVolume = getDailyVolume(messages);
  const actionItems = getActionItems({ needsReviewCount, sourcesCount: sources.length, readySources, leadsCount: leads.length });

  return (
    <div className="space-y-6">
      <div>
        <Badge>{workspace.bot.name}</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">Overview</h1>
        <p className="mt-2 max-w-2xl text-harlo-muted">
          A quick pulse on conversations, leads, AI resolution, and knowledge readiness.
        </p>
      </div>

      <WelcomeChecklist organizationId={workspace.organization.id} sources={sources} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewMetric
          label="Conversations"
          value={formatNumber(conversations.length)}
          detail={`${formatNumber(visitorMessages.length)} visitor messages`}
          icon={MessageSquare}
          accent="teal"
        />
        <OverviewMetric
          label="Leads captured"
          value={formatNumber(leads.length)}
          detail={`${leadRate}% conversion rate`}
          icon={Users}
          accent="violet"
        />
        <OverviewMetric
          label="Resolved by AI"
          value={`${resolutionRate}%`}
          detail={`${answeredCount} answered, ${needsReviewCount} need review`}
          icon={Sparkles}
          accent="sky"
        />
        <OverviewMetric
          label="Knowledge health"
          value={`${knowledgeHealth}%`}
          detail={sources.length > 0 ? `${readySources}/${sources.length} sources ready` : "Add sources"}
          icon={BookOpen}
          accent="emerald"
        />
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <MessageVolumeCard data={dailyVolume} chartClassName="h-[420px]" />
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-harlo-ink">Outcome mix</h2>
                <p className="mt-1 text-sm text-harlo-muted">A quick split of how conversations are ending.</p>
              </div>
              <Badge>{formatNumber(conversations.length)} total</Badge>
            </CardHeader>
            <CardBody>
              <div className="grid gap-4 md:grid-cols-3">
                <OutcomeBlock label="Answered" value={answeredCount} total={conversations.length} color="bg-harlo-teal" icon={CheckCircle2} />
                <OutcomeBlock label="Lead captured" value={leadConversationCount} total={conversations.length} color="bg-violet-500" icon={Users} />
                <OutcomeBlock label="Needs review" value={needsReviewCount} total={conversations.length} color="bg-amber-500" icon={AlertCircle} />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <ChatWidgetPreview
            title={workspace.bot.widget_theme.title}
            greeting={workspace.bot.greeting}
            accent={workspace.bot.widget_theme.accent}
            launcherPosition={workspace.bot.widget_theme.launcher_position}
            welcomePrompts={workspace.bot.widget_theme.welcome_prompts}
            brandLogoUrl={workspace.organization.brand_logo_url ?? null}
          />
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-harlo-ink">Needs attention</h2>
              <p className="mt-1 text-sm text-harlo-muted">The next best places to look.</p>
            </CardHeader>
            <CardBody className="space-y-3">
              {actionItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-start gap-3 rounded-lg border border-harlo-line p-4 transition hover:-translate-y-0.5 hover:border-harlo-teal/50 hover:shadow-sm"
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${item.iconClass}`}>
                    <item.icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-harlo-ink">{item.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-harlo-muted">{item.body}</span>
                  </span>
                  <ArrowRight className="mt-1 shrink-0 text-harlo-muted" size={15} />
                </Link>
              ))}
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
}

function OverviewMetric({ label, value, detail, icon: Icon, accent }: { label: string; value: string; detail: string; icon: LucideIcon; accent: "teal" | "violet" | "sky" | "emerald" }) {
  const accentClass = {
    teal: "bg-harlo-mist text-harlo-teal",
    violet: "bg-violet-50 text-violet-700",
    sky: "bg-sky-50 text-sky-700",
    emerald: "bg-emerald-50 text-emerald-700"
  }[accent];

  return (
    <Card className="p-5 transition hover:-translate-y-0.5 hover:border-harlo-teal/40 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-harlo-muted">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">{value}</p>
          <p className="mt-2 truncate text-sm text-harlo-muted">{detail}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${accentClass}`}>
          <Icon size={18} />
        </span>
      </div>
    </Card>
  );
}

function OutcomeBlock({ label, value, total, color, icon: Icon }: { label: string; value: number; total: number; color: string; icon: LucideIcon }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-harlo-line p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
          <Icon size={17} />
        </span>
        <span className="text-sm font-semibold text-harlo-muted">{percent}%</span>
      </div>
      <p className="mt-4 text-2xl font-semibold text-harlo-ink">{formatNumber(value)}</p>
      <p className="mt-1 text-sm text-harlo-muted">{label}</p>
      <div className="mt-4 h-2 rounded-full bg-harlo-line">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function getActionItems({ needsReviewCount, sourcesCount, readySources, leadsCount }: { needsReviewCount: number; sourcesCount: number; readySources: number; leadsCount: number }) {
  const items: Array<{ title: string; body: string; href: Route; icon: LucideIcon; iconClass: string }> = [];

  if (needsReviewCount > 0) {
    items.push({
      title: "Review knowledge gaps",
      body: `${needsReviewCount} conversation${needsReviewCount === 1 ? "" : "s"} may need a better answer or follow-up.`,
      href: "/dashboard/conversations",
      icon: AlertCircle,
      iconClass: "bg-amber-50 text-amber-700"
    });
  }

  if (sourcesCount === 0 || readySources < sourcesCount) {
    items.push({
      title: sourcesCount === 0 ? "Add knowledge" : "Finish source readiness",
      body: sourcesCount === 0 ? "Give the assistant business context so it can answer specific questions." : `${readySources}/${sourcesCount} sources are ready for retrieval.`,
      href: "/dashboard/knowledge",
      icon: BookOpen,
      iconClass: "bg-harlo-mist text-harlo-teal"
    });
  }

  if (leadsCount === 0) {
    items.push({
      title: "Tune lead capture",
      body: "Choose the questions Harlo asks before handing a visitor to the team.",
      href: "/dashboard/builder",
      icon: Users,
      iconClass: "bg-violet-50 text-violet-700"
    });
  }

  if (items.length === 0) {
    items.push({
      title: "Everything looks steady",
      body: "No urgent issues found. Keep an eye on conversations as traffic grows.",
      href: "/dashboard/analytics",
      icon: TrendingUp,
      iconClass: "bg-emerald-50 text-emerald-700"
    });
  }

  return items.slice(0, 3);
}

function getDailyVolume(messages: Array<{ created_at: string }>): MessageVolumePoint[] {
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}
