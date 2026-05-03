"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToastViewport, useToast } from "@/components/ui/toast";

type SourceActionsProps = {
  source: {
    id: string;
    name: string;
    source_type: string;
    metadata: Record<string, unknown>;
  };
};

type ApiResult = {
  error?: string;
  chunks?: number;
};

export function SourceActions({ source }: SourceActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState(source.name);
  const [content, setContent] = useState(typeof source.metadata.content === "string" ? source.metadata.content : "");
  const { toast, showToast, dismissToast } = useToast();
  const isManual = source.source_type === "manual";

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

  async function handleDelete() {
    if (!window.confirm(`Delete "${source.name}" from Harlo's knowledge base?`)) {
      return;
    }

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
    router.refresh();
  }

  if (isEditing) {
    return (
      <div className="md:col-span-4">
        <ToastViewport toast={toast} onDismiss={dismissToast} />
        <div className="mt-2 space-y-3 rounded-lg border border-harlo-line bg-harlo-canvas p-4">
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
          ) : (
            <p className="text-sm text-harlo-muted">URL and file re-sync editing will come next. For now, you can rename or delete this source.</p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
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
    <div className="flex justify-end gap-2">
      <ToastViewport toast={toast} onDismiss={dismissToast} />
      <Button type="button" variant="ghost" className="px-3" onClick={() => setIsEditing(true)}>
        <Pencil size={15} />
        Edit
      </Button>
      <Button type="button" variant="ghost" className="px-3 text-red-600 hover:text-red-700" onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
        Delete
      </Button>
    </div>
  );
}
