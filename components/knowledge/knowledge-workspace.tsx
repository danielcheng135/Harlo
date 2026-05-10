"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Globe2,
  Loader2,
  Plus,
  UploadCloud
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SourceActions } from "@/components/knowledge/source-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ToastViewport, useToast } from "@/components/ui/toast";
import type { KnowledgeSourceRow } from "@/lib/harlo/data";

type SourceMode = "url" | "manual" | "file";

type ApiResult = {
  error?: string;
  sourceId?: string;
  chunks?: number;
  pages?: number;
  status?: "pending" | "processing" | "ready" | "failed";
};

export function KnowledgeWorkspace({
  brandLogoUrl,
  sources
}: {
  brandLogoUrl: string | null;
  sources: KnowledgeSourceRow[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<SourceMode>("url");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [crawlingSourceIds, setCrawlingSourceIds] = useState<Set<string>>(() => new Set());
  const { toast, showToast, dismissToast } = useToast();
  const stats = useMemo(() => getStats(sources), [sources]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    const submittedMode = mode;
    const submittedName = submittedMode === "url" ? name.trim() || url.trim() : name.trim() || "Manual knowledge";

    try {
      const response = submittedMode === "file"
        ? await submitFileSource()
        : await submitJsonSource();
      const result = (await response.json().catch(() => null)) as ApiResult | null;

      if (!response.ok) {
        showToast("error", result?.error ?? "Could not ingest source.");
        return;
      }

      setName("");
      setUrl("");
      setContent("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (submittedMode === "url" && result?.status === "pending" && result.sourceId) {
        setIsPending(false);
        setCrawlingSourceIds((current) => new Set(current).add(result.sourceId!));
        showToast("info", "Website source added. Crawling has started and may take a while.");
        router.refresh();
        await crawlSource(result.sourceId, submittedName);
        return;
      }

      const detail = submittedMode === "url" && result?.pages
        ? `${result.pages} page${result.pages === 1 ? "" : "s"}, ${result.chunks ?? 0} chunks`
        : `${result?.chunks ?? 0} chunks`;
      showToast("success", `Source is ready: ${detail}.`);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function crawlSource(sourceId: string, sourceName: string) {
    try {
      const response = await fetch(`/api/knowledge-sources/${sourceId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          action: "sync",
          name: sourceName
        })
      });
      const result = (await response.json().catch(() => null)) as ApiResult | null;

      if (!response.ok) {
        showToast("error", result?.error ?? "Could not crawl website source.");
        router.refresh();
        return;
      }

      const pageText = result?.pages ? `${result.pages} page${result.pages === 1 ? "" : "s"}, ` : "";
      showToast("success", `Website crawled with ${pageText}${result?.chunks ?? 0} chunks.`);
      router.refresh();
    } finally {
      setCrawlingSourceIds((current) => {
        const next = new Set(current);
        next.delete(sourceId);
        return next;
      });
    }
  }
  function submitJsonSource() {
    return fetch("/api/knowledge-sources", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(mode === "url"
        ? {
          sourceType: "url",
          name: name.trim() || url.trim(),
          url
        }
        : {
          sourceType: "manual",
          name: name.trim() || "Manual knowledge",
          content
        })
    });
  }

  function submitFileSource() {
    const formData = new FormData();

    if (file) {
      formData.set("file", file);
    }

    formData.set("name", name.trim() || file?.name || "Uploaded knowledge");

    return fetch("/api/knowledge-sources", {
      method: "POST",
      body: formData
    });
  }

  function selectFile(nextFile: File | null) {
    setFile(nextFile);

    if (nextFile && !name.trim()) {
      setName(nextFile.name.replace(/\.[^.]+$/, ""));
    }
  }

  function handleFileDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDraggingFile(false);
    selectFile(event.dataTransfer.files.item(0));
  }

  const canSubmit = mode === "url"
    ? url.trim().length > 0
    : mode === "manual"
      ? content.trim().length >= 40
      : Boolean(file);

  return (
    <div className="space-y-6">
      <ToastViewport toast={toast} onDismiss={dismissToast} />
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge>RAG knowledge base</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">Knowledge</h1>
          <p className="mt-2 max-w-2xl text-harlo-muted">
            Add trusted website, file, and manual knowledge that Harlo retrieves before answering visitors.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Sources" value={stats.total.toString()} detail={`${stats.ready} ready`} icon={<BookOpen size={18} />} />
        <StatCard label="Chunks" value={stats.chunks.toString()} detail="Available for retrieval" icon={<CheckCircle2 size={18} />} />
        <StatCard label="Web pages" value={stats.pages.toString()} detail="Crawled from URLs" icon={<Globe2 size={18} />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader>
            <h2 className="text-lg font-semibold text-harlo-ink">Add source</h2>
            <p className="mt-1 text-sm text-harlo-muted">Choose the source type and Harlo will chunk, embed, and store it.</p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-3 rounded-lg border border-harlo-line bg-harlo-canvas p-1">
              <ModeButton active={mode === "url"} onClick={() => setMode("url")} icon={<Globe2 size={15} />} label="URL" />
              <ModeButton active={mode === "manual"} onClick={() => setMode("manual")} icon={<BookOpen size={15} />} label="Manual" />
              <ModeButton active={mode === "file"} onClick={() => setMode("file")} icon={<FileText size={15} />} label="File" />
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {mode === "url" ? (
                <>
                  <label className="block">
                    <span className="text-sm font-medium text-harlo-ink">Website URL</span>
                    <input
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      required
                      type="url"
                      className="mt-2 h-11 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none transition focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/15"
                      placeholder="https://example.com"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-harlo-ink">Source name</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="mt-2 h-11 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none transition focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/15"
                      placeholder="Website FAQ"
                    />
                  </label>
                  <p className="rounded-lg bg-harlo-mist px-3 py-2 text-sm leading-6 text-harlo-teal">
                    Harlo crawls the page, sitemap links, and same-domain links up to 8 readable pages.
                  </p>
                </>
              ) : null}

              {mode === "manual" ? (
                <>
                  <label className="block">
                    <span className="text-sm font-medium text-harlo-ink">Source name</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      className="mt-2 h-11 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none transition focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/15"
                      placeholder="Services FAQ"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-harlo-ink">Knowledge</span>
                    <textarea
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      required
                      minLength={40}
                      rows={10}
                      className="mt-2 w-full resize-y rounded-lg border border-harlo-line bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/15"
                      placeholder="Paste services, pricing, policies, hours, booking rules, or FAQs."
                    />
                  </label>
                </>
              ) : null}

              {mode === "file" ? (
                <>
                  <label className="block">
                    <span className="text-sm font-medium text-harlo-ink">Source name</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="mt-2 h-11 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none transition focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/15"
                      placeholder={file?.name ?? "Uploaded knowledge"}
                    />
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md,.markdown,.csv,.json,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv,text/html,application/json"
                    className="hidden"
                    onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleFileDrop}
                    className={`flex min-h-36 w-full flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center transition ${
                      isDraggingFile
                        ? "border-harlo-teal bg-harlo-mist shadow-sm"
                        : "border-harlo-line bg-harlo-canvas hover:border-harlo-teal/60 hover:bg-harlo-mist/60"
                    }`}
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-white text-harlo-teal shadow-sm">
                      <UploadCloud size={20} />
                    </span>
                    <span className="mt-3 text-sm font-semibold text-harlo-ink">{file ? file.name : "Choose or drop a file"}</span>
                    <span className="mt-1 text-xs text-harlo-muted">PDF, DOCX, TXT, Markdown, CSV, JSON, or HTML up to 10MB</span>
                  </button>
                </>
              ) : null}

              <Button type="submit" disabled={isPending || !canSubmit} className="w-full">
                {isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                {isPending ? "Ingesting source..." : "Add to knowledge base"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card className="flex min-h-[420px] max-h-[calc(100vh-360px)] flex-col overflow-hidden">
          <CardHeader className="shrink-0 flex flex-col gap-3 border-b border-harlo-line sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-harlo-ink">Sources</h2>
              <p className="mt-1 text-sm text-harlo-muted">Manage the information Harlo can retrieve.</p>
            </div>
            <Badge>{stats.ready}/{stats.total} Ready</Badge>
          </CardHeader>
          <CardBody className="min-h-0 flex-1 overflow-y-auto p-0">
            {sources.length === 0 ? (
              <div className="p-8 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                  <BookOpen size={20} />
                </span>
                <p className="mt-4 font-semibold text-harlo-ink">No knowledge sources yet</p>
                <p className="mt-2 text-sm leading-6 text-harlo-muted">Add a website, file, or manual source to start powering RAG answers.</p>
              </div>
            ) : sources.map((source) => (
              <SourceRow
                key={source.id}
                brandLogoUrl={brandLogoUrl}
                source={source}
                isCrawling={crawlingSourceIds.has(source.id)}
              />
            ))}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function SourceRow({
  brandLogoUrl,
  source,
  isCrawling
}: {
  brandLogoUrl: string | null;
  source: KnowledgeSourceRow;
  isCrawling: boolean;
}) {
  const Icon = source.source_type === "file" ? FileText : source.source_type === "url" ? Globe2 : BookOpen;
  const chunkCount = typeof source.metadata.chunk_count === "number" ? source.metadata.chunk_count : 0;
  const pageCount = typeof source.metadata.page_count === "number" ? source.metadata.page_count : null;

  return (
    <div className="grid gap-4 border-b border-harlo-line p-5 last:border-b-0 xl:grid-cols-[minmax(0,1fr)_110px_96px_120px] xl:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-harlo-mist text-harlo-teal">
          <SourceLogo brandLogoUrl={brandLogoUrl} source={source} fallbackIcon={Icon} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-harlo-ink">{source.name}</p>
          <p className="mt-1 truncate text-xs text-harlo-muted">{sourceSubtitle(source)}</p>
        </div>
      </div>
      <div className="text-sm text-harlo-muted">
        <span className="font-medium text-harlo-ink">{chunkCount}</span> chunks
        {pageCount ? <span className="block text-xs">{pageCount} pages</span> : null}
      </div>
      <StatusBadge status={source.status} />
      <SourceActions source={source} isCrawling={isCrawling} />
    </div>
  );
}

function SourceLogo({
  brandLogoUrl,
  source,
  fallbackIcon: Icon
}: {
  brandLogoUrl: string | null;
  source: KnowledgeSourceRow;
  fallbackIcon: LucideIcon;
}) {
  const logoCandidates = useMemo(() => getSourceLogoCandidates(source, brandLogoUrl), [source, brandLogoUrl]);
  const [logoIndex, setLogoIndex] = useState(0);
  const logoUrl = logoCandidates[logoIndex] ?? null;

  if (source.source_type === "url" && logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="h-full w-full object-contain p-1.5"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setLogoIndex((current) => current + 1)}
      />
    );
  }

  return <Icon size={18} />;
}

function StatCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-harlo-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-harlo-ink">{value}</p>
          <p className="mt-2 text-sm text-harlo-muted">{detail}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
          {icon}
        </span>
      </div>
    </Card>
  );
}

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition ${
        active ? "bg-white text-harlo-ink shadow-sm" : "text-harlo-muted hover:text-harlo-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusClass = status === "ready"
    ? "bg-harlo-mist text-harlo-teal"
    : status === "failed"
      ? "bg-red-50 text-red-700"
      : "bg-amber-50 text-amber-700";

  return <Badge className={`w-fit capitalize ${statusClass}`}>{capitalize(status)}</Badge>;
}

function sourceSubtitle(source: KnowledgeSourceRow) {
  if (source.source_type === "url" && typeof source.metadata.url === "string") {
    return source.metadata.url;
  }

  if (source.source_type === "file" && typeof source.metadata.file_name === "string") {
    return source.metadata.file_name;
  }

  return `${capitalize(source.source_type)} · ${new Date(source.created_at).toLocaleDateString()}`;
}

function getSourceLogoCandidates(source: KnowledgeSourceRow, brandLogoUrl: string | null) {
  if (source.source_type !== "url") {
    return [];
  }

  const metadataLogoUrl = getMetadataString(source.metadata, [
    "logo_url",
    "logoUrl",
    "favicon_url",
    "faviconUrl",
    "icon_url",
    "iconUrl",
    "brand_logo_url",
    "brandLogoUrl",
    "og_logo",
    "ogLogo"
  ]);
  const sourceUrl = getMetadataString(source.metadata, ["url", "source_url", "sourceUrl"]);
  const fallbackIcons = getUrlIconCandidates(sourceUrl);

  return Array.from(new Set([
    metadataLogoUrl,
    ...fallbackIcons,
    brandLogoUrl
  ].filter((value): value is string => Boolean(value))));
}

function getMetadataString(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function getUrlIconCandidates(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const origin = new URL(withProtocol).origin;
    return [`${origin}/apple-touch-icon.png`, `${origin}/favicon.ico`];
  } catch {
    return [];
  }
}

function getStats(sources: KnowledgeSourceRow[]) {
  return sources.reduce((stats, source) => {
    stats.total += 1;
    stats.ready += source.status === "ready" ? 1 : 0;
    stats.chunks += typeof source.metadata.chunk_count === "number" ? source.metadata.chunk_count : 0;
    stats.pages += typeof source.metadata.page_count === "number" ? source.metadata.page_count : 0;
    return stats;
  }, { total: 0, ready: 0, chunks: 0, pages: 0 });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
