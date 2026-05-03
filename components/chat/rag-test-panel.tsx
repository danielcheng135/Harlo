"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type RagTestPanelProps = {
  botId: string;
};

type ChatResult = {
  conversationId: string;
  answer: string;
  fallback: boolean;
  leadCaptured?: boolean;
  retrieval: Array<{
    sourceTitle: string;
    similarity?: number;
  }>;
};

export function RagTestPanel({ botId }: RagTestPanelProps) {
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [result, setResult] = useState<ChatResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        botId,
        conversationId,
        message,
        visitor: {
          anonymousId: "dashboard-test",
          pageUrl: "/dashboard/builder"
        }
      })
    });

    const payload = (await response.json().catch(() => null)) as (ChatResult & { error?: string }) | null;

    if (!response.ok) {
      setError(payload?.error ?? "Could not generate an answer.");
      setIsPending(false);
      return;
    }

    setResult(payload);
    setConversationId(payload?.conversationId);
    setMessage("");
    setIsPending(false);
  }

  return (
    <div className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-harlo-ink">Test RAG answer</h2>
      <p className="mt-1 text-xs text-harlo-muted">Ask a question using the knowledge you ingested.</p>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          className="h-10 min-w-0 flex-1 rounded-lg border border-harlo-line px-3 text-sm outline-none focus:border-harlo-teal"
          placeholder="Ask about pricing, hours, services..."
        />
        <Button className="h-10 w-10 px-0" disabled={isPending} aria-label="Send test question">
          {isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
        </Button>
      </form>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-harlo-mist p-3 text-sm leading-6 text-harlo-ink">
            {result.answer}
          </div>
          <div className="text-xs text-harlo-muted">
            {result.leadCaptured
              ? "Lead captured and saved to the Leads dashboard."
              : result.retrieval.length > 0
              ? `Retrieved ${result.retrieval.length} source${result.retrieval.length === 1 ? "" : "s"}: ${result.retrieval.map((item) => item.sourceTitle).join(", ")}`
              : "No matching source found; fallback answer used."}
          </div>
        </div>
      ) : null}
    </div>
  );
}
