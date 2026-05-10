"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock3, Mail, MessageSquare, Search, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { InboxConversationRow, InboxMessageRow } from "@/lib/harlo/data";
import { cn, formatPercent } from "@/lib/utils";

type ConversationHistoryProps = {
  conversations: InboxConversationRow[];
  initialConversationId?: string;
  botName: string;
  accent: string;
};

export function ConversationHistory({ conversations, initialConversationId, botName, accent }: ConversationHistoryProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialConversationId ?? conversations[0]?.id ?? "");

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const searchableMessages = conversation.messages.map((message) => message.content).join(" ");
      const leadText = conversation.lead ? `${conversation.lead.name} ${conversation.lead.email}` : "";

      return [
        formatPageLabel(conversation.page_url),
        searchableMessages,
        conversation.outcome,
        leadText
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [conversations, query]);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ?? filteredConversations[0] ?? conversations[0] ?? null;
  const totalMessages = conversations.reduce((total, conversation) => total + conversation.messages.length, 0);
  const averageMessages = conversations.length > 0 ? Math.round(totalMessages / conversations.length) : 0;
  const answeredCount = conversations.filter((conversation) => conversation.outcome === "Answered").length;
  const resolutionRate = conversations.length > 0 ? answeredCount / conversations.length : 0;

  function selectConversation(conversationId: string) {
    setSelectedId(conversationId);
    window.history.pushState(null, "", `/dashboard/conversations?conversation=${conversationId}`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="grid shrink-0 gap-3 md:grid-cols-3">
        <HistoryStat label="Total messages" value={totalMessages.toString()} />
        <HistoryStat label="Avg. thread length" value={`${averageMessages} msgs`} />
        <HistoryStat label="Resolution rate" value={formatPercent(resolutionRate)} />
      </div>

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm xl:grid-cols-[380px_1fr]">
        <aside className="flex min-h-0 flex-col border-b border-harlo-line bg-harlo-canvas/40 xl:border-b-0 xl:border-r">
          <div className="shrink-0 border-b border-harlo-line bg-white p-4">
            <label className="flex h-10 items-center gap-3 rounded-lg border border-harlo-line bg-white px-3 text-sm text-harlo-muted focus-within:border-harlo-teal">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-harlo-muted"
                placeholder="Search transcripts"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-3">
            {filteredConversations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-harlo-line bg-white p-5 text-sm text-harlo-muted">
                No conversations match that search.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={conversation.id === selectedConversation?.id}
                    onSelect={() => selectConversation(conversation.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {selectedConversation ? (
          <ConversationTranscript conversation={selectedConversation} botName={botName} accent={accent} />
        ) : (
          <div className="grid min-h-0 place-items-center p-8 text-center">
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

function HistoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-harlo-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-harlo-ink">{value}</p>
    </div>
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

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border bg-white p-3 text-left transition hover:border-harlo-teal hover:shadow-sm",
        isSelected ? "border-harlo-teal shadow-sm ring-1 ring-harlo-teal/10" : "border-harlo-line"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-harlo-ink">{formatPageLabel(conversation.page_url)}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-harlo-muted">
            {firstUserMessage?.content ?? lastMessage?.content ?? "No messages yet"}
          </p>
        </div>
        <OutcomeBadge outcome={conversation.outcome} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-harlo-muted">
        <span>{conversation.messages.length} messages</span>
        <span>{formatDateTime(conversation.last_message_at)}</span>
      </div>
    </button>
  );
}

function ConversationTranscript({ conversation, botName, accent }: { conversation: InboxConversationRow; botName: string; accent: string }) {
  const retrievals = conversation.messages.flatMap((message) => getRetrievals(message));

  return (
    <section className="grid min-h-0 xl:grid-cols-[1fr_300px]">
      <div className="flex min-h-0 min-w-0 flex-col">
        <header className="shrink-0 border-b border-harlo-line bg-white p-5">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-harlo-ink">{formatPageLabel(conversation.page_url)}</h2>
              <p className="mt-1 text-sm text-harlo-muted">
                Started {formatDateTime(conversation.created_at)} · {conversation.visitor_id ? "Known visitor" : "Anonymous visitor"}
              </p>
            </div>
            <OutcomeBadge outcome={conversation.outcome} />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto bg-white p-5">
          {conversation.messages.map((message) => (
            <MessageBubble key={message.id} message={message} botName={botName} accent={accent} />
          ))}
        </div>
      </div>

      <aside className="flex min-h-0 flex-col gap-5 overflow-hidden border-t border-harlo-line bg-harlo-canvas p-5 xl:border-l xl:border-t-0">
        <section className="shrink-0">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-harlo-ink">
            <UserRound size={15} className="text-harlo-teal" />
            Visitor
          </div>
          <div className="rounded-lg border border-harlo-line bg-white p-3 text-sm">
            <p className="font-semibold text-harlo-ink">{conversation.visitor_id ? "Known visitor" : "Anonymous visitor"}</p>
            {conversation.lead ? (
              <p className="mt-2 flex min-w-0 items-center gap-2 text-harlo-muted">
                <Mail size={14} />
                <span className="truncate">{conversation.lead.email}</span>
              </p>
            ) : (
              <p className="mt-2 text-harlo-muted">No lead profile linked.</p>
            )}
          </div>
        </section>

        <section className="min-h-0 flex-1">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-harlo-ink">
            <MessageSquare size={15} className="text-harlo-teal" />
            Sources Used
          </div>
          <div className="min-h-0 max-h-full overflow-auto pr-1">
            {retrievals.length > 0 ? (
              <div className="space-y-2">
                {retrievals.slice(0, 10).map((retrieval, index) => (
                  <div key={`${retrieval.sourceTitle}-${index}`} className="rounded-lg border border-harlo-line bg-white p-3">
                    <p className="text-sm font-medium text-harlo-ink">{retrieval.sourceTitle}</p>
                    {typeof retrieval.similarity === "number" ? (
                      <p className="mt-1 text-xs text-harlo-muted">{formatPercent(retrieval.similarity)} match</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-harlo-line bg-white p-3 text-sm leading-6 text-harlo-muted">
                No retrieval metadata was saved for this conversation.
              </p>
            )}
          </div>
        </section>
      </aside>
    </section>
  );
}

function MessageBubble({
  message,
  botName,
  accent
}: {
  message: InboxMessageRow;
  botName: string;
  accent: string;
}) {
  const isUser = message.role === "user";
  const accentText = getReadableTextColor(accent);

  return (
    <>
      <div
        className={cn(
          "block w-fit max-w-[86%] whitespace-normal rounded-[10px] px-3 py-[11px] text-sm leading-[1.45]",
          isUser ? "mb-4 ml-auto" : "mb-1 border border-harlo-line bg-slate-100 text-harlo-ink"
        )}
        style={isUser ? { backgroundColor: accent, color: accentText } : undefined}
      >
        <FormattedMessageContent content={message.content} />
      </div>
      {!isUser ? (
        <div className="mb-4 ml-0.5 max-w-[86%] text-[11px] text-[#7c8986]">
          {botName} · {formatDateTime(message.created_at)}
        </div>
      ) : null}
    </>
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
    const bullet = line.match(/^(?:[-*•]\s+)(.+)$/);
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
    <Badge className="w-fit whitespace-nowrap border-harlo-line bg-white text-harlo-muted">
      <Clock3 size={12} />
      Answered
    </Badge>
  );
}

type RetrievalSummary = {
  sourceTitle: string;
  similarity?: number;
};

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

function getReadableTextColor(color: string) {
  const normalized = color.replace("#", "");

  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return "#ffffff";
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.62 ? "#111827" : "#ffffff";
}
