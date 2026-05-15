"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Pencil, RefreshCw, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToastViewport, useToast } from "@/components/ui/toast";

type SourceActionsProps = {
  source: {
    id: string;
    name: string;
    source_type: string;
    status: string;
    metadata: Record<string, unknown>;
  };
  isCrawling?: boolean;
};

type ApiResult = {
  error?: string;
  chunks?: number;
};

export function SourceActions({ source, isCrawling = false }: SourceActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [name, setName] = useState(source.name);
  const [content, setContent] = useState(typeof source.metadata.content === "string" ? source.metadata.content : "");
  const { toast, showToast, dismissToast } = useToast();
  const isManual = source.source_type === "manual";
  const isUrl = source.source_type === "url";
  const syncLabel = source.status === "ready" ? "Sync" : "Crawl";
  const isSyncActionLoading = isSyncing || isCrawling || source.status === "processing";

  useEffect(() => {
    setIsEditing(false);
    setName(source.name);
    setContent(typeof source.metadata.content === "string" ? source.metadata.content : "");
  }, [source.id, source.name, source.metadata]);

  async function handleSave() {
    setIsSaving(true);
    const response = await fetch(`/api/knowledge-sources/${source.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name,
        ...(isManual ? { content } : {})
      })
    });
    const result = (await response.json().catch(() => null)) as ApiResult | null;

    if (!response.ok) {
      showToast("error", result?.error ?? "Could not update source.");
      setIsSaving(false);
      return;
    }

    showToast("success", isManual ? `Source updated with ${result?.chunks ?? 0} chunks.` : "Source renamed.");
    setIsSaving(false);
    setIsEditing(false);
    router.refresh();
  }

  async function handleSync() {
    setIsSyncing(true);
    showToast("info", `${syncLabel} started. This may take a while.`);
    const response = await fetch(`/api/knowledge-sources/${source.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        action: "sync",
        name
      })
    });
    const result = (await response.json().catch(() => null)) as (ApiResult & { pages?: number }) | null;

    if (!response.ok) {
      showToast("error", result?.error ?? "Could not sync website source.");
      setIsSyncing(false);
      return;
    }

    const pageText = result?.pages ? `${result.pages} page${result.pages === 1 ? "" : "s"}, ` : "";
    showToast("success", `Website synced with ${pageText}${result?.chunks ?? 0} chunks.`);
    setIsSyncing(false);
    setIsEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    setIsDeleting(true);
    const response = await fetch(`/api/knowledge-sources/${source.id}`, {
      method: "DELETE"
    });
    const result = (await response.json().catch(() => null)) as ApiResult | null;

    if (!response.ok) {
      showToast("error", result?.error ?? "Could not delete source.");
      setIsDeleting(false);
      return;
    }

    showToast("success", "Source deleted.");
    setIsDeleting(false);
    setShowDeleteDialog(false);
    router.refresh();
  }

  const deleteDialog = showDeleteDialog ? (
    <div className="fixed inset-0 z-50 grid place-items-center bg-harlo-ink/20 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={`delete-source-${source.id}`}>
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-harlo-line bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-harlo-line p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600">
            <AlertTriangle size={18} />
          </span>
          <div className="min-w-0">
            <h2 id={`delete-source-${source.id}`} className="text-lg font-semibold text-harlo-ink">Delete knowledge source?</h2>
            <p className="mt-1 text-sm leading-6 text-harlo-muted">
              This removes <span className="font-semibold text-harlo-ink">{source.name}</span> and its retrieval chunks from the chatbot.
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 p-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
            Keep source
          </Button>
          <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
            Delete source
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  if (isEditing) {
    return (
      <div className="xl:col-span-4 xl:col-start-1">
        <ToastViewport toast={toast} onDismiss={dismissToast} />
        {deleteDialog}
        <div className="space-y-3 rounded-lg border border-harlo-line bg-harlo-canvas p-4">
          <label className="block">
            <span className="text-sm font-semibold text-harlo-ink">Source name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none focus:border-harlo-teal"
            />
          </label>
          {isManual ? (
            <label className="block">
              <span className="text-sm font-semibold text-harlo-ink">Manual knowledge</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={8}
                className="mt-2 w-full resize-y rounded-lg border border-harlo-line bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-harlo-teal"
                placeholder="Paste the updated business knowledge."
              />
              {!content ? (
                <span className="mt-2 block text-xs text-harlo-muted">
                  No stored source text was found for this older manual source. Paste the current version to update it.
                </span>
              ) : null}
            </label>
          ) : null}
          <div className="flex items-center justify-end gap-1.5">
            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
              <X size={15} />
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving || !name.trim() || (isManual && content.trim().length < 40)}>
              {isSaving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
              Save source
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <ToastViewport toast={toast} onDismiss={dismissToast} />
      {deleteDialog}
      {isUrl ? (
        <IconButton label={syncLabel} onClick={handleSync} disabled={isSyncActionLoading}>
          {isSyncActionLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
        </IconButton>
      ) : null}
      <IconButton label="Edit" onClick={() => setIsEditing(true)}>
        <Pencil size={16} />
      </IconButton>
      <IconButton label="Delete" tone="danger" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
        {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
      </IconButton>
    </div>
  );
}

function IconButton({
  label,
  children,
  onClick,
  disabled,
  tone = "default"
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`group relative grid h-9 w-9 place-items-center rounded-lg border border-transparent text-sm transition focus:outline-none focus:ring-2 focus:ring-harlo-teal focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        tone === "danger"
          ? "text-red-600 hover:border-red-100 hover:bg-red-50 hover:text-red-700"
          : "text-harlo-muted hover:border-harlo-line hover:bg-harlo-mist hover:text-harlo-ink"
      }`}
    >
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 translate-y-1 rounded-md bg-harlo-ink px-2 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
        {label}
      </span>
    </button>
  );
}
