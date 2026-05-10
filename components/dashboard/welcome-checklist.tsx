"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Rocket,
  Sparkles,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { KnowledgeSourceRow } from "@/lib/harlo/data";

type WelcomeChecklistProps = {
  organizationId: string;
  sources: KnowledgeSourceRow[];
};

type ChecklistItem = {
  id: "knowledge" | "assistant" | "widget";
  title: string;
  body: string;
  href: Route;
  autoDone?: boolean;
  icon: LucideIcon;
};

export function WelcomeChecklist({ organizationId, sources }: WelcomeChecklistProps) {
  const previousCompleteRef = useRef<boolean | null>(null);
  const [hasLoadedStoredState, setHasLoadedStoredState] = useState(false);
  const [manualDoneIds, setManualDoneIds] = useState<string[]>([]);
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
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
        setManualDoneIds(parsedValue.filter((id): id is string => typeof id === "string"));
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }

    setHasLoadedStoredState(true);
  }, [storageKey]);

  useEffect(() => {
    if (hasLoadedStoredState) {
      window.localStorage.setItem(storageKey, JSON.stringify(manualDoneIds));
    }
  }, [hasLoadedStoredState, manualDoneIds, storageKey]);

  const doneIds = new Set([
    ...manualDoneIds,
    ...items.filter((item) => item.autoDone).map((item) => item.id)
  ]);
  const isComplete = items.every((item) => doneIds.has(item.id));

  useEffect(() => {
    if (!hasLoadedStoredState) {
      return;
    }

    if (previousCompleteRef.current === null) {
      previousCompleteRef.current = isComplete;
      return;
    }

    if (isComplete && !previousCompleteRef.current) {
      setShowCompletionCelebration(true);
    }

    if (!isComplete) {
      setShowCompletionCelebration(false);
    }

    previousCompleteRef.current = isComplete;
  }, [hasLoadedStoredState, isComplete]);

  if (isComplete) {
    return showCompletionCelebration ? (
      <CompletionCelebration onDismiss={() => setShowCompletionCelebration(false)} />
    ) : null;
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

function CompletionCelebration({ onDismiss }: { onDismiss: () => void }) {
  const confettiPieces = [
    { left: "9%", top: "24%", color: "#0b8fa3", delay: "0ms", rotate: "-18deg" },
    { left: "20%", top: "13%", color: "#34d399", delay: "90ms", rotate: "14deg" },
    { left: "34%", top: "18%", color: "#fbbf24", delay: "170ms", rotate: "-8deg" },
    { left: "51%", top: "10%", color: "#38bdf8", delay: "260ms", rotate: "22deg" },
    { left: "68%", top: "19%", color: "#fb7185", delay: "130ms", rotate: "-24deg" },
    { left: "84%", top: "25%", color: "#0b8fa3", delay: "220ms", rotate: "10deg" }
  ];

  return (
    <Card className="harlo-complete-card overflow-hidden border-harlo-teal/30 bg-white p-5 pr-14 shadow-soft">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full border border-harlo-line bg-white text-harlo-muted shadow-sm transition hover:border-harlo-teal/50 hover:text-harlo-ink"
        aria-label="Dismiss completed checklist"
      >
        <X size={15} />
      </button>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-5 h-40 w-40 rounded-full bg-harlo-mist blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-cyan-100/70 blur-3xl" />
        {confettiPieces.map((piece) => (
          <span
            key={`${piece.left}-${piece.top}`}
            className="harlo-complete-confetti absolute h-2 w-7 rounded-full"
            style={{
              animationDelay: piece.delay,
              backgroundColor: piece.color,
              left: piece.left,
              top: piece.top,
              transform: `rotate(${piece.rotate})`
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="relative grid h-16 w-16 shrink-0 place-items-center">
            <span className="harlo-complete-orbit absolute inset-0 rounded-full border border-harlo-teal/20 border-t-harlo-teal" />
            <span className="harlo-complete-pop grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-harlo-teal to-cyan-500 text-white shadow-lg shadow-harlo-teal/20">
              <CheckCircle2 size={25} />
            </span>
          </span>
          <span>
            <Badge>Complete</Badge>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-harlo-ink">Launch checklist complete.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-harlo-muted">
              Your first workspace tasks are wrapped up. Harlo is ready for the next launch step.
            </p>
          </span>
        </div>

        <Link
          href="/dashboard/widget"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-harlo-ink px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
        >
          Launch widget <ArrowRight className="ml-2" size={16} />
        </Link>
      </div>

      <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-harlo-mist">
        <div className="harlo-complete-shimmer h-full rounded-full bg-gradient-to-r from-harlo-teal via-cyan-400 to-emerald-400" />
      </div>
    </Card>
  );
}
