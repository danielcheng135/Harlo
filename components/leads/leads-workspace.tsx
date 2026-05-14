"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Loader2, Mail, Maximize2, PhoneCall, Search, Trash2, UserRound } from "lucide-react";
import { AgentBadge } from "@/components/agent-badge";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LeadRow } from "@/lib/harlo/data";
import { cn } from "@/lib/utils";

type LeadsWorkspaceProps = {
  leads: LeadRow[];
};

export function LeadsWorkspace({ leads }: LeadsWorkspaceProps) {
  const [items, setItems] = useState(leads);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(leads[0]?.id ?? "");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast, showToast, dismissToast } = useToast();

  useEffect(() => {
    setItems(leads);
    setSelectedId((current) => leads.some((lead) => lead.id === current) ? current : leads[0]?.id ?? "");
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((lead) =>
      [
        lead.name,
        lead.email,
        lead.question,
        lead.status,
        lead.bot_name ?? "",
        lead.agent_type ?? "",
        ...getLeadMetadataItems(lead).map((item) => item.value)
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [items, query]);

  const selectedLead = items.find((lead) => lead.id === selectedId) ?? filteredLeads[0] ?? items[0] ?? null;
  const contactedCount = items.filter((lead) => lead.status === "contacted").length;
  const newCount = items.filter((lead) => lead.status !== "contacted").length;

  async function updateLeadStatus(leadId: string, status: "new" | "contacted") {
    setSavingId(leadId);

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      const result = await response.json() as { error?: string; lead?: LeadRow };

      if (!response.ok || !result.lead) {
        showToast("error", result.error ?? "Could not update lead.");
        return;
      }

      setItems((current) => current.map((lead) => {
        if (lead.id !== leadId) {
          return lead;
        }

        const nextLead = result.lead!;

        return {
          ...lead,
          ...nextLead,
          bot_id: nextLead.bot_id ?? lead.bot_id,
          bot_name: nextLead.bot_name ?? lead.bot_name,
          agent_type: nextLead.agent_type ?? lead.agent_type,
          bot_accent: nextLead.bot_accent ?? lead.bot_accent,
          route_patterns: nextLead.route_patterns ?? lead.route_patterns
        };
      }));
      showToast("success", status === "contacted" ? "Lead marked as contacted." : "Lead moved back to new.");
    } catch {
      showToast("error", "Could not update lead.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteLead(lead: LeadRow) {
    setDeletingId(lead.id);

    try {
      const response = await fetch("/api/leads/" + lead.id, {
        method: "DELETE"
      });
      const result = await response.json() as { error?: string };

      if (!response.ok) {
        showToast("error", result.error ?? "Could not delete lead.");
        return;
      }

      setItems((current) => {
        const next = current.filter((item) => item.id !== lead.id);

        if (selectedId === lead.id) {
          setSelectedId(next[0]?.id ?? "");
        }

        return next;
      });
      setDeleteTarget(null);
      showToast("success", "Lead deleted.");
    } catch {
      showToast("error", "Could not delete lead.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid min-h-0 flex-1 overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm xl:grid-cols-[420px_1fr]">
      <aside className="flex min-h-0 flex-col border-b border-harlo-line bg-harlo-canvas/40 xl:border-b-0 xl:border-r">
        <div className="shrink-0 space-y-4 border-b border-harlo-line bg-white p-4">
          <div className="grid grid-cols-2 gap-3">
            <LeadStat label="New" value={newCount.toString()} />
            <LeadStat label="Contacted" value={contactedCount.toString()} />
          </div>
          <label className="flex h-10 items-center gap-3 rounded-lg border border-harlo-line bg-white px-3 text-sm text-harlo-muted focus-within:border-harlo-teal">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-harlo-muted"
              placeholder="Search leads"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3">
          {filteredLeads.length === 0 ? (
            <div className="rounded-lg border border-dashed border-harlo-line bg-white p-5 text-sm text-harlo-muted">
              No leads match that search.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLeads.map((lead) => (
                <button
                  type="button"
                  key={lead.id}
                  onClick={() => setSelectedId(lead.id)}
                  className={cn(
                    "w-full rounded-lg border bg-white p-3 text-left transition hover:border-harlo-teal hover:shadow-sm",
                    lead.id === selectedLead?.id ? "border-harlo-teal shadow-sm ring-1 ring-harlo-teal/10" : "border-harlo-line"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-harlo-ink">{lead.name}</p>
                      <p className="mt-1 truncate text-xs text-harlo-muted">{lead.email}</p>
                    </div>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-harlo-muted">{lead.question}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-harlo-muted">
                    <AgentBadge
                      compact
                      name={lead.bot_name}
                      type={lead.agent_type}
                      accent={lead.bot_accent}
                      className="max-w-[70%]"
                    />
                    <span className="shrink-0">{formatDateTime(lead.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {selectedLead ? (
        <section className="flex min-h-0 flex-col">
          <header className="shrink-0 border-b border-harlo-line p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold tracking-tight text-harlo-ink">{selectedLead.name}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-harlo-muted">
                  <Mail size={15} />
                  <span className="truncate">{selectedLead.email}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AgentBadge name={selectedLead.bot_name} type={selectedLead.agent_type} accent={selectedLead.bot_accent} />
                <LeadStatusBadge status={selectedLead.status} />
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-auto p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <DetailCard icon={<UserRound size={16} />} label="Agent" value={selectedLead.bot_name ?? "Harlo"} />
              <DetailCard icon={<UserRound size={16} />} label="Lead source" value={selectedLead.conversation_id ? "Chat conversation" : "Manual capture"} />
              <DetailCard icon={<CalendarDays size={16} />} label="Captured" value={formatDateTime(selectedLead.created_at)} />
              {getLeadMetadataItems(selectedLead).map((item) => (
                <DetailCard
                  key={item.key}
                  icon={item.type === "date" ? <CalendarDays size={16} /> : <Maximize2 size={16} />}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-harlo-line bg-harlo-canvas p-5">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-harlo-muted">Question</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-harlo-ink">{selectedLead.question}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={savingId === selectedLead.id}
                onClick={() => updateLeadStatus(selectedLead.id, selectedLead.status === "contacted" ? "new" : "contacted")}
              >
                <PhoneCall size={16} />
                {savingId === selectedLead.id
                  ? "Saving..."
                  : selectedLead.status === "contacted"
                    ? "Mark new"
                    : "Mark contacted"}
              </Button>
              {selectedLead.conversation_id ? (
                <a
                  href={getConversationHref(selectedLead)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-harlo-line bg-white px-4 text-sm font-semibold text-harlo-ink transition hover:border-harlo-teal hover:text-harlo-teal"
                >
                  View conversation
                </a>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                disabled={deletingId === selectedLead.id}
                onClick={() => setDeleteTarget(selectedLead)}
                className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 size={16} />
                Delete lead
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-harlo-ink/35 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-lead-title">
          <div className="w-full max-w-md rounded-xl border border-harlo-line bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <AlertTriangle size={20} />
              </span>
              <div className="min-w-0">
                <h3 id="delete-lead-title" className="text-lg font-semibold text-harlo-ink">Delete lead?</h3>
                <p className="mt-2 text-sm leading-6 text-harlo-muted">
                  This will remove {deleteTarget.name || deleteTarget.email} from your leads. The related conversation will stay in conversation history.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deletingId === deleteTarget.id}>
                Keep lead
              </Button>
              <Button
                type="button"
                onClick={() => deleteLead(deleteTarget)}
                disabled={deletingId === deleteTarget.id}
                className="bg-red-600 hover:bg-red-700"
              >
                {deletingId === deleteTarget.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deletingId === deleteTarget.id ? "Deleting..." : "Delete lead"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

function LeadStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-harlo-line bg-harlo-canvas p-3">
      <p className="text-xs font-medium text-harlo-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-harlo-ink">{value}</p>
    </div>
  );
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

function LeadStatusBadge({ status }: { status: string }) {
  if (status === "contacted") {
    return (
      <Badge className="w-fit border-harlo-teal/25 bg-harlo-mist text-harlo-teal">
        <CheckCircle2 size={12} />
        Contacted
      </Badge>
    );
  }

  return <Badge className="w-fit capitalize">{status}</Badge>;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getLeadMetadataItems(lead: LeadRow) {
  return Object.entries(lead.metadata)
    .filter(([key, value]) => typeof value === "string" && !key.endsWith("_label") && !key.endsWith("_type"))
    .map(([key, value]) => ({
      key,
      value: value as string,
      label: typeof lead.metadata[`${key}_label`] === "string" ? lead.metadata[`${key}_label`] as string : formatMetadataLabel(key),
      type: typeof lead.metadata[`${key}_type`] === "string" ? lead.metadata[`${key}_type`] as string : "text"
    }));
}

function getConversationHref(lead: LeadRow) {
  const params = new URLSearchParams();

  if (lead.bot_id) {
    params.set("agent", lead.bot_id);
  }

  if (lead.conversation_id) {
    params.set("conversation", lead.conversation_id);
  }

  const query = params.toString();

  return query ? `/dashboard/conversations?${query}` : "/dashboard/conversations";
}

function formatMetadataLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
