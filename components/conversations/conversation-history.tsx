"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Globe2,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  UserRound
} from "lucide-react";
import { AgentBadge } from "@/components/agent-badge";
import { Badge } from "@/components/ui/badge";
import type { InboxConversationRow, InboxMessageRow, LeadRow } from "@/lib/harlo/data";
import { cn, formatPercent } from "@/lib/utils";

type ConversationHistoryProps = {
  businessLogoUrl?: string | null;
  conversations: InboxConversationRow[];
  initialConversationId?: string;
  activeAgentId?: string;
};

type ConversationFilter = "inbox" | "needs-review" | "lead-captured" | "answered";
type DetailTab = "chat" | "details" | "activity";

export function ConversationHistory({ businessLogoUrl, conversations, initialConversationId, activeAgentId }: ConversationHistoryProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialConversationId ?? conversations[0]?.id ?? "");
  const [filter, setFilter] = useState<ConversationFilter>("inbox");
  const [pageFilter, setPageFilter] = useState("all");
  const [detailTab, setDetailTab] = useState<DetailTab>("chat");

  useEffect(() => {
    setSelectedId((current) => {
      if (current && conversations.some((conversation) => conversation.id === current)) {
        return current;
      }

      return initialConversationId ?? conversations[0]?.id ?? "";
    });
  }, [conversations, initialConversationId]);

  const pageOptions = useMemo(() => {
    const pages = new Map<string, string>();

    conversations.forEach((conversation) => {
      const key = getPageKey(conversation.page_url);
      pages.set(key, formatPageLabel(conversation.page_url));
    });

    return Array.from(pages.entries());
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const searchableMessages = conversation.messages.map((message) => message.content).join(" ");
      const leadText = conversation.lead ? `${conversation.lead.name} ${conversation.lead.email}` : "";
      const queryMatches = !normalizedQuery || [
        formatPageLabel(conversation.page_url),
        searchableMessages,
        conversation.outcome,
        leadText,
        conversation.bot_name ?? "",
        conversation.agent_type ?? ""
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
      const filterMatches =
        filter === "inbox" ||
        (filter === "needs-review" && conversation.outcome === "Needs review") ||
        (filter === "lead-captured" && conversation.outcome === "Lead captured") ||
        (filter === "answered" && conversation.outcome === "Answered");
      const pageMatches = pageFilter === "all" || getPageKey(conversation.page_url) === pageFilter;

      return queryMatches && filterMatches && pageMatches;
    });
  }, [conversations, filter, pageFilter, query]);

  const selectedConversation =
    filteredConversations.find((conversation) => conversation.id === selectedId) ??
    conversations.find((conversation) => conversation.id === selectedId) ??
    filteredConversations[0] ??
    conversations[0] ??
    null;
  const openConversations = filteredConversations.filter((conversation) => conversation.outcome !== "Answered");
  const resolvedConversations = filteredConversations.filter((conversation) => conversation.outcome === "Answered");
  const needsReviewCount = conversations.filter((conversation) => conversation.outcome === "Needs review").length;
  const leadCapturedCount = conversations.filter((conversation) => conversation.outcome === "Lead captured").length;
  const answeredCount = conversations.filter((conversation) => conversation.outcome === "Answered").length;

  function selectConversation(conversationId: string) {
    setSelectedId(conversationId);
    setDetailTab("chat");
    const params = new URLSearchParams();

    if (activeAgentId) {
      params.set("agent", activeAgentId);
    }

    params.set("conversation", conversationId);
    window.history.pushState(null, "", `/dashboard/conversations?${params.toString()}`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-harlo-line">
        <ConversationTab active={filter === "inbox"} label="Inbox" count={conversations.length} onClick={() => setFilter("inbox")} />
        <ConversationTab active={filter === "needs-review"} label="Needs review" count={needsReviewCount} onClick={() => setFilter("needs-review")} />
        <ConversationTab active={filter === "lead-captured"} label="Leads captured" count={leadCapturedCount} onClick={() => setFilter("lead-captured")} />
        <ConversationTab active={filter === "answered"} label="Resolved" count={answeredCount} onClick={() => setFilter("answered")} />
      </div>

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm xl:grid-cols-[340px_minmax(0,1fr)_330px] 2xl:grid-cols-[380px_minmax(0,1fr)_360px]">
        <aside className="flex min-h-0 flex-col border-b border-harlo-line bg-white xl:border-b-0 xl:border-r">
          <div className="shrink-0 border-b border-harlo-line p-4">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_170px] xl:grid-cols-1">
              <label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-harlo-line bg-white px-3 text-sm text-harlo-muted focus-within:border-harlo-teal">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-harlo-muted"
                  placeholder="Search conversations..."
                />
              </label>
              <label className="relative block">
                <span className="sr-only">Filter by page</span>
                <select
                  value={pageFilter}
                  onChange={(event) => setPageFilter(event.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-harlo-line bg-white px-3 pr-9 text-sm font-medium text-harlo-ink outline-none transition focus:border-harlo-teal"
                >
                  <option value="all">All pages</option>
                  {pageOptions.map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-harlo-muted" />
              </label>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-3">
            {filteredConversations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-harlo-line bg-harlo-canvas p-5 text-sm text-harlo-muted">
                No conversations match your filters.
              </div>
            ) : (
              <div className="space-y-5">
                {openConversations.length > 0 ? (
                  <ConversationGroup
                    title={`Open (${openConversations.length})`}
                    conversations={openConversations}
                    selectedId={selectedConversation?.id}
                    onSelect={selectConversation}
                  />
                ) : null}
                {resolvedConversations.length > 0 ? (
                  <ConversationGroup
                    title={`Resolved (${resolvedConversations.length})`}
                    conversations={resolvedConversations}
                    selectedId={selectedConversation?.id}
                    onSelect={selectConversation}
                  />
                ) : null}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-harlo-line px-4 py-3 text-xs text-harlo-muted">
            Showing {filteredConversations.length} of {conversations.length}
          </div>
        </aside>

        {selectedConversation ? (
          <>
            <ConversationTranscript businessLogoUrl={businessLogoUrl} conversation={selectedConversation} detailTab={detailTab} onDetailTabChange={setDetailTab} />
            <ConversationInsightPanel conversation={selectedConversation} />
          </>
        ) : (
          <div className="grid min-h-0 place-items-center p-8 text-center xl:col-span-2">
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                <MessageSquare size={20} />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-harlo-ink">Select a conversation</h2>
              <p className="mt-2 text-sm text-harlo-muted">Conversation transcripts will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationTab({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex h-11 items-center gap-2 px-2 text-sm font-semibold transition",
        active ? "text-harlo-teal" : "text-harlo-muted hover:text-harlo-ink"
      )}
    >
      {label}
      <span className={cn("rounded-full px-1.5 py-0.5 text-[11px]", active ? "bg-harlo-mist text-harlo-teal" : "bg-harlo-canvas text-harlo-muted")}>
        {count}
      </span>
      {active ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-harlo-teal" /> : null}
    </button>
  );
}

function ConversationGroup({
  title,
  conversations,
  selectedId,
  onSelect
}: {
  title: string;
  conversations: InboxConversationRow[];
  selectedId?: string;
  onSelect: (conversationId: string) => void;
}) {
  return (
    <section>
      <h3 className="mb-2 px-1 text-xs font-semibold text-harlo-ink">{title}</h3>
      <div className="space-y-2">
        {conversations.map((conversation) => (
          <ConversationRow
            key={conversation.id}
            conversation={conversation}
            isSelected={conversation.id === selectedId}
            onSelect={() => onSelect(conversation.id)}
          />
        ))}
      </div>
    </section>
  );
}

function ConversationRow({
  conversation,
  isSelected,
  onSelect
}: {
  conversation: InboxConversationRow;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const firstUserMessage = conversation.messages.find((message) => message.role === "user");
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const displayName = getConversationDisplayName(conversation);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border bg-white p-3 text-left transition hover:border-harlo-teal hover:shadow-sm",
        isSelected ? "border-harlo-teal bg-harlo-mist/45 shadow-sm ring-1 ring-harlo-teal/10" : "border-harlo-line"
      )}
    >
      <div className="flex items-start gap-3">
        <ConversationAvatar name={displayName} accent={conversation.bot_accent} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-harlo-ink">
                {displayName}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-harlo-muted">
                {firstUserMessage?.content ?? lastMessage?.content ?? "No messages yet"}
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-harlo-muted">{formatShortTime(conversation.last_message_at)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <SmallPageBadge label={formatPageLabel(conversation.page_url)} />
            <OutcomeDot outcome={conversation.outcome} />
          </div>
        </div>
      </div>
    </button>
  );
}

function ConversationTranscript({
  businessLogoUrl,
  conversation,
  detailTab,
  onDetailTabChange
}: {
  businessLogoUrl?: string | null;
  conversation: InboxConversationRow;
  detailTab: DetailTab;
  onDetailTabChange: (tab: DetailTab) => void;
}) {
  const displayName = getConversationDisplayName(conversation);
  const botName = conversation.bot_name ?? "Harlo";
  const accent = conversation.bot_accent ?? "#087f95";

  return (
    <section className="flex min-h-0 min-w-0 flex-col border-b border-harlo-line bg-white xl:border-b-0 xl:border-r">
      <header className="shrink-0 border-b border-harlo-line px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <ConversationAvatar name={displayName} accent={accent} large />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-semibold text-harlo-ink">{displayName}</h2>
                <OutcomeBadge outcome={conversation.outcome} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-harlo-muted">
                {conversation.lead?.email ? (
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <Mail size={14} />
                    <span className="truncate">{conversation.lead.email}</span>
                  </span>
                ) : null}
                {conversation.lead ? (
                  getLeadPhone(conversation.lead) ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone size={14} />
                      {getLeadPhone(conversation.lead)}
                    </span>
                  ) : null
                ) : null}
                <span>{formatPageLabel(conversation.page_url)}</span>
              </div>
            </div>
          </div>
          <AgentBadge name={botName} type={conversation.agent_type} accent={accent} />
        </div>

        <div className="mt-4 flex items-center gap-5">
          <TranscriptTab active={detailTab === "chat"} label="Chat" onClick={() => onDetailTabChange("chat")} />
          <TranscriptTab active={detailTab === "details"} label="Details" onClick={() => onDetailTabChange("details")} />
          <TranscriptTab active={detailTab === "activity"} label="Activity" onClick={() => onDetailTabChange("activity")} />
        </div>
      </header>

      {detailTab === "chat" ? (
        <div className="min-h-0 flex-1 overflow-auto bg-white px-5 py-5">
          <div className="mb-5 text-center text-xs font-medium text-harlo-muted">Started {formatDateTime(conversation.created_at)}</div>
          {conversation.messages.map((message) => (
            <MessageBubble key={message.id} message={message} botName={botName} businessLogoUrl={businessLogoUrl} accent={accent} visitorName={displayName} />
          ))}
        </div>
      ) : detailTab === "details" ? (
        <ConversationDetails conversation={conversation} />
      ) : (
        <ConversationActivity conversation={conversation} />
      )}
    </section>
  );
}

function TranscriptTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative h-8 text-sm font-semibold transition",
        active ? "text-harlo-teal" : "text-harlo-muted hover:text-harlo-ink"
      )}
    >
      {label}
      {active ? <span className="absolute inset-x-0 -bottom-[9px] h-0.5 rounded-full bg-harlo-teal" /> : null}
    </button>
  );
}

