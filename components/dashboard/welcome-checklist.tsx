"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Rocket,
  Sparkles
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { KnowledgeSourceRow } from "@/lib/harlo/data";

type WelcomeChecklistProps = {
  organizationId: string;
  sources: KnowledgeSourceRow[];
  initialDoneIds: string[];
};

type ChecklistItem = {
  id: "knowledge" | "assistant" | "widget";
  title: string;
  body: string;
  href: Route;
  autoDone?: boolean;
  icon: LucideIcon;
};

export function WelcomeChecklist({ organizationId, sources, initialDoneIds }: WelcomeChecklistProps) {
  const [hasLoadedStoredState, setHasLoadedStoredState] = useState(false);
  const [manualDoneIds, setManualDoneIds] = useState<string[]>(() => sanitizeDoneIds(initialDoneIds));
  const storageKey = `harlo:launch-checklist:${organizationId}`;
  const websiteSource = sources.find((source) => source.source_type === "url");
  const sourceStatus = websiteSource?.status ?? "pending";
  const items = useMemo<ChecklistItem[]>(() => {
    const sourceLabel = sourceStatus === "ready" ? "Website knowledge is ready" : sourceStatus === "failed" ? "Review website knowledge" : "Website crawl is running";
    const sourceBody = sourceStatus === "failed"
      ? "The workspace is ready, but your first website crawl needs attention in Knowledge."
      : sourceStatus === "ready"
        ? "Your first website source is available for grounded answers."
        : "Harlo is still indexing the first website source in the background.";

    return [
      {
        id: "knowledge",
        title: sourceLabel,
        body: sourceBody,
        href: "/dashboard/knowledge",
        icon: BookOpen,
        autoDone: sourceStatus === "ready"
      },
      {
        id: "assistant",
        title: "Tune your assistant",
        body: "Review the greeting, lead fields, tone, and fallback behavior before launch.",
        href: "/dashboard/builder",
        icon: Sparkles
      },
      {
        id: "widget",
        title: "Install the widget",
        body: "Copy one snippet into your site when you are ready to go live.",
        href: "/dashboard/widget",
        icon: Rocket
      }
    ];
  }, [sourceStatus]);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      setHasLoadedStoredState(true);
      return;
    }

    try {
      const parsedValue = JSON.parse(storedValue);
      if (Array.isArray(parsedValue)) {
        setManualDoneIds((currentIds) => mergeDoneIds(currentIds, parsedValue));
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }

    setHasLoadedStoredState(true);
  }, [storageKey]);

  useEffect(() => {
    if (hasLoadedStoredState) {
      window.localStorage.setItem(storageKey, JSON.stringify(manualDoneIds));
      void persistDoneIds(organizationId, manualDoneIds);
    }
  }, [hasLoadedStoredState, manualDoneIds, organizationId, storageKey]);

  const doneIds = new Set([
    ...manualDoneIds,
    ...items.filter((item) => item.autoDone).map((item) => item.id)
  ]);
  const isComplete = items.every((item) => doneIds.has(item.id));

  if (!hasLoadedStoredState) {
    return null;
  }

  if (isComplete) {
    return null;
  }

  function toggleDone(itemId: ChecklistItem["id"]) {
    setManualDoneIds((currentIds) => {
      if (currentIds.includes(itemId)) {
        return currentIds.filter((id) => id !== itemId);
      }

      return [...currentIds, itemId];
    });
  }

  return (
    <Card className="overflow-hidden border-harlo-teal/30 bg-gradient-to-br from-white via-harlo-soft to-harlo-mist p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge>Welcome</Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-harlo-ink">Finish your launch checklist.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-harlo-muted">
            This stays on Overview until each item is complete or you mark it done.
          </p>
        </div>
        <Link
          href="/dashboard/widget"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-harlo-ink px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
        >
          Continue setup <ArrowRight className="ml-2" size={16} />
        </Link>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isDone = doneIds.has(item.id);

          return (
            <div
              key={item.id}
              className={`rounded-lg border bg-white/85 p-4 transition ${
                isDone ? "border-harlo-teal/30" : "border-harlo-line hover:border-harlo-teal/50 hover:bg-white"
              }`}
            >
              <div className="flex gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                  isDone ? "bg-harlo-teal text-white" : "bg-harlo-mist text-harlo-teal"
                }`}>
                  {isDone ? <CheckCircle2 size={17} /> : <Icon size={17} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-harlo-ink">{item.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-harlo-muted">{item.body}</span>
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={item.href}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-harlo-line bg-white px-3 text-sm font-semibold text-harlo-ink transition hover:border-harlo-teal/60"
                >
                  Open
                </Link>
                {!item.autoDone ? (
                  <button
                    type="button"
                    onClick={() => toggleDone(item.id)}
                    className={`inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold transition ${
                      isDone
                        ? "bg-harlo-mist text-harlo-teal hover:bg-harlo-mist/70"
                        : "bg-harlo-ink text-white hover:-translate-y-0.5"
                    }`}
                  >
                    {isDone ? "Marked done" : "Mark done"}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function sanitizeDoneIds(value: unknown) {
  return Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .filter((id): id is string => id === "knowledge" || id === "assistant" || id === "widget")
    )
  );
}

function mergeDoneIds(currentIds: string[], storedIds: unknown[]) {
  return sanitizeDoneIds([...currentIds, ...storedIds]);
}

async function persistDoneIds(organizationId: string, doneIds: string[]) {
  await fetch("/api/dashboard/launch-checklist", {
    method: "PATCH",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      organizationId,
      doneIds: sanitizeDoneIds(doneIds)
    })
  }).catch(() => null);
}
