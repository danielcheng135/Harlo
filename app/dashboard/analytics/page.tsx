import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Calendar,
  FileText,
  Globe2,
  HelpCircle,
  Info,
  Library,
  MessageSquare,
  Star,
  Users,
  Zap
} from "lucide-react";
import { FilterSubmitButton } from "@/components/analytics/filter-submit-button";
import { Card, CardBody } from "@/components/ui/card";
import {
  getBillingOverview,
  getInboxConversations,
  getKnowledgeSources,
  getLeads,
  getWorkspaceOrRedirect,
  type InboxConversationRow,
  type InboxMessageRow,
  type KnowledgeSourceRow,
  type LeadRow,
  type WorkspaceBot
} from "@/lib/harlo/data";

type DayPoint = {
  key: string;
  label: string;
  conversations: number;
  leads: number;
  quality: number;
  responseTime: number;
};

type Trend = {
  value: string;
  label: string;
  positive: boolean;
};

type AnalyticsSearchParams = {
  agent?: string | string[];
  from?: string | string[];
  to?: string | string[];
};

type AnalyticsRange = {
  end: Date;
  start: Date;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export default async function AnalyticsPage({ searchParams }: { searchParams?: Promise<AnalyticsSearchParams> }) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const workspace = await getWorkspaceOrRedirect();
  const [conversations, leads, sources, billing] = await Promise.all([
    getInboxConversations(workspace),
    getLeads(workspace),
    getKnowledgeSources(workspace),
    getBillingOverview(workspace)
  ]);
  const selectedAgentId = getSelectedAgentId(resolvedSearchParams.agent, workspace.bots.map((bot) => bot.id));
  const analyticsRange = getAnalyticsRange(resolvedSearchParams.from, resolvedSearchParams.to);
  const agentConversations = selectedAgentId === "all" ? conversations : conversations.filter((conversation) => conversation.bot_id === selectedAgentId);
  const agentLeads = selectedAgentId === "all" ? leads : leads.filter((lead) => lead.bot_id === selectedAgentId);
  const dailyData = getRangeAnalytics(agentConversations, agentLeads, analyticsRange);
  const scopedConversations = agentConversations.filter((conversation) => isWithinPeriod(conversation.created_at, analyticsRange.start, analyticsRange.end));
  const scopedLeads = agentLeads.filter((lead) => isWithinPeriod(lead.created_at, analyticsRange.start, analyticsRange.end));
  const scopedVisitorMessages = scopedConversations.flatMap((conversation) => conversation.messages).filter((message) => message.role === "user");
  const leadConversationCount = scopedConversations.filter((conversation) => conversation.outcome === "Lead captured").length;
  const contactedLeadCount = scopedLeads.filter((lead) => lead.status === "contacted").length;
  const qualifiedCount = getQualifiedConversationCount(scopedConversations);
  const responseQuality = getResponseQuality(scopedConversations);
  const averageResponseSeconds = getAverageResponseSeconds(scopedConversations);
  const sourceBreakdown = getTopKnowledgeSources(sources);
  const topQuestions = getTopQuestions(scopedVisitorMessages, scopedConversations.length);
  const outcomeBreakdown = getOutcomeBreakdown(scopedConversations);
  const dateLabel = getDateRangeLabel(dailyData);
  const previousLabel = getPreviousRangeLabel(dailyData);
  const conversationTrend = getCountTrend(dailyData, "conversations", previousLabel);
  const leadTrend = getCountTrend(dailyData, "leads", previousLabel);
  const qualityTrend = getQualityTrend(dailyData, previousLabel);
  const responseTimeTrend = getResponseTimeTrend(dailyData, previousLabel);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-harlo-ink">Analytics</h1>
          <p className="mt-2 text-sm text-harlo-muted">Track performance, engagement, and outcomes across all your agents.</p>
        </div>
        <AnalyticsFilters
          bots={workspace.bots}
          dateLabel={dateLabel}
          range={analyticsRange}
          selectedAgentId={selectedAgentId}
        />
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<MessageSquare size={17} />}
          label="Conversations"
          value={formatNumber(scopedConversations.length)}
          trend={conversationTrend}
          sparkline={<Sparkline values={dailyData.map((point) => point.conversations)} />}
          tooltip="Total visitor conversations started in the selected date range."
        />
        <MetricCard
          icon={<Users size={17} />}
          label="Leads Captured"
          value={formatNumber(scopedLeads.length)}
          trend={leadTrend}
          sparkline={<Sparkline values={dailyData.map((point) => point.leads)} />}
          tooltip="Leads submitted through your agents in the selected date range."
        />
        <MetricCard
          icon={<Star size={17} />}
          label="Response Quality"
          value={responseQuality.toFixed(2)}
          trend={qualityTrend}
          sparkline={<Sparkline values={dailyData.map((point) => point.quality)} />}
          tooltip="Share of conversations that did not need review, averaged across the selected date range."
        />
        <MetricCard
          icon={<Zap size={17} />}
          label="Credit Usage"
          value={`${formatNumber(billing.creditsUsed)} / ${formatNumber(billing.creditLimit)}`}
          detail={`${billing.percentUsed}% used`}
          progress={billing.percentUsed}
          tooltip="Message credits used during the current billing period."
        />
      </section>

      <Card>
        <CardBody className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-harlo-ink">Conversations Over Time</h2>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-5 text-xs font-medium text-harlo-muted sm:flex">
                <LegendDot label="Conversations" tone="solid" />
                <LegendDot label="Leads Captured" tone="dashed" />
              </div>
            </div>
          </div>
          <DualLineChart data={dailyData} />
        </CardBody>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_minmax(0,1.15fr)]">
        <Panel title="Top Knowledge Sources" footer="View all sources" href="/dashboard/knowledge">
          <div className="space-y-4">
            {sourceBreakdown.length === 0 ? (
              <EmptyBlock icon={<Library size={18} />} title="No sources yet" body="Add knowledge sources to see which ones power the most answers." />
            ) : sourceBreakdown.map((source) => (
              <SourceRow key={source.id} source={source} />
            ))}
          </div>
        </Panel>

        <Panel title="Lead Funnel" footerDivider>
          <LeadFunnel
            conversations={scopedConversations.length}
            qualified={qualifiedCount}
            leads={leadConversationCount}
            contacted={contactedLeadCount}
          />
        </Panel>

        <Panel title="Top Questions" footer="View all questions" href="/dashboard/conversations">
          <div className="overflow-hidden">
            <div className="grid grid-cols-[minmax(0,1fr)_110px_90px] border-b border-harlo-line pb-3 text-xs font-semibold text-harlo-muted">
              <span>Question</span>
              <span className="text-right">Conversations</span>
              <span className="text-right">% of Total</span>
            </div>
            {topQuestions.length === 0 ? (
              <EmptyBlock icon={<HelpCircle size={18} />} title="No questions yet" body="Visitor questions will appear here once conversations start." />
            ) : topQuestions.map((question) => (
              <div key={question.question} className="grid grid-cols-[minmax(0,1fr)_110px_90px] border-b border-harlo-line py-3 text-sm last:border-b-0">
                <span className="truncate font-medium text-harlo-teal">{question.question}</span>
                <span className="text-right text-harlo-muted">{formatNumber(question.count)}</span>
                <span className="text-right text-harlo-muted">{question.percent}%</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardBody className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-harlo-ink">Response Quality Trend</h2>
                <div className="mt-3 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-harlo-ink">{responseQuality.toFixed(2)}</span>
                  <TrendPill trend={qualityTrend} />
                </div>
              </div>
            </div>
            <div className="mt-5">
              <MiniLineChart
                gradientId="responseQualityTrendFill"
                data={dailyData.map((point) => ({
                  label: point.label,
                  value: point.quality,
                  tooltip: `${point.label}: ${point.quality.toFixed(2)} quality`
                }))}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <h2 className="text-base font-semibold text-harlo-ink">Conversations by Outcome</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
              <DonutChart items={outcomeBreakdown} />
              <div className="space-y-3">
                {outcomeBreakdown.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 font-medium text-harlo-ink">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="text-harlo-muted">{formatNumber(item.value)} ({item.percent}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <h2 className="text-base font-semibold text-harlo-ink">Average Response Time</h2>
            <div className="mt-3 flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-harlo-ink">{formatSeconds(averageResponseSeconds)}</span>
              <TrendPill trend={responseTimeTrend} />
            </div>
            <div className="mt-5">
              <MiniLineChart
                gradientId="averageResponseTimeFill"
                data={dailyData.map((point) => ({
                  label: point.label,
                  value: point.responseTime,
                  tooltip: `${point.label}: ${formatSeconds(point.responseTime)} average response time`
                }))}
              />
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function AnalyticsFilters({
  bots,
  dateLabel,
  range,
  selectedAgentId
}: {
  bots: WorkspaceBot[];
  dateLabel: string;
  range: AnalyticsRange;
  selectedAgentId: string;
}) {
  const selectedAgentLabel = selectedAgentId === "all"
    ? "All Agents"
    : bots.find((bot) => bot.id === selectedAgentId)?.name ?? "All Agents";
  const fromValue = toDateInputValue(range.start);
  const toValue = toDateInputValue(addDays(range.end, -1));

  return (
    <div className="grid gap-3 lg:min-w-[548px] sm:grid-cols-2">
      <details className="group relative">
        <summary className="flex h-16 cursor-pointer list-none items-center justify-between gap-3 rounded-lg border border-harlo-line bg-white px-4 shadow-sm transition hover:border-harlo-teal focus:outline-none focus:ring-2 focus:ring-harlo-mist [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-harlo-teal">Agents</span>
            <span className="mt-0.5 block truncate text-sm font-semibold text-harlo-ink">{selectedAgentLabel}</span>
          </span>
          <span className="text-harlo-muted">
            <Bot size={14} />
          </span>
        </summary>
        <form action="/dashboard/analytics" className="absolute right-0 top-[calc(100%+8px)] z-20 w-[min(340px,calc(100vw-2rem))] rounded-lg border border-harlo-line bg-white p-4 shadow-xl">
          <input name="from" type="hidden" value={fromValue} />
          <input name="to" type="hidden" value={toValue} />
          <p className="text-sm font-semibold text-harlo-ink">Select agent</p>
          <div className="mt-3 space-y-2">
            <AgentOption checked={selectedAgentId === "all"} label="All Agents" value="all" />
            {bots.map((bot) => (
              <AgentOption key={bot.id} checked={selectedAgentId === bot.id} label={bot.name} value={bot.id} />
            ))}
          </div>
          <FilterSubmitButton label="Apply agent" pendingLabel="Applying..." />
        </form>
      </details>

      <details className="group relative">
        <summary className="flex h-16 cursor-pointer list-none items-center justify-between gap-3 rounded-lg border border-harlo-line bg-white px-4 shadow-sm transition hover:border-harlo-teal focus:outline-none focus:ring-2 focus:ring-harlo-mist [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-harlo-teal">Date range</span>
            <span className="mt-0.5 block truncate text-sm font-semibold text-harlo-ink">{dateLabel}</span>
          </span>
          <span className="text-harlo-muted">
            <Calendar size={14} />
          </span>
        </summary>
        <form action="/dashboard/analytics" className="absolute right-0 top-[calc(100%+8px)] z-20 w-[min(420px,calc(100vw-2rem))] rounded-lg border border-harlo-line bg-white p-4 shadow-xl">
          <input name="agent" type="hidden" value={selectedAgentId} />
          <p className="text-sm font-semibold text-harlo-ink">Select date range</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-harlo-muted">
              Start
              <input
                aria-label="Start date"
                className="mt-1 h-10 w-full rounded-md border border-harlo-line bg-harlo-canvas px-3 text-sm font-semibold text-harlo-ink outline-none transition focus:border-harlo-teal focus:bg-white"
                defaultValue={fromValue}
                name="from"
                type="date"
              />
            </label>
            <label className="text-xs font-semibold text-harlo-muted">
              End
              <input
                aria-label="End date"
                className="mt-1 h-10 w-full rounded-md border border-harlo-line bg-harlo-canvas px-3 text-sm font-semibold text-harlo-ink outline-none transition focus:border-harlo-teal focus:bg-white"
                defaultValue={toValue}
                name="to"
                type="date"
              />
            </label>
          </div>
          <FilterSubmitButton label="Apply date range" pendingLabel="Applying..." />
        </form>
      </details>
    </div>
  );
}

function AgentOption({ checked, label, value }: { checked: boolean; label: string; value: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-harlo-line px-3 py-2.5 text-sm font-semibold text-harlo-ink transition hover:bg-harlo-mist">
      <span className="truncate">{label}</span>
      <input
        className="h-4 w-4 accent-harlo-teal"
        defaultChecked={checked}
        name="agent"
        type="radio"
        value={value}
      />
    </label>
  );
}

function MetricCard({
  detail,
  icon,
  label,
  progress,
  sparkline,
  tooltip,
  trend,
  value
}: {
  detail?: string;
  icon: ReactNode;
  label: string;
  progress?: number;
  sparkline?: ReactNode;
  tooltip: string;
  trend?: Trend;
  value: string;
}) {
  return (
    <Card>
      <CardBody className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">{icon}</span>
            <p className="text-sm font-semibold text-harlo-ink">{label}</p>
          </div>
          <InfoTooltip text={tooltip} />
        </div>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_90px] items-end gap-3">
          <div>
            <p className="text-3xl font-semibold tracking-tight text-harlo-ink">{value}</p>
            {trend ? <TrendPill trend={trend} /> : detail ? <p className="mt-3 text-sm font-semibold text-harlo-teal">{detail}</p> : null}
          </div>
          {sparkline ? <div className="h-14">{sparkline}</div> : progress !== undefined ? <CreditProgress value={progress} /> : null}
        </div>
      </CardBody>
    </Card>
  );
}

function TrendPill({ trend }: { trend: Trend }) {
  return (
    <p className="mt-3 text-xs font-medium text-harlo-muted">
      <span className={trend.positive ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>{trend.value}</span>
      <span className="ml-2">{trend.label}</span>
    </p>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-grid h-5 w-5 place-items-center">
      <Info size={15} className="text-harlo-muted" />
      <span className="pointer-events-none absolute right-0 top-full z-30 mt-2 w-56 rounded-lg bg-harlo-ink px-3 py-2 text-xs font-medium leading-5 text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  );
}

function CreditProgress({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="pb-2">
      <div className="h-2 rounded-full bg-harlo-line">
        <div className="h-2 rounded-full bg-harlo-teal" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function Panel({
  children,
  footer,
  footerDivider = false,
  href,
  title
}: {
  children: ReactNode;
  footer?: string;
  footerDivider?: boolean;
  href?: "/dashboard/knowledge" | "/dashboard/conversations";
  title: string;
}) {
  const footerContent = (
    <>
      {footer}
      <ArrowRight size={13} />
    </>
  );

  return (
    <Card className="flex min-h-[280px] flex-col">
      <CardBody className="flex flex-1 flex-col p-5">
        <h2 className="text-base font-semibold text-harlo-ink">{title}</h2>
        <div className="mt-4 flex-1">{children}</div>
        {footer ? (
          <div className="mt-4 min-h-9 border-t border-harlo-line pt-4">
            {href ? (
              <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-harlo-teal transition hover:text-harlo-navy">
                {footerContent}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-harlo-teal">
                {footerContent}
              </span>
            )}
          </div>
        ) : footerDivider ? <div className="mt-4 min-h-9 border-t border-harlo-line pt-4" /> : null}
      </CardBody>
    </Card>
  );
}

function SourceRow({ source }: { source: ReturnType<typeof getTopKnowledgeSources>[number] }) {
  const Icon = getSourceIcon(source);
  const logoUrl = source.sourceType === "url" ? getSourceLogoCandidates(source)[0] : null;

  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)_120px_42px] items-center gap-3">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-full w-full object-contain p-1.5" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <Icon size={16} />
        )}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-harlo-ink">{source.name}</p>
        <p className="text-xs text-harlo-muted">{formatNumber(source.chunks)} chunks</p>
      </div>
      <div className="h-2 rounded-full bg-harlo-line">
        <div className="h-2 rounded-full bg-harlo-teal" style={{ width: `${source.percent}%` }} />
      </div>
      <p className="text-right text-sm font-semibold text-harlo-muted">{source.percent}%</p>
    </div>
  );
}

function LeadFunnel({
  contacted,
  conversations,
  leads,
  qualified
}: {
  contacted: number;
  conversations: number;
  leads: number;
  qualified: number;
}) {
  return (
    <div className="mx-auto w-full max-w-[520px] overflow-hidden">
      <svg viewBox="0 0 520 246" className="block h-auto w-full" role="img" aria-label="Lead funnel">
        <defs>
          <filter id="leadFunnelShadow" x="-10%" y="-15%" width="120%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#087f95" floodOpacity="0.08" />
          </filter>
        </defs>
        <FunnelSegment color="#087f95" label="Conversations" textColor="#ffffff" value={conversations} y={0} y2={56} />
        <FunnelSegment color="#1f9cab" label="Qualified" textColor="#ffffff" value={qualified} y={62} y2={118} />
        <FunnelSegment color="#5fc2cb" label="Leads Captured" textColor="#ffffff" value={leads} y={124} y2={180} />
        <FunnelSegment color="#c2e8ee" label="Contacted" textColor="#263445" value={contacted} y={186} y2={242} />
        <FunnelCallout percent={formatPercent(qualified, conversations)} y={90} />
        <FunnelCallout percent={formatPercent(leads, qualified)} y={152} />
        <FunnelCallout percent={formatPercent(contacted, leads)} y={214} />
      </svg>
    </div>
  );
}

function FunnelSegment({
  color,
  label,
  textColor,
  value,
  y,
  y2
}: {
  color: string;
  label: string;
  textColor: string;
  value: number;
  y: number;
  y2: number;
}) {
  const centerX = 190;
  const topWidth = getFunnelWidthAtY(y);
  const bottomWidth = getFunnelWidthAtY(y2);
  const topLeft = centerX - topWidth / 2;
  const topRight = centerX + topWidth / 2;
  const bottomLeft = centerX - bottomWidth / 2;
  const bottomRight = centerX + bottomWidth / 2;
  const midY = y + (y2 - y) / 2;

  return (
    <g filter="url(#leadFunnelShadow)">
      <path d={roundedTrapezoidPath(topLeft, topRight, bottomRight, bottomLeft, y, y2)} fill={color} />
      <text x={centerX} y={midY - 4} textAnchor="middle" className="fill-current text-[24px] font-semibold" style={{ color: textColor }}>
        {formatNumber(value)}
      </text>
      <text x={centerX} y={midY + 18} textAnchor="middle" className="fill-current text-[12px] font-semibold" style={{ color: textColor }}>
        {label}
      </text>
    </g>
  );
}

function FunnelCallout({ percent, y }: { percent: string; y: number }) {
  const lineStart = getFunnelRightEdgeAtY(y) + 18;
  const lineEnd = 394;
  const pillX = 410;

  return (
    <g>
      <line x1={lineStart} x2={lineEnd} y1={y} y2={y} stroke="#e2e8ee" strokeWidth="1" />
      <circle cx={lineEnd} cy={y} r="4" fill="#ffffff" stroke="#e2e8ee" strokeWidth="1" />
      <rect x={pillX} y={y - 13} width="76" height="26" rx="8" fill="#e6f3f6" />
      <text x={pillX + 38} y={y + 4} textAnchor="middle" className="fill-harlo-teal text-[12px] font-semibold">
        {percent}
      </text>
    </g>
  );
}

function getFunnelWidthAtY(y: number) {
  const topWidth = 318;
  const bottomWidth = 152;
  const progress = Math.max(0, Math.min(1, y / 242));

  return topWidth - (topWidth - bottomWidth) * progress;
}

function getFunnelRightEdgeAtY(y: number) {
  return 190 + getFunnelWidthAtY(y) / 2;
}

function roundedTrapezoidPath(topLeft: number, topRight: number, bottomRight: number, bottomLeft: number, y: number, y2: number) {
  const radius = 7;

  return [
    `M ${topLeft + radius} ${y}`,
    `L ${topRight - radius} ${y}`,
    `Q ${topRight} ${y} ${topRight - radius / 2} ${y + radius}`,
    `L ${bottomRight + radius / 2} ${y2 - radius}`,
    `Q ${bottomRight} ${y2} ${bottomRight - radius} ${y2}`,
    `L ${bottomLeft + radius} ${y2}`,
    `Q ${bottomLeft} ${y2} ${bottomLeft - radius / 2} ${y2 - radius}`,
    `L ${topLeft + radius / 2} ${y + radius}`,
    `Q ${topLeft} ${y} ${topLeft + radius} ${y}`,
    "Z"
  ].join(" ");
}

function EmptyBlock({ body, icon, title }: { body: string; icon: ReactNode; title: string }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-harlo-line p-5 text-center">
      <div>
        <span className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">{icon}</span>
        <p className="mt-3 text-sm font-semibold text-harlo-ink">{title}</p>
        <p className="mt-1 text-sm leading-6 text-harlo-muted">{body}</p>
      </div>
    </div>
  );
}

function LegendDot({ label, tone }: { label: string; tone: "solid" | "dashed" }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={tone === "solid" ? "h-0.5 w-5 rounded-full bg-harlo-teal" : "h-0 w-5 border-t border-dashed border-harlo-blue"} />
      {label}
    </span>
  );
}