function ConversationDetails({ conversation }: { conversation: InboxConversationRow }) {
  const lead = conversation.lead;
  const retrievals = getUniqueRetrievals(conversation);

  return (
    <div className="min-h-0 flex-1 overflow-auto p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <DetailCard label="Page" value={formatPageLabel(conversation.page_url)} icon={<Globe2 size={16} />} />
        <DetailCard label="Started" value={formatDateTime(conversation.created_at)} icon={<Clock3 size={16} />} />
        <DetailCard label="Last message" value={formatDateTime(conversation.last_message_at)} icon={<MessageSquare size={16} />} />
        <DetailCard label="Messages" value={String(conversation.messages.length)} icon={<Activity size={16} />} />
      </div>
      {lead ? (
        <div className="mt-5 rounded-lg border border-harlo-line bg-white p-4">
          <h3 className="text-sm font-semibold text-harlo-ink">Lead capture</h3>
          <div className="mt-3 space-y-3">
            <KeyValue label="Name" value={lead.name} />
            <KeyValue label="Email" value={lead.email} />
            {getLeadPhone(lead) ? <KeyValue label="Phone" value={getLeadPhone(lead)!} /> : null}
            {getLeadMetadataItems(lead).map((item) => (
              <KeyValue key={item.key} label={item.label} value={item.value} />
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-5 rounded-lg border border-harlo-line bg-white p-4">
        <h3 className="text-sm font-semibold text-harlo-ink">Sources used</h3>
        {retrievals.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {retrievals.map((retrieval, index) => (
              <span key={`${retrieval.sourceTitle}-${index}`} className="inline-flex items-center gap-1 rounded-lg bg-harlo-mist px-2 py-1 text-xs font-medium text-harlo-teal">
                {retrieval.sourceTitle}
                {typeof retrieval.similarity === "number" ? <span>{Math.round(retrieval.similarity * 100)}%</span> : null}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-harlo-muted">No retrieval metadata was saved for this conversation.</p>
        )}
      </div>
    </div>
  );
}

function ConversationActivity({ conversation }: { conversation: InboxConversationRow }) {
  const events = [
    { title: "Conversation started", description: formatDateTime(conversation.created_at) },
    ...conversation.messages.map((message) => ({
      title: message.role === "assistant" ? "Assistant replied" : message.role === "user" ? "Visitor sent a message" : "System message saved",
      description: formatDateTime(message.created_at)
    })),
    ...(conversation.lead ? [{ title: "Lead captured", description: formatDateTime(conversation.lead.created_at) }] : [])
  ];

  return (
    <div className="min-h-0 flex-1 overflow-auto p-5">
      <ol className="space-y-4">
        {events.map((event, index) => (
          <li key={`${event.title}-${event.description}-${index}`} className="flex gap-3">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-harlo-teal" />
            <span>
              <span className="block text-sm font-semibold text-harlo-ink">{event.title}</span>
              <span className="mt-1 block text-sm text-harlo-muted">{event.description}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ConversationInsightPanel({ conversation }: { conversation: InboxConversationRow }) {
  const quality = getAnswerQuality(conversation);
  const retrievals = getUniqueRetrievals(conversation);
  const lead = conversation.lead;

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-harlo-line p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-harlo-ink">
          <Star size={16} className="text-harlo-teal" />
          AI Answer Quality
        </div>
        <div className="mt-5 flex items-center gap-4">
          <QualityRing score={quality.score} />
          <div>
            <p className="font-semibold text-harlo-teal">{quality.label}</p>
            <p className="mt-1 text-sm leading-6 text-harlo-muted">{quality.description}</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-5">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-harlo-ink">Sources used ({retrievals.length})</h3>
          </div>
          {retrievals.length > 0 ? (
            <div className="mt-3 space-y-2">
              {retrievals.slice(0, 6).map((retrieval, index) => (
                <div key={`${retrieval.sourceTitle}-${index}`} className="rounded-lg border border-harlo-line bg-harlo-canvas p-3">
                  <p className="truncate text-sm font-medium text-harlo-ink">{retrieval.sourceTitle}</p>
                  {typeof retrieval.similarity === "number" ? (
                    <p className="mt-1 text-xs text-harlo-muted">{formatPercent(retrieval.similarity)} match</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-harlo-line bg-harlo-canvas p-3 text-sm leading-6 text-harlo-muted">
              No source metadata was saved for this answer.
            </p>
          )}
        </section>

        <section className="mt-6 border-t border-harlo-line pt-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-harlo-ink">Lead capture</h3>
            {lead ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Captured</Badge> : null}
          </div>
          {lead ? (
            <div className="mt-3 space-y-3 text-sm">
              <CheckedValue label="Name" value={lead.name} />
              <CheckedValue label="Email" value={lead.email} />
              {getLeadPhone(lead) ? <CheckedValue label="Phone" value={getLeadPhone(lead)!} /> : null}
              {getLeadMetadataItems(lead).slice(0, 4).map((item) => (
                <CheckedValue key={item.key} label={item.label} value={item.value} />
              ))}
              <a
                href={getLeadHref(lead)}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-harlo-line bg-white px-3 text-sm font-semibold text-harlo-ink transition hover:border-harlo-teal hover:text-harlo-teal"
              >
                Open lead
                <ExternalLink size={14} />
              </a>
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-harlo-line bg-harlo-canvas p-3 text-sm leading-6 text-harlo-muted">
              No lead was captured for this conversation.
            </p>
          )}
        </section>
      </div>
    </aside>
  );
}

function MessageBubble({
  businessLogoUrl,
  message,
  botName,
  accent,
  visitorName
}: {
  businessLogoUrl?: string | null;
  message: InboxMessageRow;
  botName: string;
  accent: string;
  visitorName: string;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("mb-5 flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? <AssistantAvatar logoUrl={businessLogoUrl} accent={accent} botName={botName} /> : null}
      <div className={cn("flex max-w-[78%] flex-col", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-[10px] px-3 py-[11px] text-sm leading-[1.5]",
            isUser
              ? "bg-harlo-teal text-white"
              : "bg-[#f4f4f4] text-harlo-ink"
          )}
        >
          <FormattedMessageContent content={message.content} />
        </div>
        <div className={cn("mt-1 text-[11px] text-harlo-muted", isUser ? "text-right" : "text-left")}>
          {isUser ? visitorName : botName} - {formatShortTime(message.created_at)}
        </div>
        {!isUser ? (
          <div className="mt-2 flex justify-start gap-1 text-harlo-muted">
            <ThumbsUp size={13} />
            <ThumbsDown size={13} />
          </div>
        ) : null}
      </div>
      {isUser ? <ConversationAvatar name={visitorName} accent={accent} /> : null}
    </div>
  );
}

function AssistantAvatar({ accent, botName, logoUrl }: { accent: string; botName: string; logoUrl?: string | null }) {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <span className="grid h-full w-full place-items-center text-white" style={{ backgroundColor: accent }}>
          <Sparkles size={15} aria-label={botName} />
        </span>
      )}
    </span>
  );
}

function FormattedMessageContent({ content }: { content: string }) {
  const lines = String(content || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length === 0) {
      return;
    }

    nodes.push(
      <ul key={`list-${nodes.length}`} className="my-[7px] list-disc space-y-[3px] pl-[22px]">
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`} className="pl-0.5">
            {item}
          </li>
        ))}
      </ul>
    );
    listItems = [];
  }

  lines.forEach((line, index) => {
    const bullet = line.match(/^(?:[-*]\s+)(.+)$/);
    const nextLine = lines[index + 1] || "";
    const previousLine = lines[index - 1] || "";
    const looksLikeImplicitList =
      !/[.!?]$/.test(line) &&
      (
        /:\s*$/.test(previousLine) ||
        listItems.length > 0 ||
        (/^(?:[A-Z][a-z]+(?:\s+[a-z]+){0,4})(?::|\s+starts\s+at|\s+-)/.test(line) && !/^(Sure|Hi|Hello|Thanks|If|I\b|You\b|Acme\b)/.test(line)) ||
        (/^(?:Your|Preferred|Property)\b/.test(line) && !/[.!?]$/.test(line))
      ) &&
      !/:\s*$/.test(line) &&
      nextLine !== "";

    if (bullet || looksLikeImplicitList) {
      listItems.push(bullet ? bullet[1] : line);
      return;
    }

    flushList();
    nodes.push(
      <p key={`paragraph-${nodes.length}`} className="mb-2 last:mb-0">
        {line}
      </p>
    );
  });

  flushList();

  if (nodes.length === 0) {
    return <>{content}</>;
  }

  return <>{nodes}</>;
}

function DetailCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-harlo-line bg-white p-4">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-harlo-muted">
        <span className="text-harlo-teal">{icon}</span>
        {label}
      </p>
      <p className="mt-3 text-sm font-semibold text-harlo-ink">{value}</p>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
      <dt className="text-harlo-muted">{label}</dt>
      <dd className="min-w-0 text-right font-semibold text-harlo-ink">{value}</dd>
    </div>
  );
}

function CheckedValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-harlo-muted">{label}</p>
        <p className="mt-0.5 truncate font-semibold text-harlo-ink">{value}</p>
      </div>
      <CheckCircle2 size={15} className="mt-1 shrink-0 text-emerald-600" />
    </div>
  );
}

function ConversationAvatar({ name, accent, large = false }: { name: string; accent?: string | null; large?: boolean }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full text-xs font-semibold text-white",
        large ? "h-12 w-12 text-sm" : "h-8 w-8"
      )}
      style={{ backgroundColor: accent ?? "#087f95" }}
    >
      {getInitials(name)}
    </span>
  );
}

function QualityRing({ score }: { score: number }) {
  return (
    <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#087f95 ${score}%, #e2e8ee 0)` }}>
      <div className="grid h-14 w-14 place-items-center rounded-full bg-white">
        <div className="text-center">
          <p className="text-xl font-semibold leading-none text-harlo-teal">{score}</p>
          <p className="text-[10px] text-harlo-muted">of 100</p>
        </div>
      </div>
    </div>
  );
}

function SmallPageBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-[150px] items-center rounded-md bg-harlo-mist px-2 py-0.5 text-[11px] font-medium text-harlo-teal">
      <span className="truncate">{label}</span>
    </span>
  );
}

function OutcomeDot({ outcome }: { outcome: InboxConversationRow["outcome"] }) {
  const className = outcome === "Needs review"
    ? "bg-amber-500"
    : outcome === "Lead captured"
      ? "bg-harlo-teal"
      : "bg-emerald-500";

  return <span className={cn("h-2 w-2 shrink-0 rounded-full", className)} aria-label={outcome} />;
}

function OutcomeBadge({ outcome }: { outcome: InboxConversationRow["outcome"] }) {
  if (outcome === "Lead captured") {
    return (
      <Badge className="w-fit whitespace-nowrap border-harlo-teal/25 bg-harlo-mist text-harlo-teal">
        <CheckCircle2 size={12} />
        Lead captured
      </Badge>
    );
  }

  if (outcome === "Needs review") {
    return (
      <Badge className="w-fit whitespace-nowrap border-amber-200 bg-amber-50 text-amber-700">
        <AlertCircle size={12} />
        Needs review
      </Badge>
    );
  }

  return (
    <Badge className="w-fit whitespace-nowrap border-emerald-200 bg-emerald-50 text-emerald-700">
      <CheckCircle2 size={12} />
      Resolved
    </Badge>
  );
}

type RetrievalSummary = {
  sourceTitle: string;
  similarity?: number;
};

function getUniqueRetrievals(conversation: InboxConversationRow): RetrievalSummary[] {
  const map = new Map<string, RetrievalSummary>();

  conversation.messages.flatMap((message) => getRetrievals(message)).forEach((retrieval) => {
    const key = retrieval.sourceTitle;
    const current = map.get(key);

    if (!current || (retrieval.similarity ?? 0) > (current.similarity ?? 0)) {
      map.set(key, retrieval);
    }
  });

  return Array.from(map.values()).sort((first, second) => (second.similarity ?? 0) - (first.similarity ?? 0));
}

function getRetrievals(message: InboxMessageRow): RetrievalSummary[] {
  const retrieval = message.metadata?.retrieval;

  if (!Array.isArray(retrieval)) {
    return [];
  }

  return retrieval.reduce<RetrievalSummary[]>((current, item) => {
    if (!item || typeof item !== "object") {
      return current;
    }

    const record = item as Record<string, unknown>;

    current.push({
      sourceTitle: typeof record.sourceTitle === "string" ? record.sourceTitle : "Knowledge source",
      similarity: typeof record.similarity === "number" ? record.similarity : undefined
    });

    return current;
  }, []);
}

function getAnswerQuality(conversation: InboxConversationRow) {
  const retrievals = getUniqueRetrievals(conversation);
  const averageSimilarity = retrievals.length > 0
    ? retrievals.reduce((total, retrieval) => total + (retrieval.similarity ?? 0), 0) / retrievals.length
    : 0;
  const outcomeScore = conversation.outcome === "Needs review" ? 55 : conversation.outcome === "Lead captured" ? 94 : 90;
  const sourceScore = retrievals.length > 0 ? Math.round(averageSimilarity * 100) : outcomeScore;
  const score = Math.max(0, Math.min(100, Math.round((outcomeScore * 0.65) + (sourceScore * 0.35))));

  if (conversation.outcome === "Needs review") {
    return {
      score,
      label: "Needs review",
      description: "Fallback metadata was saved, so this answer may need source improvement."
    };
  }

  if (score >= 90) {
    return {
      score,
      label: "Excellent",
      description: "Accurate and helpful response based on saved conversation signals."
    };
  }

  return {
    score,
    label: "Good",
    description: "Response is complete, with room to improve source coverage."
  };
}

function getLeadHref(lead: LeadRow) {
  const params = new URLSearchParams();

  if (lead.bot_id) {
    params.set("agent", lead.bot_id);
  }

  params.set("lead", lead.id);

  return `/dashboard/leads?${params.toString()}`;
}

function getLeadPhone(lead: LeadRow) {
  for (const key of ["phone", "phone_number", "mobile", "tel"]) {
    const value = lead.metadata[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function getLeadMetadataItems(lead: LeadRow) {
  return Object.entries(lead.metadata)
    .filter(([key, value]) => typeof value === "string" && !key.endsWith("_label") && !key.endsWith("_type"))
    .map(([key, value]) => ({
      key,
      value: value as string,
      label: typeof lead.metadata[`${key}_label`] === "string" ? lead.metadata[`${key}_label`] as string : formatMetadataLabel(key)
    }));
}

function getConversationDisplayName(conversation: InboxConversationRow) {
  const leadName = conversation.lead?.name?.trim();
  return leadName && leadName.length > 0 ? leadName : getVisitorLabel();
}

function getVisitorLabel() {
  return "Visitor";
}

function getPageKey(value: string | null) {
  if (!value) {
    return "unknown";
  }

  try {
    const url = new URL(value);
    return `${url.host}${url.pathname}`;
  } catch {
    return value;
  }
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

function formatMetadataLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatShortTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase() || "VS";
}
