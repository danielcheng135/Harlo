"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToastViewport, useToast } from "@/components/ui/toast";

export function ManualSourceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [isPending, setIsPending] = useState(false);
  const { toast, showToast, dismissToast } = useToast();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    const response = await fetch("/api/knowledge-sources", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name,
        content
      })
    });

    const result = (await response.json().catch(() => null)) as { error?: string; chunks?: number } | null;

    if (!response.ok) {
      showToast("error", result?.error ?? "Could not ingest source.");
      setIsPending(false);
      return;
    }

    setName("");
    setContent("");
    showToast("success", `Source ingested with ${result?.chunks ?? 0} chunks.`);
    setIsPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ToastViewport toast={toast} onDismiss={dismissToast} />
      <label className="block">
        <span className="text-sm font-medium text-harlo-ink">Source name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="mt-2 h-11 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none focus:border-harlo-teal"
          placeholder="Services FAQ"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-harlo-ink">Business knowledge</span>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
          minLength={40}
          rows={9}
          className="mt-2 w-full resize-y rounded-lg border border-harlo-line bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-harlo-teal"
          placeholder="Paste FAQs, service details, policies, pricing notes, hours, appointment rules, or other customer-facing information."
        />
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
        Ingest manual source
      </Button>
    </form>
  );
}