function DualLineChart({ data }: { data: DayPoint[] }) {
  const chart = buildDualChart(data);
  const conversationPath = toPolyline(chart.conversationPoints);
  const leadPath = toPolyline(chart.leadPoints);
  const areaPath = `${chart.conversationPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")} L ${chart.right} ${chart.bottom} L ${chart.left} ${chart.bottom} Z`;

  return (
    <div className="mt-4 w-full min-w-0 overflow-hidden">
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="block h-auto w-full overflow-visible" role="img" aria-label="Conversations and leads over time">
        <defs>
          <linearGradient id="analyticsConversationFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#087f95" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#087f95" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = chart.top + ((chart.bottom - chart.top) / 3) * line;
          return <line key={line} x1={chart.left} x2={chart.right} y1={y} y2={y} stroke="#e2e8ee" strokeDasharray="4 6" pointerEvents="none" />;
        })}
        <path d={areaPath} fill="url(#analyticsConversationFill)" pointerEvents="none" />
        <polyline points={conversationPath} fill="none" stroke="#087f95" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
        <polyline points={leadPath} fill="none" stroke="#5aaec0" strokeWidth="2" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
        {chart.conversationPoints.map((point, index) => (
          <circle key={`conversation-${data[index].key}`} cx={point.x} cy={point.y} r="4" fill="#087f95" stroke="#ffffff" strokeWidth="2">
            <title>{`${data[index].label}\nConversations: ${formatNumber(data[index].conversations)}\nLeads captured: ${formatNumber(data[index].leads)}`}</title>
          </circle>
        ))}
        {chart.leadPoints.map((point, index) => (
          <circle key={`lead-${data[index].key}`} cx={point.x} cy={point.y} r="3" fill="#5aaec0" stroke="#ffffff" strokeWidth="2">
            <title>{`${data[index].label}\nConversations: ${formatNumber(data[index].conversations)}\nLeads captured: ${formatNumber(data[index].leads)}`}</title>
          </circle>
        ))}
        {data.map((point, index) => (
          <text key={point.key} x={chart.conversationPoints[index].x} y={chart.height - 8} textAnchor="middle" className="fill-harlo-muted text-[11px]">
            {point.label}
          </text>
        ))}
        {data.map((point, index) => {
          const currentX = chart.conversationPoints[index].x;
          const previousX = index === 0 ? chart.left : (chart.conversationPoints[index - 1].x + currentX) / 2;
          const nextX = index === data.length - 1 ? chart.right : (currentX + chart.conversationPoints[index + 1].x) / 2;
          const tooltipWidth = 190;
          const tooltipHeight = 64;
          const tooltipX = clamp(currentX - tooltipWidth / 2, chart.left, chart.right - tooltipWidth);
          const tooltipY = chart.top + 8;

          return (
            <g key={`hover-${point.key}`} className="group">
              <rect
                x={previousX}
                y={chart.top}
                width={Math.max(1, nextX - previousX)}
                height={chart.bottom - chart.top}
                fill="transparent"
                pointerEvents="all"
              />
              <line
                x1={currentX}
                x2={currentX}
                y1={chart.top}
                y2={chart.bottom}
                stroke="#cbd5e1"
                strokeDasharray="4 6"
                className="opacity-0 transition-opacity group-hover:opacity-100"
                pointerEvents="none"
              />
              <g className="opacity-0 transition-opacity group-hover:opacity-100" pointerEvents="none">
                <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx="8" fill="#101827" />
                <text x={tooltipX + 12} y={tooltipY + 20} className="fill-white text-[12px] font-semibold">{point.label}</text>
                <text x={tooltipX + 12} y={tooltipY + 39} className="fill-white/90 text-[11px]">Conversations: {formatNumber(point.conversations)}</text>
                <text x={tooltipX + 12} y={tooltipY + 54} className="fill-white/90 text-[11px]">Leads captured: {formatNumber(point.leads)}</text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const chart = buildLine(values, 90, 52, 8);
  const areaPath = `${chart.points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")} L ${chart.width - 2} ${chart.height - 3} L 2 ${chart.height - 3} Z`;

  return (
    <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="sparklineFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#087f95" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#087f95" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparklineFill)" />
      <polyline points={toPolyline(chart.points)} fill="none" stroke="#087f95" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniLineChart({ data, gradientId }: { data: Array<{ label: string; tooltip: string; value: number }>; gradientId: string }) {
  const chart = buildTrendChart(data.map((point) => point.value));
  const linePath = toPolyline(chart.points);
  const areaPath = `${chart.points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")} L ${chart.right} ${chart.bottom} L ${chart.left} ${chart.bottom} Z`;

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="block h-auto w-full overflow-visible" role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#087f95" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#087f95" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = chart.top + ((chart.bottom - chart.top) / 3) * line;
          return <line key={line} x1={chart.left} x2={chart.right} y1={y} y2={y} stroke="#e2e8ee" strokeDasharray="4 6" pointerEvents="none" />;
        })}
        <path d={areaPath} fill={`url(#${gradientId})`} pointerEvents="none" />
        <polyline points={linePath} fill="none" stroke="#087f95" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
        {chart.points.map((point, index) => (
          <g key={`${data[index].label}-${index}`}>
            <circle cx={point.x} cy={point.y} r="5" fill="#ffffff" stroke="#087f95" strokeWidth="2.5">
              <title>{data[index].tooltip}</title>
            </circle>
            <text x={point.x} y={chart.height - 8} textAnchor="middle" className="fill-harlo-muted text-[11px]">
            {data[index].label.replace("May ", "")}
          </text>
        </g>
      ))}
        {data.map((point, index) => {
          const currentX = chart.points[index].x;
          const previousX = index === 0 ? chart.left : (chart.points[index - 1].x + currentX) / 2;
          const nextX = index === data.length - 1 ? chart.right : (currentX + chart.points[index + 1].x) / 2;
          const tooltipWidth = 176;
          const tooltipHeight = 44;
          const tooltipX = clamp(currentX - tooltipWidth / 2, chart.left, chart.right - tooltipWidth);
          const tooltipY = chart.top + 8;

          return (
            <g key={`trend-hover-${point.label}-${index}`} className="group">
              <rect
                x={previousX}
                y={chart.top}
                width={Math.max(1, nextX - previousX)}
                height={chart.bottom - chart.top}
                fill="transparent"
                pointerEvents="all"
              />
              <line
                x1={currentX}
                x2={currentX}
                y1={chart.top}
                y2={chart.bottom}
                stroke="#cbd5e1"
                strokeDasharray="4 6"
                className="opacity-0 transition-opacity group-hover:opacity-100"
                pointerEvents="none"
              />
              <g className="opacity-0 transition-opacity group-hover:opacity-100" pointerEvents="none">
                <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx="8" fill="#101827" />
                <text x={tooltipX + 12} y={tooltipY + 18} className="fill-white text-[12px] font-semibold">{point.label}</text>
                <text x={tooltipX + 12} y={tooltipY + 34} className="fill-white/90 text-[11px]">{point.tooltip.replace(`${point.label}: `, "")}</text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({ items }: { items: Array<{ color: string; label: string; percent: number; value: number }> }) {
  const stops = items.reduce<Array<{ color: string; end: number; start: number }>>((current, item) => {
    const start = current[current.length - 1]?.end ?? 0;
    return [...current, { color: item.color, start, end: start + item.percent }];
  }, []);
  const background = stops.length === 0
    ? "#e2e8ee"
    : `conic-gradient(${stops.map((stop) => `${stop.color} ${stop.start}% ${stop.end}%`).join(", ")}, #e2e8ee 0)`;

  return (
    <div className="mx-auto grid h-32 w-32 place-items-center rounded-full" style={{ background }}>
      <div className="h-20 w-20 rounded-full bg-white" />
    </div>
  );
}

function getRangeAnalytics(conversations: InboxConversationRow[], leads: LeadRow[], range: AnalyticsRange): DayPoint[] {
  const days = Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / DAY_IN_MS));

  return Array.from({ length: days }).map((_, index) => {
    const start = addDays(range.start, index);
    const end = addDays(start, 1);
    const key = toDateInputValue(start);
    const dayConversations = conversations.filter((conversation) => isWithinPeriod(conversation.created_at, start, end));
    const dayLeads = leads.filter((lead) => isWithinPeriod(lead.created_at, start, end));

    return {
      key,
      label: start.toLocaleDateString("en", { month: "short", day: "numeric" }),
      conversations: dayConversations.length,
      leads: dayLeads.length,
      quality: getResponseQuality(dayConversations),
      responseTime: getAverageResponseSeconds(dayConversations)
    };
  });
}

function getAnalyticsRange(fromValue: string | string[] | undefined, toValue: string | string[] | undefined): AnalyticsRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fallbackStart = addDays(today, -7);
  const fallbackEnd = addDays(today, 1);
  const requestedStart = parseDateParam(fromValue) ?? fallbackStart;
  const requestedEnd = parseDateParam(toValue) ?? today;
  const start = requestedStart > requestedEnd ? requestedEnd : requestedStart;
  const inclusiveEnd = requestedStart > requestedEnd ? requestedStart : requestedEnd;

  return {
    start,
    end: addDays(inclusiveEnd, 1)
  };
}

function parseDateParam(value: string | string[] | undefined) {
  const selected = Array.isArray(value) ? value[0] : value;

  if (!selected || !/^\d{4}-\d{2}-\d{2}$/.test(selected)) {
    return null;
  }

  const [year, month, day] = selected.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);

  return date;
}

function isWithinPeriod(value: string, start: Date, end: Date) {
  const date = new Date(value);

  return date >= start && date < end;
}

function getQualifiedConversationCount(conversations: InboxConversationRow[]) {
  return conversations.filter((conversation) => conversation.lead || conversation.messages.some((message) => {
    if (message.role !== "user") {
      return false;
    }

    return /\b(price|pricing|cost|quote|demo|book|call|buy|hire|service|plan|contact|consultation|appointment)\b/i.test(message.content);
  })).length;
}

function getResponseQuality(conversations: InboxConversationRow[]) {
  if (conversations.length === 0) {
    return 0;
  }

  const good = conversations.filter((conversation) => conversation.outcome !== "Needs review").length;
  return good / conversations.length;
}

function getAverageResponseSeconds(conversations: InboxConversationRow[]) {
  const durations = conversations.flatMap((conversation) => getConversationResponseDurations(conversation.messages));

  if (durations.length === 0) {
    return 0;
  }

  return durations.reduce((total, value) => total + value, 0) / durations.length;
}

function getConversationResponseDurations(messages: InboxMessageRow[]) {
  return messages.reduce<number[]>((durations, message, index) => {
    if (message.role !== "user") {
      return durations;
    }

    const assistantReply = messages.slice(index + 1).find((candidate) => candidate.role === "assistant");

    if (!assistantReply) {
      return durations;
    }

    const seconds = (new Date(assistantReply.created_at).getTime() - new Date(message.created_at).getTime()) / 1000;

    if (seconds >= 0 && seconds < 120) {
      durations.push(seconds);
    }

    return durations;
  }, []);
}

function getTopKnowledgeSources(sources: KnowledgeSourceRow[]) {
  const totalChunks = Math.max(1, sources.reduce((total, source) => total + getChunkCount(source), 0));

  return sources
    .map((source) => ({
      id: source.id,
      name: source.name,
      sourceType: source.source_type,
      status: source.status,
      metadata: source.metadata,
      chunks: getChunkCount(source),
      percent: Math.round((getChunkCount(source) / totalChunks) * 100)
    }))
    .sort((first, second) => second.chunks - first.chunks)
    .slice(0, 5);
}

function getTopQuestions(messages: InboxMessageRow[], totalConversations: number) {
  const counts = new Map<string, number>();

  messages.forEach((message) => {
    const question = normalizeQuestion(message.content);

    if (!question) {
      return;
    }

    counts.set(question, (counts.get(question) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([question, count]) => ({
      question,
      count,
      percent: totalConversations > 0 ? Math.round((count / totalConversations) * 1000) / 10 : 0
    }))
    .sort((first, second) => second.count - first.count)
    .slice(0, 5);
}

function getOutcomeBreakdown(conversations: InboxConversationRow[]) {
  const total = Math.max(1, conversations.length);
  const resolved = conversations.filter((conversation) => conversation.outcome === "Answered").length;
  const leadCaptured = conversations.filter((conversation) => conversation.outcome === "Lead captured").length;
  const noMatch = conversations.filter((conversation) => conversation.outcome === "Needs review").length;

  return [
    { label: "Resolved", value: resolved, percent: Math.round((resolved / total) * 100), color: "#087f95" },
    { label: "Lead captured", value: leadCaptured, percent: Math.round((leadCaptured / total) * 100), color: "#25b8c7" },
    { label: "No Match", value: noMatch, percent: Math.round((noMatch / total) * 100), color: "#cbd5e1" }
  ];
}

function getCountTrend(data: DayPoint[], key: "conversations" | "leads", previousLabel: string): Trend {
  const { current, previous } = splitTrendData(data);
  const currentValue = current.reduce((total, point) => total + point[key], 0);
  const previousValue = previous.reduce((total, point) => total + point[key], 0);
  const delta = previousValue === 0 ? currentValue : Math.round(((currentValue - previousValue) / previousValue) * 1000) / 10;
  const positive = delta >= 0;

  return {
    value: `${positive ? "+" : "-"}${Math.abs(delta)}%`,
    label: `vs ${previousLabel}`,
    positive
  };
}

function getQualityTrend(data: DayPoint[], previousLabel: string): Trend {
  const { current, previous } = splitTrendData(data);
  const currentValue = average(current.map((point) => point.quality));
  const previousValue = average(previous.map((point) => point.quality));
  const delta = currentValue - previousValue;

  return {
    value: `${delta >= 0 ? "+" : "-"}${Math.abs(delta).toFixed(2)}`,
    label: `vs ${previousLabel}`,
    positive: delta >= 0
  };
}

function getResponseTimeTrend(data: DayPoint[], previousLabel: string): Trend {
  const { current, previous } = splitTrendData(data);
  const currentValue = average(current.map((point) => point.responseTime));
  const previousValue = average(previous.map((point) => point.responseTime));
  const delta = currentValue - previousValue;

  return {
    value: `${delta <= 0 ? "-" : "+"}${formatSeconds(Math.abs(delta))}`,
    label: `vs ${previousLabel}`,
    positive: delta <= 0
  };
}

function splitTrendData(data: DayPoint[]) {
  if (data.length <= 1) {
    return { current: data, previous: data };
  }

  const splitIndex = Math.max(1, Math.floor(data.length / 2));

  return {
    previous: data.slice(0, splitIndex),
    current: data.slice(splitIndex)
  };
}

function buildDualChart(data: DayPoint[]) {
  const width = 1500;
  const height = 250;
  const left = 36;
  const right = width - 36;
  const top = 18;
  const bottom = height - 34;
  const maxConversations = Math.max(1, ...data.map((point) => point.conversations));
  const maxLeads = Math.max(1, ...data.map((point) => point.leads));
  const step = data.length > 1 ? (right - left) / (data.length - 1) : right - left;
  const conversationPoints = data.map((point, index) => ({
    x: left + step * index,
    y: bottom - (point.conversations / maxConversations) * (bottom - top)
  }));
  const leadPoints = data.map((point, index) => ({
    x: left + step * index,
    y: bottom - (point.leads / maxLeads) * (bottom - top)
  }));

  return { width, height, left, right, top, bottom, conversationPoints, leadPoints };
}

function buildTrendChart(values: number[]) {
  const width = 720;
  const height = 180;
  const left = 24;
  const right = width - 24;
  const top = 16;
  const bottom = height - 34;
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);
  const step = values.length > 1 ? (right - left) / (values.length - 1) : right - left;
  const points = values.map((value, index) => ({
    x: left + step * index,
    y: bottom - ((value - min) / range) * (bottom - top)
  }));

  return { width, height, left, right, top, bottom, points };
}

function buildLine(values: number[], width: number, height: number, padding: number) {
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : width - padding * 2;
  const points = values.map((value, index) => ({
    x: padding + step * index,
    y: height - padding - ((value - min) / range) * (height - padding * 2)
  }));

  return { width, height, points };
}

function toPolyline(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeQuestion(value: string) {
  const trimmed = value.trim().replace(/\s+/g, " ");

  if (trimmed.length < 8 || !/[?]/.test(trimmed)) {
    return null;
  }

  return trimmed.length > 72 ? `${trimmed.slice(0, 69)}...` : trimmed;
}

function getSelectedAgentId(value: string | string[] | undefined, validBotIds: string[]) {
  const selected = Array.isArray(value) ? value[0] : value;

  return selected && validBotIds.includes(selected) ? selected : "all";
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getChunkCount(source: KnowledgeSourceRow) {
  return typeof source.metadata.chunk_count === "number" ? source.metadata.chunk_count : source.chunks.length;
}

function getSourceIcon(source: ReturnType<typeof getTopKnowledgeSources>[number]) {
  return source.sourceType === "file" ? FileText : source.sourceType === "url" ? Globe2 : BookOpen;
}

function getSourceLogoCandidates(source: ReturnType<typeof getTopKnowledgeSources>[number]) {
  if (source.sourceType !== "url" || source.status !== "ready") {
    return [];
  }

  const metadataLogoUrl = getMetadataString(source.metadata, [
    "logo_url",
    "logoUrl",
    "favicon_url",
    "faviconUrl",
    "icon_url",
    "iconUrl",
    "brand_logo_url",
    "brandLogoUrl",
    "og_logo",
    "ogLogo"
  ]);
  const sourceUrl = getMetadataString(source.metadata, ["url", "source_url", "sourceUrl"]);

  return Array.from(new Set([
    metadataLogoUrl,
    ...getUrlIconCandidates(sourceUrl)
  ].filter((candidate): candidate is string => Boolean(candidate))));
}

function getMetadataString(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function getUrlIconCandidates(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProtocol);

    return [
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url.hostname)}&sz=64`,
      `${url.origin}/apple-touch-icon.png`,
      `${url.origin}/favicon.ico`
    ];
  } catch {
    return [];
  }
}

function getDateRangeLabel(data: DayPoint[]) {
  const first = data[0];
  const last = data[data.length - 1];

  if (!first || !last) {
    return "Last 7 days";
  }

  return `${first.label} - ${last.label}, ${new Date(last.key).getFullYear()}`;
}

function getPreviousRangeLabel(data: DayPoint[]) {
  const { previous } = splitTrendData(data);
  const first = previous[0];
  const last = previous[previous.length - 1];

  if (!first || !last) {
    return "previous period";
  }

  return `${first.label} - ${last.label}`;
}

function formatPercent(value: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 1000) / 10}%`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function formatSeconds(value: number) {
  if (value <= 0) {
    return "0s";
  }

  return `${Math.round(value * 10) / 10}s`;
}

function average(values: number[]) {
  const validValues = values.filter((value) => Number.isFinite(value));

  if (validValues.length === 0) {
    return 0;
  }

  return validValues.reduce((total, value) => total + value, 0) / validValues.length;
}
