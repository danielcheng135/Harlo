"use client";

import { useEffect, useMemo, useState, type DragEvent, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Code2,
  Download,
  ExternalLink,
  Globe2,
  Loader2,
  MessageSquare,
  PhoneCall,
  Search,
  SlidersHorizontal,
  Table2,
  Trash2,
  UserRound,
  Workflow
} from "lucide-react";
import { AgentBadge } from "@/components/agent-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ToastViewport, useToast } from "@/components/ui/toast";
import type { LeadRow } from "@/lib/harlo/data";
import { cn } from "@/lib/utils";

type LeadsWorkspaceProps = {
  leads: LeadRow[];
  initialLeadId?: string;
  activeAgentId?: string;
  page: number;
  pageSize: number;
  totalCount: number;
};

type LeadView = "table" | "pipeline" | "activity";
type StageFilter = "all" | "new" | "contacted";

export function LeadsWorkspace({ leads, initialLeadId, activeAgentId, page, pageSize, totalCount }: LeadsWorkspaceProps) {
  const [items, setItems] = useState(leads);
  const [loadedTotal, setLoadedTotal] = useState(totalCount);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialLeadId ?? leads[0]?.id ?? "");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [view, setView] = useState<LeadView>("table");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const { toast, showToast, dismissToast } = useToast();

  useEffect(() => {
    setItems(leads);
    setLoadedTotal(totalCount);
    setSelectedId((current) => {
      if (initialLeadId && leads.some((lead) => lead.id === initialLeadId)) {
        return initialLeadId;
      }

      return leads.some((lead) => lead.id === current) ? current : leads[0]?.id ?? "";
    });
    setSelectedRows(new Set());
  }, [initialLeadId, leads, totalCount]);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((lead) => {
      const metadata = getLeadMetadataItems(lead);
      const source = getLeadSource(lead);
      const stage = getLeadStage(lead);
      const queryMatches = !normalizedQuery || [
        lead.name,
        lead.email,
        getLeadPhone(lead) ?? "",
        getLeadCompany(lead) ?? "",
        lead.question,
        lead.status,
        source.label,
        lead.bot_name ?? "",
        lead.agent_type ?? "",
        ...metadata.map((item) => item.value)
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
      const stageMatches = stageFilter === "all" || stageFilter === stage;

      return queryMatches && stageMatches;
    });
  }, [items, query, stageFilter]);

  const totalPages = Math.max(1, Math.ceil(loadedTotal / pageSize));
  const pagedLeads = filteredLeads;
  const selectedLead =
    filteredLeads.find((lead) => lead.id === selectedId) ??
    filteredLeads[0] ??
    items.find((lead) => lead.id === selectedId) ??
    items[0] ??
    null;
  const selectedLeadIds = new Set(pagedLeads.map((lead) => lead.id));
  const selectedOnPage = pagedLeads.filter((lead) => selectedRows.has(lead.id)).length;
  const newCount = items.filter((lead) => getLeadStage(lead) === "new").length;
  const contactedCount = items.filter((lead) => lead.status === "contacted").length;

  async function updateLeadStatus(leadId: string, status: "new" | "contacted") {
    const previousLead = items.find((lead) => lead.id === leadId);

    if (!previousLead || getLeadStage(previousLead) === status) {
      return true;
    }

    setSavingId(leadId);
    setItems((current) => current.map((lead) => lead.id === leadId ? { ...lead, status } : lead));

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
        setItems((current) => current.map((lead) => lead.id === leadId ? previousLead : lead));
        showToast("error", result.error ?? "Could not update lead.");
        return false;
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
      return true;
    } catch {
      setItems((current) => current.map((lead) => lead.id === leadId ? previousLead : lead));
      showToast("error", "Could not update lead.");
      return false;
    } finally {
      setSavingId(null);
    }
  }

  async function deleteSelectedLeads() {
    const leadIds = [...selectedRows];

    if (leadIds.length === 0) {
      return;
    }

    setBulkDeleting(true);

    try {
      const response = await fetch("/api/leads/bulk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ leadIds })
      });
      const result = await response.json() as { error?: string; deletedIds?: string[]; failedIds?: string[] };
      const deletedIds = new Set(result.deletedIds ?? []);

      if (deletedIds.size > 0) {
        setItems((current) => {
          const next = current.filter((lead) => !deletedIds.has(lead.id));

          if (deletedIds.has(selectedId)) {
            setSelectedId(next[0]?.id ?? "");
          }

          return next;
        });
        setLoadedTotal((current) => Math.max(0, current - deletedIds.size));
        setSelectedRows((current) => {
          const next = new Set(current);
          deletedIds.forEach((leadId) => next.delete(leadId));
          return next;
        });
      }

      const allSelectedLeadsDeleted =
        response.ok &&
        deletedIds.size === leadIds.length &&
        leadIds.every((leadId) => deletedIds.has(leadId));

      if (!allSelectedLeadsDeleted) {
        showToast("error", result.error ?? "Could not delete selected leads.");
        return;
      }

      setBulkDeleteOpen(false);
      showToast("success", `${deletedIds.size} ${deletedIds.size === 1 ? "lead" : "leads"} deleted.`);
    } catch {
      showToast("error", "Could not delete selected leads.");
    } finally {
      setBulkDeleting(false);
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
      setLoadedTotal((current) => Math.max(0, current - 1));
      setSelectedRows((current) => {
        const next = new Set(current);
        next.delete(lead.id);
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

  function toggleSelectedRow(lead: LeadRow) {
    selectLead(lead.id);
    setSelectedRows((current) => {
      const next = new Set(current);

      if (next.has(lead.id)) {
        next.delete(lead.id);
      } else {
        next.add(lead.id);
      }

      return next;
    });
  }

  function selectLead(leadId: string) {
    setSelectedId(leadId);
    const params = new URLSearchParams();

    if (activeAgentId) {
      params.set("agent", activeAgentId);
    }

    if (page > 1) {
      params.set("page", String(page));
    }

    params.set("lead", leadId);
    window.history.pushState(null, "", `/dashboard/leads?${params.toString()}`);
  }

  function togglePageSelection() {
    setSelectedRows((current) => {
      const next = new Set(current);
      const allSelected = pagedLeads.length > 0 && pagedLeads.every((lead) => next.has(lead.id));

      pagedLeads.forEach((lead) => {
        if (allSelected) {
          next.delete(lead.id);
        } else {
          next.add(lead.id);
        }
      });

      return next;
    });
  }

  function exportLeads() {
    const csv = buildLeadCsv(filteredLeads);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "harlo-leads.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-harlo-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ViewTab active={view === "table"} icon={<Table2 size={15} />} label="Table" count={items.length} onClick={() => setView("table")} />
        <ViewTab active={view === "pipeline"} icon={<Workflow size={15} />} label="Pipeline" count={items.length} onClick={() => setView("pipeline")} />
        <ViewTab active={view === "activity"} icon={<Activity size={15} />} label="Activity" count={items.length} onClick={() => setView("activity")} />
      </div>

      <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
          <label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-harlo-line bg-white px-3 text-sm text-harlo-muted focus-within:border-harlo-teal">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-harlo-muted"
              placeholder="Search leads..."
            />
          </label>

          <Select
            name="stage"
            value={stageFilter}
            onValueChange={(value) => setStageFilter(value as StageFilter)}
            options={[
              { value: "all", label: "All stages" },
              { value: "new", label: "New" },
              { value: "contacted", label: "Contacted" }
            ]}
            className="[&>button]:h-10"
          />

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-harlo-line bg-white px-3 text-sm font-semibold text-harlo-ink transition hover:border-harlo-teal hover:text-harlo-teal"
            onClick={() => {
              setQuery("");
              setStageFilter("all");
            }}
          >
            <SlidersHorizontal size={15} />
            Clear filters
          </button>
        </div>

        <button
          type="button"
          onClick={exportLeads}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-harlo-line bg-white px-3 text-sm font-semibold text-harlo-ink transition hover:border-harlo-teal hover:text-harlo-teal"
        >
          <Download size={15} />
          Export
        </button>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-harlo-line px-4 py-3">
            <p className="text-sm font-semibold text-harlo-ink">
              {query || stageFilter !== "all" ? `${filteredLeads.length} matching on this page` : `${loadedTotal} leads`}
            </p>
            {selectedRows.size > 0 ? (
              <div className="flex items-center gap-3">
                <p className="text-xs font-medium text-harlo-teal">{selectedRows.size} selected</p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setBulkDeleteOpen(true)}
                  className="h-8 border-red-200 px-2.5 text-xs text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={14} />
                  Delete
                </Button>
              </div>
            ) : (
              <p className="text-xs text-harlo-muted">
                {newCount} new / {contactedCount} contacted
              </p>
            )}
          </div>

          {filteredLeads.length === 0 ? (
            <div className="grid min-h-0 flex-1 place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                  <UserRound size={20} />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-harlo-ink">No leads match your filters</h2>
                <p className="mt-2 text-sm text-harlo-muted">Adjust the search or stage filter to see more leads.</p>
              </div>
            </div>
          ) : view === "table" ? (
            <LeadTable
              leads={pagedLeads}
              selectedId={selectedLead?.id}
              selectedRows={selectedRows}
              selectedOnPage={selectedOnPage}
              pageCount={selectedLeadIds.size}
              onSelect={(lead) => selectLead(lead.id)}
              onToggleRow={toggleSelectedRow}
              onTogglePage={togglePageSelection}
            />
          ) : view === "pipeline" ? (
            <PipelineView
              leads={filteredLeads}
              selectedId={selectedLead?.id}
              savingId={savingId}
              onSelect={(lead) => selectLead(lead.id)}
              onUpdateStatus={updateLeadStatus}
            />
          ) : (
            <ActivityView leads={filteredLeads} selectedId={selectedLead?.id} onSelect={(lead) => selectLead(lead.id)} />
          )}

          <div className="flex shrink-0 flex-col gap-3 border-t border-harlo-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-harlo-muted">
              <span>Rows per page</span>
              <span className="inline-flex h-9 items-center rounded-lg border border-harlo-line bg-white px-3 font-semibold text-harlo-ink">
                {pageSize}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <p className="text-sm text-harlo-muted">
                {items.length === 0 ? `0 of ${loadedTotal}` : `${(page - 1) * pageSize + 1}-${Math.min((page - 1) * pageSize + items.length, loadedTotal)} of ${loadedTotal}`}
              </p>
              <div className="flex items-center gap-1">
                <a
                  href={getLeadsPageHref(page - 1, activeAgentId)}
                  aria-disabled={page === 1}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg border border-harlo-line text-harlo-muted transition hover:border-harlo-teal hover:text-harlo-teal",
                    page === 1 && "pointer-events-none opacity-40"
                  )}
                  aria-label="Previous page"
                >
                  <ChevronDown size={16} className="rotate-90" />
                </a>
                <span className="grid h-9 min-w-9 place-items-center rounded-lg bg-harlo-mist px-3 text-sm font-semibold text-harlo-teal">
                  {page}
                </span>
                <a
                  href={getLeadsPageHref(page + 1, activeAgentId)}
                  aria-disabled={page >= totalPages}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg border border-harlo-line text-harlo-muted transition hover:border-harlo-teal hover:text-harlo-teal",
                    page >= totalPages && "pointer-events-none opacity-40"
                  )}
                  aria-label="Next page"
                >
                  <ChevronDown size={16} className="-rotate-90" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <LeadDetailPanel
          lead={selectedLead}
          savingId={savingId}
          deletingId={deletingId}
          onUpdateStatus={updateLeadStatus}
          onDelete={setDeleteTarget}
        />
      </div>

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

      {bulkDeleteOpen && selectedRows.size > 0 ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-harlo-ink/35 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="bulk-delete-leads-title">
          <div className="w-full max-w-md rounded-xl border border-harlo-line bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <AlertTriangle size={20} />
              </span>
              <div className="min-w-0">
                <h3 id="bulk-delete-leads-title" className="text-lg font-semibold text-harlo-ink">
                  Delete {selectedRows.size} selected {selectedRows.size === 1 ? "lead" : "leads"}?
                </h3>
                <p className="mt-2 text-sm leading-6 text-harlo-muted">
                  The selected leads will be removed. Their related conversations will stay in conversation history.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>
                Keep leads
              </Button>
              <Button
                type="button"
                onClick={deleteSelectedLeads}
                disabled={bulkDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {bulkDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {bulkDeleting ? "Deleting..." : "Delete selected"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

function ViewTab({
  active,
  icon,
  label,
  count,
  onClick
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex h-11 items-center gap-2 px-2 text-sm font-semibold transition",
        active ? "text-harlo-teal" : "text-harlo-muted hover:text-harlo-ink"
      )}
    >
      <span className={cn("grid h-7 w-7 place-items-center rounded-lg", active ? "bg-harlo-mist" : "bg-transparent")}>{icon}</span>
      {label}
      <span className={cn("rounded-full px-1.5 py-0.5 text-[11px]", active ? "bg-harlo-mist text-harlo-teal" : "bg-harlo-canvas text-harlo-muted")}>
        {count}
      </span>
      {active ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-harlo-teal" /> : null}
    </button>
  );
}

function LeadTable({
  leads,
  selectedId,
  selectedRows,
  selectedOnPage,
  pageCount,
  onSelect,
  onToggleRow,
  onTogglePage
}: {
  leads: LeadRow[];
  selectedId?: string;
  selectedRows: Set<string>;
  selectedOnPage: number;
  pageCount: number;
  onSelect: (lead: LeadRow) => void;
  onToggleRow: (lead: LeadRow) => void;
  onTogglePage: () => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="space-y-3 p-3 md:hidden">
        {leads.map((lead) => (
          <LeadMobileCard
            key={lead.id}
            checked={selectedRows.has(lead.id)}
            lead={lead}
            selected={selectedId === lead.id}
            onSelect={() => onSelect(lead)}
            onToggle={() => onToggleRow(lead)}
          />
        ))}
      </div>
      <table className="hidden min-w-[920px] w-full border-separate border-spacing-0 text-left text-sm md:table">
        <thead className="sticky top-0 z-10 bg-white text-xs font-semibold text-harlo-muted">
          <tr>
            <th className="w-10 border-b border-harlo-line px-4 py-3">
              <button
                type="button"
                onClick={onTogglePage}
                className={cn(
                  "grid h-5 w-5 place-items-center rounded border transition",
                  selectedOnPage === pageCount && pageCount > 0
                    ? "border-harlo-teal bg-harlo-teal text-white"
                    : selectedOnPage > 0
                      ? "border-harlo-teal bg-harlo-mist text-harlo-teal"
                      : "border-harlo-line bg-white text-white"
                )}
                aria-label="Select page"
              >
                {selectedOnPage > 0 ? <Check size={13} /> : null}
              </button>
            </th>
            <th className="border-b border-harlo-line px-3 py-3">Lead</th>
            <th className="border-b border-harlo-line px-3 py-3">Score</th>
            <th className="border-b border-harlo-line px-3 py-3">Stage</th>
            <th className="border-b border-harlo-line px-3 py-3">Source</th>
            <th className="border-b border-harlo-line px-3 py-3">Last question</th>
            <th className="border-b border-harlo-line px-3 py-3 text-right">Captured</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const score = getLeadScore(lead);
            const source = getLeadSource(lead);
            const selected = selectedId === lead.id;
            const checked = selectedRows.has(lead.id);

            return (
              <tr
                key={lead.id}
                onClick={() => onSelect(lead)}
                className={cn(
                  "cursor-pointer transition hover:bg-harlo-canvas/70",
                  selected ? "bg-harlo-mist/60 outline outline-1 -outline-offset-1 outline-harlo-teal" : "bg-white"
                )}
              >
                <td className="border-b border-harlo-line px-4 py-4 align-middle">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleRow(lead);
                    }}
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded border transition",
                      checked ? "border-harlo-teal bg-harlo-teal text-white" : "border-harlo-line bg-white text-white"
                    )}
                    aria-label={`Select ${lead.name}`}
                  >
                    {checked ? <Check size={13} /> : null}
                  </button>
                </td>
                <td className="border-b border-harlo-line px-3 py-4 align-middle">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-harlo-ink">{lead.name}</p>
                    <p className="mt-1 truncate text-xs text-harlo-muted">{lead.email}</p>
                    {getLeadPhone(lead) ? <p className="mt-1 truncate text-xs text-harlo-muted">{getLeadPhone(lead)}</p> : null}
                  </div>
                </td>
                <td className="border-b border-harlo-line px-3 py-4 align-middle">
                  <div className="flex items-center gap-2">
                    <MiniScore score={score} />
                    <div>
                      <p className="text-xs font-semibold text-harlo-ink">{score}</p>
                      <p className="text-[11px] text-harlo-muted">{getScoreLabel(score)}</p>
                    </div>
                  </div>
                </td>
                <td className="border-b border-harlo-line px-3 py-4 align-middle">
                  <LeadStatusBadge status={lead.status} score={score} />
                </td>
                <td className="border-b border-harlo-line px-3 py-4 align-middle">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-harlo-muted">
                    {source.icon}
                    {source.label}
                  </span>
                </td>
                <td className="max-w-[260px] border-b border-harlo-line px-3 py-4 align-middle">
                  <p className="line-clamp-2 text-sm leading-5 text-harlo-ink">{lead.question}</p>
                </td>
                <td className="border-b border-harlo-line px-3 py-4 text-right align-middle text-xs text-harlo-muted">
                  <p>{formatDate(lead.created_at)}</p>
                  <p className="mt-1">{formatTime(lead.created_at)}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LeadMobileCard({
  checked,
  lead,
  selected,
  onSelect,
  onToggle
}: {
  checked: boolean;
  lead: LeadRow;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const score = getLeadScore(lead);
  const source = getLeadSource(lead);

  return (
    <article
      className={cn(
        "w-full rounded-lg border bg-white p-3 text-left transition hover:border-harlo-teal",
        selected ? "border-harlo-teal bg-harlo-mist/50 ring-1 ring-harlo-teal/10" : "border-harlo-line"
      )}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-harlo-ink">{lead.name}</p>
            <p className="mt-1 truncate text-xs text-harlo-muted">{lead.email}</p>
            {getLeadPhone(lead) ? <p className="mt-1 truncate text-xs text-harlo-muted">{getLeadPhone(lead)}</p> : null}
          </div>
          <MiniScore score={score} />
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-5 text-harlo-ink">{lead.question}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <LeadStatusBadge status={lead.status} score={score} />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-harlo-canvas px-2.5 py-1 text-xs font-semibold text-harlo-muted">
            {source.icon}
            {source.label}
          </span>
          <span className="rounded-full bg-harlo-canvas px-2.5 py-1 text-xs font-semibold text-harlo-muted">
            {formatDate(lead.created_at)}
          </span>
        </div>
      </button>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-harlo-line pt-3">
        <span className="text-xs text-harlo-muted">Lead score {score}</span>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-lg border transition",
            checked ? "border-harlo-teal bg-harlo-teal text-white" : "border-harlo-line bg-white text-white"
          )}
          aria-label={`Select ${lead.name}`}
        >
          {checked ? <Check size={14} /> : null}
        </button>
      </div>
    </article>
  );
}

function PipelineView({
  leads,
  selectedId,
  savingId,
  onSelect,
  onUpdateStatus
}: {
  leads: LeadRow[];
  selectedId?: string;
  savingId: string | null;
  onSelect: (lead: LeadRow) => void;
  onUpdateStatus: (leadId: string, status: "new" | "contacted") => Promise<boolean>;
}) {
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<"new" | "contacted" | null>(null);
  const groups = [
    { id: "new" as const, label: "New", items: leads.filter((lead) => lead.status !== "contacted") },
    { id: "contacted" as const, label: "Contacted", items: leads.filter((lead) => lead.status === "contacted") }
  ];

  function handleDragStart(event: DragEvent<HTMLButtonElement>, leadId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", leadId);
    setDraggingLeadId(leadId);
  }

  async function handleDrop(event: DragEvent<HTMLElement>, status: "new" | "contacted") {
    event.preventDefault();
    const leadId = event.dataTransfer.getData("text/plain") || draggingLeadId;

    setDropTarget(null);
    setDraggingLeadId(null);

    if (leadId) {
      await onUpdateStatus(leadId, status);
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto p-4">
      <div className="grid min-h-full gap-3 lg:grid-cols-2">
        {groups.map((group) => (
          <section
            key={group.id}
            onDragEnter={(event) => {
              event.preventDefault();
              setDropTarget(group.id);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDropTarget(group.id);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setDropTarget((current) => current === group.id ? null : current);
              }
            }}
            onDrop={(event) => handleDrop(event, group.id)}
            className={cn(
              "flex min-h-[240px] flex-col rounded-lg border bg-harlo-canvas p-3 transition",
              dropTarget === group.id && draggingLeadId
                ? "border-harlo-teal bg-harlo-mist/70 ring-2 ring-harlo-teal/15"
                : "border-harlo-line"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-harlo-ink">{group.label}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-harlo-muted">{group.items.length}</span>
            </div>
            <div className="mt-3 flex flex-1 flex-col gap-2">
              {group.items.length === 0 ? (
                <p className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-harlo-line bg-white p-3 text-center text-xs leading-5 text-harlo-muted">
                  Drop a lead here to mark it {group.id}.
                </p>
              ) : group.items.map((lead) => (
                <button
                  type="button"
                  key={lead.id}
                  draggable={!savingId}
                  onDragStart={(event) => handleDragStart(event, lead.id)}
                  onDragEnd={() => {
                    setDraggingLeadId(null);
                    setDropTarget(null);
                  }}
                  onClick={() => onSelect(lead)}
                  className={cn(
                    "w-full cursor-grab rounded-lg border bg-white p-3 text-left transition hover:border-harlo-teal hover:shadow-sm active:cursor-grabbing",
                    draggingLeadId === lead.id && "opacity-45",
                    savingId === lead.id && "cursor-wait opacity-70",
                    selectedId === lead.id ? "border-harlo-teal ring-1 ring-harlo-teal/10" : "border-harlo-line"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-harlo-ink">{lead.name}</p>
                      <p className="mt-1 truncate text-xs text-harlo-muted">{lead.email}</p>
                    </div>
                    {savingId === lead.id ? <Loader2 size={16} className="animate-spin text-harlo-teal" /> : <MiniScore score={getLeadScore(lead)} />}
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-harlo-muted">{lead.question}</p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function ActivityView({ leads, selectedId, onSelect }: { leads: LeadRow[]; selectedId?: string; onSelect: (lead: LeadRow) => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-auto p-4">
      <div className="space-y-3">
        {leads.map((lead) => (
          <button
            type="button"
            key={lead.id}
            onClick={() => onSelect(lead)}
            className={cn(
              "grid w-full gap-3 rounded-lg border bg-white p-4 text-left transition hover:border-harlo-teal hover:shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-start",
              selectedId === lead.id ? "border-harlo-teal ring-1 ring-harlo-teal/10" : "border-harlo-line"
            )}
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
              <UserRound size={16} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-harlo-ink">{lead.name} was captured as a lead</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-harlo-muted">{lead.question}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <LeadStatusBadge status={lead.status} score={getLeadScore(lead)} />
                <AgentBadge compact name={lead.bot_name} type={lead.agent_type} accent={lead.bot_accent} />
              </div>
            </div>
            <p className="text-sm text-harlo-muted sm:text-right">{formatDateTime(lead.created_at)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function LeadDetailPanel({
  lead,
  savingId,
  deletingId,
  onUpdateStatus,
  onDelete
}: {
  lead: LeadRow | null;
  savingId: string | null;
  deletingId: string | null;
  onUpdateStatus: (leadId: string, status: "new" | "contacted") => void;
  onDelete: (lead: LeadRow) => void;
}) {
  if (!lead) {
    return (
      <aside className="grid min-h-0 place-items-center rounded-lg border border-harlo-line bg-white p-8 text-center shadow-sm">
        <div>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
            <UserRound size={20} />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-harlo-ink">Select a lead</h2>
          <p className="mt-2 text-sm text-harlo-muted">Lead details will appear here.</p>
        </div>
      </aside>
    );
  }

  const score = getLeadScore(lead);
  const source = getLeadSource(lead);
  const metadata = getLeadMetadataItems(lead);
  const phone = getLeadPhone(lead);
  const company = getLeadCompany(lead);

  return (
    <aside className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm xl:min-h-0">
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="text-center">
          <LeadAvatar name={lead.name} />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <h2 className="max-w-full truncate text-xl font-semibold text-harlo-ink">{lead.name}</h2>
            <LeadStatusBadge status={lead.status} score={score} />
          </div>
          <p className="mt-1 truncate text-sm text-harlo-muted">{lead.email}</p>
          {phone ? <p className="mt-1 text-sm text-harlo-muted">{phone}</p> : null}
          {company ? <p className="mt-1 text-sm text-harlo-muted">{company}</p> : null}
        </div>

        <div className="mt-5 rounded-lg border border-harlo-line bg-harlo-canvas p-4">
          <div className="flex items-center gap-4">
            <ScoreRing score={score} />
            <div>
              <p className="text-sm font-semibold text-harlo-teal">{getScoreLabel(score)}</p>
              <p className="mt-1 text-sm leading-6 text-harlo-muted">Lead score is calculated from captured fields, conversation context, and follow-up status.</p>
            </div>
          </div>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <DetailRow label="Stage" value={getStageLabel(lead)} />
          <DetailRow label="Source" value={source.label} />
          <DetailRow label="Captured" value={formatDateTime(lead.created_at)} />
          <DetailRow label="Agent" value={lead.bot_name ?? "Harlo"} />
          <DetailRow label="Last question" value={lead.question} link={lead.conversation_id ? getConversationHref(lead) : undefined} />
        </dl>

        <div className="mt-5 space-y-2">
          <DetailDisclosure title="Lead capture" defaultOpen>
            {metadata.length > 0 ? (
              <div className="space-y-3">
                {metadata.map((item) => (
                  <DetailRow key={item.key} label={item.label} value={item.value} />
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-harlo-muted">No additional lead fields were captured.</p>
            )}
          </DetailDisclosure>
          <DetailDisclosure title="Activity timeline">
            <ol className="space-y-3 text-sm">
              <TimelineItem title="Lead captured" description={formatDateTime(lead.created_at)} />
              {lead.conversation_id ? <TimelineItem title="Conversation linked" description="Open the conversation to review the full transcript." /> : null}
              {lead.status === "contacted" ? <TimelineItem title="Marked contacted" description="This lead is ready for follow-up reporting." /> : null}
            </ol>
          </DetailDisclosure>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-harlo-line p-4">
        {lead.conversation_id ? (
          <a
            href={getConversationHref(lead)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-harlo-teal px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-harlo-navy"
          >
            <MessageSquare size={16} />
            Open in Conversations
          </a>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] xl:grid-cols-1 2xl:grid-cols-[1fr_auto]">
          <Button
            type="button"
            variant={lead.status === "contacted" ? "secondary" : "primary"}
            disabled={savingId === lead.id}
            onClick={() => onUpdateStatus(lead.id, lead.status === "contacted" ? "new" : "contacted")}
            className={lead.status === "contacted" ? undefined : "bg-harlo-teal hover:bg-harlo-navy"}
          >
            {savingId === lead.id ? <Loader2 size={16} className="animate-spin" /> : <PhoneCall size={16} />}
            {savingId === lead.id
              ? "Saving..."
              : lead.status === "contacted"
                ? "Mark new"
                : "Mark contacted"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={deletingId === lead.id}
            onClick={() => onDelete(lead)}
            className="border-red-200 px-3 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            aria-label="Delete lead"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </aside>
  );
}

function DetailDisclosure({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-lg border border-harlo-line bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-semibold text-harlo-ink">
        {title}
        <ChevronDown size={16} className="text-harlo-muted transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-harlo-line px-3 py-3">{children}</div>
    </details>
  );
}

function DetailRow({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
      <dt className="text-harlo-muted">{label}</dt>
      <dd className="min-w-0 text-right font-semibold text-harlo-ink">
        {link ? (
          <a href={link} className="inline-flex min-w-0 items-center justify-end gap-1 text-harlo-teal hover:text-harlo-navy">
            <span className="truncate">{value}</span>
            <ExternalLink size={13} />
          </a>
        ) : (
          <span className="line-clamp-2">{value}</span>
        )}
      </dd>
    </div>
  );
}

function TimelineItem({ title, description }: { title: string; description: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-harlo-teal" />
      <span>
        <span className="block font-semibold text-harlo-ink">{title}</span>
        <span className="mt-0.5 block text-harlo-muted">{description}</span>
      </span>
    </li>
  );
}

function LeadAvatar({ name }: { name: string }) {
  return (
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-harlo-mist text-base font-semibold text-harlo-teal">
      {getInitials(name)}
    </span>
  );
}

function MiniScore({ score }: { score: number }) {
  const color = getScoreColor(score);

  return (
    <span
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 bg-white text-[11px] font-bold"
      style={{ borderColor: color, color }}
    >
      {score}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = getScoreColor(score);

  return (
    <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${score}%, #e2e8ee 0)` }}>
      <div className="grid h-14 w-14 place-items-center rounded-full bg-white">
        <div className="text-center">
          <p className="text-xl font-semibold leading-none text-harlo-teal">{score}</p>
          <p className="text-[10px] text-harlo-muted">of 100</p>
        </div>
      </div>
    </div>
  );
}

function LeadStatusBadge({ status }: { status: string; score?: number }) {
  if (status === "contacted") {
    return (
      <Badge className="w-fit border-harlo-teal/25 bg-harlo-mist text-harlo-teal">
        <CheckCircle2 size={12} />
        Contacted
      </Badge>
    );
  }

  return (
    <Badge className="w-fit border-harlo-line bg-white text-harlo-muted">
      <Circle size={12} />
      New
    </Badge>
  );
}

function getLeadScore(lead: LeadRow) {
  const metadataItems = getLeadMetadataItems(lead).filter((item) => item.value.trim().length > 0);
  let score = 42;

  if (lead.name.trim().length > 0) {
    score += 12;
  }

  if (lead.email.includes("@")) {
    score += 14;
  }

  if (getLeadPhone(lead)) {
    score += 8;
  }

  if (getLeadCompany(lead)) {
    score += 6;
  }

  if (lead.question.trim().length > 12) {
    score += 10;
  }

  if (lead.conversation_id) {
    score += 5;
  }

  score += Math.min(8, metadataItems.length * 2);

  if (lead.status === "contacted") {
    score += 3;
  }

  return Math.max(40, Math.min(100, score));
}

function getLeadStage(lead: LeadRow) {
  if (lead.status === "contacted") {
    return "contacted";
  }

  return "new";
}

function getStageLabel(lead: LeadRow) {
  const stage = getLeadStage(lead);

  if (stage === "contacted") {
    return "Contacted";
  }

  return "New";
}

function getScoreLabel(score: number) {
  if (score >= 85) {
    return "Excellent";
  }

  if (score >= 70) {
    return "Good";
  }

  if (score >= 55) {
    return "Fair";
  }

  return "Low";
}

function getScoreColor(score: number) {
  if (score >= 85) {
    return "#087f95";
  }

  if (score >= 70) {
    return "#2f9fb0";
  }

  if (score >= 55) {
    return "#d6a11f";
  }

  return "#e05252";
}

function getLeadSource(lead: LeadRow): { label: string; icon: ReactNode } {
  const rawSource = getMetadataString(lead, ["source", "lead_source", "channel", "capture_source"]);
  const source = rawSource?.toLowerCase();

  if (source?.includes("api")) {
    return { label: "API", icon: <Code2 size={14} /> };
  }

  if (source?.includes("widget")) {
    return { label: "Widget", icon: <Code2 size={14} /> };
  }

  if (source?.includes("manual")) {
    return { label: "Manual", icon: <BookOpen size={14} /> };
  }

  if (lead.conversation_id) {
    return { label: "Website", icon: <Globe2 size={14} /> };
  }

  return { label: "Manual", icon: <BookOpen size={14} /> };
}

function getLeadPhone(lead: LeadRow) {
  return getMetadataString(lead, ["phone", "phone_number", "mobile", "tel"]);
}

function getLeadCompany(lead: LeadRow) {
  return getMetadataString(lead, ["company", "company_name", "business", "organization"]);
}

function getMetadataString(lead: LeadRow, keys: string[]) {
  for (const key of keys) {
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
    .filter(([key]) => !["source", "lead_source", "channel", "capture_source"].includes(key))
    .map(([key, value]) => ({
      key,
      value: value as string,
      label: typeof lead.metadata[`${key}_label`] === "string" ? lead.metadata[`${key}_label`] as string : formatMetadataLabel(key),
      type: typeof lead.metadata[`${key}_type`] === "string" ? lead.metadata[`${key}_type`] as string : "text"
    }));
}

function buildLeadCsv(leads: LeadRow[]) {
  const headers = ["Name", "Email", "Phone", "Company", "Stage", "Status", "Source", "Question", "Captured", "Agent"];
  const rows = leads.map((lead) => [
    lead.name,
    lead.email,
    getLeadPhone(lead) ?? "",
    getLeadCompany(lead) ?? "",
    getStageLabel(lead),
    lead.status,
    getLeadSource(lead).label,
    lead.question,
    formatDateTime(lead.created_at),
    lead.bot_name ?? "Harlo"
  ]);

  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, "\"\"")}"`;
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

function getLeadsPageHref(page: number, activeAgentId?: string) {
  const params = new URLSearchParams();

  if (activeAgentId) {
    params.set("agent", activeAgentId);
  }

  params.set("page", String(Math.max(1, page)));
  return `/dashboard/leads?${params.toString()}`;
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function formatTime(value: string) {
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

  return value.slice(0, 2).toUpperCase() || "LD";
}
