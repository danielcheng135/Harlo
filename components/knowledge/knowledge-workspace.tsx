"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  ChevronDown,
  ExternalLink,
  FileText,
  Globe2,
  Info,
  Library,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Trash2,
  Upload,
  UploadCloud,
  UserRound,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToastViewport, useToast } from "@/components/ui/toast";
import type { KnowledgeChunkContentRow, KnowledgeSourceRow } from "@/lib/harlo/data";

type SourceMode = "url" | "manual" | "file";
type StatusFilter = "all" | "ready" | "processing" | "pending" | "failed";
type DetailTab = "overview" | "content";

type ApiResult = {
  error?: string;
  sourceId?: string;
  chunks?: number;
  pages?: number;
  status?: "pending" | "processing" | "ready" | "failed";
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

type ContentCard = {
  title: string;
  body: string;
  tags: string[];
};

type TestMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  retrieval?: ChatResult["retrieval"];
};

export function KnowledgeWorkspace({
  brandLogoUrl,
  botId,
  sources
}: {
  brandLogoUrl: string | null;
  botId: string;
  sources: KnowledgeSourceRow[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<SourceMode>("url");
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [selectedSourceId, setSelectedSourceId] = useState(sources[0]?.id ?? "");
  const [addModalMode, setAddModalMode] = useState<SourceMode | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chunkSearchQuery, setChunkSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [isSavingSource, setIsSavingSource] = useState(false);
  const [isSyncingSource, setIsSyncingSource] = useState(false);
  const [isDeletingSource, setIsDeletingSource] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editContent, setEditContent] = useState("");
  const [crawlingSourceIds, setCrawlingSourceIds] = useState<Set<string>>(() => new Set());
  const { toast, showToast, dismissToast } = useToast();
  const stats = useMemo(() => getStats(sources), [sources]);
  const filteredSources = useMemo(
    () => filterSources(sources, searchQuery, statusFilter),
    [sources, searchQuery, statusFilter]
  );
  const selectedSource = useMemo(
    () => sources.find((source) => source.id === selectedSourceId) ?? sources[0] ?? null,
    [selectedSourceId, sources]
  );
  const contentCards = useMemo(
    () => getContentCards(selectedSource).filter((card) => {
      const query = chunkSearchQuery.trim().toLowerCase();
      return query.length === 0 || card.title.toLowerCase().includes(query) || card.body.toLowerCase().includes(query);
    }),
    [chunkSearchQuery, selectedSource]
  );

  useEffect(() => {
    if (!selectedSource) {
      setEditName("");
      setEditContent("");
      setIsEditingSource(false);
      return;
    }

    setEditName(selectedSource.name);
    setEditContent(typeof selectedSource.metadata.content === "string" ? selectedSource.metadata.content : "");
    setIsEditingSource(false);
    setShowDeleteDialog(false);
  }, [selectedSource?.id]);

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

      resetForm();
      setAddModalMode(null);

      if (submittedMode === "url" && result?.status === "pending" && result.sourceId) {
        setIsPending(false);
        setSelectedSourceId(result.sourceId);
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

  async function handleSaveSelectedSource() {
    if (!selectedSource) {
      return;
    }

    setIsSavingSource(true);
    const response = await fetch(`/api/knowledge-sources/${selectedSource.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: editName.trim(),
        ...(selectedSource.source_type === "manual" ? { content: editContent } : {})
      })
    });
    const result = (await response.json().catch(() => null)) as ApiResult | null;

    if (!response.ok) {
      showToast("error", result?.error ?? "Could not update source.");
      setIsSavingSource(false);
      return;
    }

    showToast("success", selectedSource.source_type === "manual" ? `Source updated with ${result?.chunks ?? 0} chunks.` : "Source renamed.");
    setIsSavingSource(false);
    setIsEditingSource(false);
    router.refresh();
  }

  async function handleSyncSelectedSource() {
    if (!selectedSource || selectedSource.source_type !== "url") {
      return;
    }

    setIsSyncingSource(true);
    setCrawlingSourceIds((current) => new Set(current).add(selectedSource.id));
    showToast("info", "Sync started. This may take a while.");
    await crawlSource(selectedSource.id, selectedSource.name);
    setIsSyncingSource(false);
  }

  async function handleDeleteSelectedSource() {
    if (!selectedSource) {
      return;
    }

    setIsDeletingSource(true);
    const response = await fetch(`/api/knowledge-sources/${selectedSource.id}`, {
      method: "DELETE"
    });
    const result = (await response.json().catch(() => null)) as ApiResult | null;

    if (!response.ok) {
      showToast("error", result?.error ?? "Could not delete source.");
      setIsDeletingSource(false);
      return;
    }

    const nextSource = sources.find((source) => source.id !== selectedSource.id);
    setSelectedSourceId(nextSource?.id ?? "");
    setShowDeleteDialog(false);
    setIsDeletingSource(false);
    showToast("success", "Source deleted.");
    router.refresh();
  }

  async function crawlSource(sourceId: string, sourceName: string, quiet = false) {
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

      if (!quiet) {
        const pageText = result?.pages ? `${result.pages} page${result.pages === 1 ? "" : "s"}, ` : "";
        showToast("success", `Website crawled with ${pageText}${result?.chunks ?? 0} chunks.`);
      }
      router.refresh();
    } finally {
      setCrawlingSourceIds((current) => {
        const next = new Set(current);
        next.delete(sourceId);
        return next;
      });
    }
  }

  function openAddMode(nextMode: SourceMode) {
    setMode(nextMode);
    setAddModalMode(nextMode);
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

  function resetForm() {
    setName("");
    setUrl("");
    setContent("");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    <div className="space-y-5">
      <ToastViewport toast={toast} onDismiss={dismissToast} />
      {showDeleteDialog && selectedSource ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-harlo-ink/20 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={`delete-source-${selectedSource.id}`}>
          <div className="w-full max-w-md overflow-hidden rounded-lg border border-harlo-line bg-white shadow-2xl">
            <div className="flex items-start gap-3 border-b border-harlo-line p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600">
                <AlertTriangle size={18} />
              </span>
              <div className="min-w-0">
                <h2 id={`delete-source-${selectedSource.id}`} className="text-lg font-semibold text-harlo-ink">Delete knowledge source?</h2>
                <p className="mt-1 text-sm leading-6 text-harlo-muted">
                  This removes <span className="font-semibold text-harlo-ink">{selectedSource.name}</span> and its retrieval chunks from the chatbot.
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 p-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowDeleteDialog(false)} disabled={isDeletingSource}>
                Keep source
              </Button>
              <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={handleDeleteSelectedSource} disabled={isDeletingSource}>
                {isDeletingSource ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                Delete source
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {addModalMode ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-harlo-ink/20 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="add-knowledge-source">
          <div className="w-full max-w-lg overflow-hidden rounded-lg border border-harlo-line bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-harlo-line p-5">
              <div>
                <h2 id="add-knowledge-source" className="text-lg font-semibold text-harlo-ink">
                  {addModalMode === "url" ? "Add website URL" : addModalMode === "file" ? "Upload file" : "Add manual text"}
                </h2>
                <p className="mt-1 text-sm text-harlo-muted">Harlo will chunk, embed, and store this source for retrieval.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setAddModalMode(null);
                }}
                className="grid h-9 w-9 place-items-center rounded-lg text-harlo-muted transition hover:bg-harlo-mist hover:text-harlo-ink"
                aria-label="Close add source"
              >
                <X size={17} />
              </button>
            </div>
            <div className="p-5">
              <AddSourceForm
                canSubmit={canSubmit}
                content={content}
                file={file}
                fileInputRef={fileInputRef}
                handleFileDrop={handleFileDrop}
                handleSubmit={handleSubmit}
                isDraggingFile={isDraggingFile}
                isPending={isPending}
                mode={mode}
                name={name}
                selectFile={selectFile}
                setContent={setContent}
                setAddModalMode={setAddModalMode}
                setIsDraggingFile={setIsDraggingFile}
                setName={setName}
                setUrl={setUrl}
                url={url}
              />
            </div>
          </div>
        </div>
      ) : null}

      <header>
        <div>
          <Badge>Knowledge</Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-harlo-ink sm:text-3xl">Knowledge Source Center</h1>
          <p className="mt-2 max-w-3xl text-sm text-harlo-muted">
            Manage and optimize the knowledge sources your agents use to answer questions.
          </p>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[320px_minmax(420px,1fr)_300px] 2xl:grid-cols-[380px_minmax(460px,1fr)_360px]">
        <aside className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm xl:min-h-[780px]">
          <div className="border-b border-harlo-line p-4">
            <h2 className="text-base font-semibold text-harlo-ink">Sources</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px] xl:grid-cols-1">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-harlo-muted" size={16} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-10 w-full rounded-lg border border-harlo-line bg-white pl-10 pr-3 text-sm outline-none transition focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/15"
                  placeholder="Search sources..."
                />
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="h-10 rounded-lg border border-harlo-line bg-white px-3 text-sm text-harlo-ink outline-none transition focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/15"
              >
                <option value="all">All status</option>
                <option value="ready">Ready</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="mt-3 space-y-2">
              <AddModeButton icon={Globe2} label="Add website URL" onClick={() => openAddMode("url")} />
              <AddModeButton icon={Upload} label="Upload file" onClick={() => openAddMode("file")} />
              <AddModeButton icon={FileText} label="Add manual text" onClick={() => openAddMode("manual")} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filteredSources.length === 0 ? (
              <div className="p-6 text-center">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                  <BookOpen size={20} />
                </span>
                <p className="mt-4 font-semibold text-harlo-ink">{sources.length === 0 ? "No knowledge sources yet" : "No sources match"}</p>
                <p className="mt-2 text-sm leading-6 text-harlo-muted">
                  {sources.length === 0 ? "Add a website, file, or manual source to start powering answers." : "Try a different search or status filter."}
                </p>
              </div>
            ) : filteredSources.map((source) => (
              <SourceListItem
                key={source.id}
                brandLogoUrl={brandLogoUrl}
                isActive={selectedSource?.id === source.id}
                isCrawling={crawlingSourceIds.has(source.id)}
                onSelect={() => {
                  setSelectedSourceId(source.id);
                  setDetailTab("overview");
                }}
                source={source}
              />
            ))}
          </div>
          <div className="mt-auto px-4 py-3 text-right text-sm text-harlo-muted">
            {filteredSources.length} source{filteredSources.length === 1 ? "" : "s"}
          </div>
        </aside>

        <main className="min-w-0 rounded-lg border border-harlo-line bg-white shadow-sm">
          {selectedSource ? (
            <>
              <div className="border-b border-harlo-line p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-harlo-mist text-harlo-teal">
                      <SourceLogo brandLogoUrl={brandLogoUrl} source={selectedSource} fallbackIcon={getSourceIcon(selectedSource)} />
                    </span>
                    <div className="min-w-0 flex-1">
                      {isEditingSource ? (
                        <div className="max-w-xl space-y-3">
                          <label className="block">
                            <span className="text-sm font-semibold text-harlo-ink">Source name</span>
                            <input
                              value={editName}
                              onChange={(event) => setEditName(event.target.value)}
                              className="mt-2 h-10 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none transition focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/15"
                            />
                          </label>
                          {selectedSource.source_type === "manual" ? (
                            <label className="block">
                              <span className="text-sm font-semibold text-harlo-ink">Manual knowledge</span>
                              <textarea
                                value={editContent}
                                onChange={(event) => setEditContent(event.target.value)}
                                rows={5}
                                className="mt-2 w-full resize-y rounded-lg border border-harlo-line bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/15"
                                placeholder="Paste the updated business knowledge."
                              />
                            </label>
                          ) : null}
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-xl font-semibold text-harlo-ink">{selectedSource.name}</h2>
                            <StatusBadge status={crawlingSourceIds.has(selectedSource.id) ? "processing" : selectedSource.status} />
                          </div>
                          <p className="mt-2 flex min-w-0 items-center gap-2 truncate text-sm text-harlo-muted">
                            {sourceSubtitle(selectedSource)}
                            {selectedSource.source_type === "url" ? <ExternalLink size={14} className="shrink-0" /> : null}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isEditingSource ? (
                      <>
                        <Button type="button" variant="ghost" onClick={() => setIsEditingSource(false)} disabled={isSavingSource}>
                          <X size={15} />
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleSaveSelectedSource}
                          disabled={isSavingSource || !editName.trim() || (selectedSource.source_type === "manual" && editContent.trim().length < 40)}
                        >
                          {isSavingSource ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
                          Save source
                        </Button>
                      </>
                    ) : (
                      <>
                        {selectedSource.source_type === "url" ? (
                          <IconButton label={selectedSource.status === "ready" ? "Sync" : "Crawl"} onClick={handleSyncSelectedSource} disabled={isSyncingSource || crawlingSourceIds.has(selectedSource.id) || selectedSource.status === "processing"}>
                            {isSyncingSource || crawlingSourceIds.has(selectedSource.id) || selectedSource.status === "processing" ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                          </IconButton>
                        ) : null}
                        <IconButton label="Edit" onClick={() => setIsEditingSource(true)}>
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton label="Delete" tone="danger" onClick={() => setShowDeleteDialog(true)} disabled={isDeletingSource}>
                          {isDeletingSource ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        </IconButton>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-5 flex overflow-x-auto border-b border-harlo-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <DetailTabButton active={detailTab === "overview"} label="Overview" onClick={() => setDetailTab("overview")} />
                  <DetailTabButton active={detailTab === "content"} label="Content" onClick={() => setDetailTab("content")} count={getChunkCount(selectedSource)} />
                </div>
              </div>

              <div className="p-5">
                {detailTab === "overview" ? (
                  <SourceOverview source={selectedSource} />
                ) : null}
                {detailTab === "content" ? (
                  <SourceContent
                    chunkSearchQuery={chunkSearchQuery}
                    contentCards={contentCards}
                    setChunkSearchQuery={setChunkSearchQuery}
                    source={selectedSource}
                  />
                ) : null}
              </div>
            </>
          ) : (
            <div className="grid min-h-[520px] place-items-center p-8 text-center">
              <div>
                <Library className="mx-auto text-harlo-teal" size={28} />
                <p className="mt-4 font-semibold text-harlo-ink">Select or add a source</p>
                <p className="mt-2 text-sm text-harlo-muted">Source details and extracted content will appear here.</p>
              </div>
            </div>
          )}
        </main>

        <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
          <KnowledgeHealth stats={stats} />
          <CommandCenterRagTest botId={botId} />
        </aside>
      </section>
    </div>
  );
}

function AddModeButton({
  icon: Icon,
  label,
  onClick
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center gap-3 rounded-lg border border-harlo-line bg-white px-4 text-left text-sm font-semibold text-harlo-teal transition hover:border-harlo-teal/50 hover:bg-harlo-canvas"
    >
      <Icon size={17} />
      {label}
    </button>
  );
}

function AddSourceForm({
  canSubmit,
  content,
  file,
  fileInputRef,
  handleFileDrop,
  handleSubmit,
  isDraggingFile,
  isPending,
  mode,
  name,
  selectFile,
  setContent,
  setAddModalMode,
  setIsDraggingFile,
  setName,
  setUrl,
  url
}: {
  canSubmit: boolean;
  content: string;
  file: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileDrop: (event: React.DragEvent<HTMLButtonElement>) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isDraggingFile: boolean;
  isPending: boolean;
  mode: SourceMode;
  name: string;
  selectFile: (file: File | null) => void;
  setContent: (value: string) => void;
  setAddModalMode: (value: SourceMode | null) => void;
  setIsDraggingFile: (value: boolean) => void;
  setName: (value: string) => void;
  setUrl: (value: string) => void;
  url: string;
}) {
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        {mode === "url" ? (
          <>
            <TextInput label="URL" value={url} onChange={setUrl} required type="url" placeholder="https://example.com" />
            <TextInput label="Name" value={name} onChange={setName} placeholder="Support docs" />
          </>
        ) : null}
        {mode === "manual" ? (
          <>
            <TextInput label="Name" value={name} onChange={setName} required placeholder="Pricing & Plans" />
            <label className="block">
              <span className="text-xs font-semibold text-harlo-ink">Knowledge</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                required
                minLength={40}
                rows={5}
                className="mt-1.5 w-full resize-y rounded-lg border border-harlo-line bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/15"
                placeholder="Paste services, pricing, policies, hours, booking rules, or FAQs."
              />
            </label>
          </>
        ) : null}
        {mode === "file" ? (
          <>
            <TextInput label="Name" value={name} onChange={setName} placeholder={file?.name ?? "Uploaded knowledge"} />
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
              className={`flex min-h-28 w-full flex-col items-center justify-center rounded-lg border border-dashed px-3 py-4 text-center transition ${
                isDraggingFile
                  ? "border-harlo-teal bg-harlo-mist"
                  : "border-harlo-line bg-white hover:border-harlo-teal/60"
              }`}
            >
              <UploadCloud size={19} className="text-harlo-teal" />
              <span className="mt-2 text-sm font-semibold text-harlo-ink">{file ? file.name : "Choose or drop a file"}</span>
              <span className="mt-1 text-xs text-harlo-muted">PDF, DOCX, TXT, Markdown, CSV, JSON, or HTML up to 10MB</span>
            </button>
          </>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={() => setAddModalMode(null)} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !canSubmit} className="bg-harlo-teal hover:bg-harlo-navy">
        {isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
        {isPending ? "Adding..." : "Add source"}
        </Button>
      </div>
    </form>
  );
}

function SourceListItem({
  brandLogoUrl,
  isActive,
  isCrawling,
  onSelect,
  source
}: {
  brandLogoUrl: string | null;
  isActive: boolean;
  isCrawling: boolean;
  onSelect: () => void;
  source: KnowledgeSourceRow;
}) {
  const Icon = getSourceIcon(source);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`mb-2 grid w-full grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-3 text-left transition ${
        isActive
          ? "border-harlo-teal bg-harlo-mist/55 shadow-sm"
          : "border-harlo-line bg-white hover:border-harlo-teal/50 hover:bg-harlo-canvas"
      }`}
    >
      <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-harlo-mist text-harlo-teal">
        <SourceLogo brandLogoUrl={brandLogoUrl} source={source} fallbackIcon={Icon} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-harlo-ink">{source.name}</span>
        <span className="mt-1 block text-xs text-harlo-muted">{capitalize(source.source_type)}</span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <StatusBadge status={isCrawling ? "processing" : source.status} />
        <span className="text-xs text-harlo-muted">{getChunkCount(source).toLocaleString()} chunks</span>
        <MoreVertical size={15} className="text-harlo-muted" />
      </span>
    </button>
  );
}

function SourceOverview({ source }: { source: KnowledgeSourceRow }) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-harlo-line p-5">
        <h3 className="text-base font-semibold text-harlo-ink">Source summary</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_120px] lg:items-center">
          <div className="text-sm text-harlo-muted">
            <p>{source.source_type === "url" ? "Last crawled" : "Last updated"} {formatDateTime(getLastSourceActivityAt(source))}</p>
          </div>
          <SummaryMetric label="Chunks" value={getChunkCount(source).toLocaleString()} />
        </div>
      </div>
      <SourceContent source={source} contentCards={getContentCards(source)} chunkSearchQuery="" setChunkSearchQuery={() => undefined} compact />
    </div>
  );
}

function SourceContent({
  chunkSearchQuery,
  compact = false,
  contentCards,
  setChunkSearchQuery,
  source
}: {
  chunkSearchQuery: string;
  compact?: boolean;
  contentCards: ContentCard[];
  setChunkSearchQuery: (value: string) => void;
  source: KnowledgeSourceRow;
}) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold text-harlo-ink">Extracted content <span className="font-normal text-harlo-muted">({getChunkCount(source).toLocaleString()} chunks)</span></h3>
      </div>
      {!compact ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_44px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-harlo-muted" size={16} />
            <input
              value={chunkSearchQuery}
              onChange={(event) => setChunkSearchQuery(event.target.value)}
              className="h-11 w-full rounded-lg border border-harlo-line bg-white pl-10 pr-3 text-sm outline-none transition focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/15"
              placeholder="Search chunks..."
            />
          </label>
          <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-harlo-line px-3 text-sm font-semibold text-harlo-muted">
            All sections
            <ChevronDown size={15} />
          </button>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-lg border border-harlo-line text-harlo-muted" aria-label="Content display options">
            <Library size={16} />
          </button>
        </div>
      ) : null}
      <div className={`mt-4 space-y-3 overflow-y-auto pr-1 ${compact ? "max-h-[430px]" : "max-h-[560px]"}`}>
        {contentCards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-harlo-line p-6 text-center">
            <p className="text-sm font-semibold text-harlo-ink">No extracted content yet</p>
            <p className="mt-2 text-sm text-harlo-muted">Once this source is ingested, its stored chunks will appear here.</p>
          </div>
        ) : contentCards.map((card, index) => (
          <article key={`${card.title}-${index}`} className="rounded-lg border border-harlo-line p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-harlo-ink">{card.title}</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-harlo-muted">{card.body}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {card.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-harlo-mist px-2.5 py-1 text-xs font-medium text-harlo-teal">/{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="mt-4 text-sm text-harlo-muted">
        <span>Showing 1-{contentCards.length} of {Math.max(getChunkCount(source), contentCards.length)} chunks</span>
      </div>
    </div>
  );
}

function KnowledgeHealth({ stats }: { stats: ReturnType<typeof getStats> }) {
  return (
    <section className="rounded-lg border border-harlo-line bg-white shadow-sm">
      <div className="p-5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-harlo-ink">Knowledge health</h2>
          <InfoTooltip text="Health reflects ready sources, failed sources, chunk coverage, and retrieval readiness." />
        </div>
        <div className="mt-5 flex items-center gap-5">
          <HealthRing score={stats.healthScore} />
          <div>
            <p className="text-lg font-semibold text-harlo-teal">{stats.healthLabel}</p>
            <p className="mt-2 text-sm leading-6 text-harlo-muted">Your knowledge base is healthy and optimized for accurate answers.</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 border-t border-harlo-line">
        <HealthSmallMetric label="Total chunks" value={stats.chunks.toLocaleString()} />
        <HealthSmallMetric label="Coverage" value={`${stats.coverage}%`} />
        <HealthSmallMetric label="Failed sources" value={stats.failed.toString()} />
      </div>
    </section>
  );
}

function CommandCenterRagTest({ botId }: { botId: string }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedMessage = message.trim();

    if (!submittedMessage) {
      return;
    }

    setIsPending(true);
    setError(null);
    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: submittedMessage
      }
    ]);
    setMessage("");

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        botId,
        message: submittedMessage,
        testOnly: true,
        visitor: {
          anonymousId: "dashboard-test",
          pageUrl: "/dashboard/knowledge"
        }
      })
    });
    const payload = (await response.json().catch(() => null)) as (ChatResult & { error?: string }) | null;

    if (!response.ok) {
      setError(payload?.error ?? "Could not generate an answer.");
      setIsPending(false);
      return;
    }

    if (payload) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: payload.answer,
          retrieval: payload.retrieval
        }
      ]);
    }
    setIsPending(false);
  }

  return (
    <section className="flex h-[520px] flex-col rounded-lg border border-harlo-line bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-harlo-line px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-harlo-ink">Knowledge test</h2>
          <InfoTooltip text="Ask questions against published knowledge. Test messages are not saved as conversations or leads." />
        </div>
        <button type="button" onClick={() => setMessages([])} className="text-sm font-medium text-harlo-muted hover:text-harlo-ink">Clear</button>
      </div>
      <div className="flex-1 overflow-y-auto bg-harlo-canvas/60 p-4">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                <Bot size={19} />
              </span>
              <p className="mt-3 text-sm font-semibold text-harlo-ink">Test published knowledge</p>
              <p className="mt-1 text-sm leading-6 text-harlo-muted">Ask a question. This test does not save conversations or leads.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((item) => (
              <div key={item.id} className={`flex items-start gap-3 ${item.role === "user" ? "justify-end" : ""}`}>
                {item.role === "assistant" ? (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-harlo-teal text-white">
                    <Bot size={17} />
                  </span>
                ) : null}
                <div className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${
                  item.role === "user" ? "bg-harlo-teal text-white" : "bg-white text-harlo-ink shadow-sm"
                }`}>
                  {item.content}
                  {item.role === "assistant" && item.retrieval ? (
                    <div className="mt-3 border-t border-harlo-line pt-3">
                      <p className="text-xs font-semibold text-harlo-ink">Sources ({item.retrieval.length})</p>
                      {item.retrieval.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.retrieval.map((source, index) => (
                            <span key={`${item.id}-${source.sourceTitle}-${source.similarity ?? ""}-${index}`} className="inline-flex items-center gap-1 rounded-lg bg-harlo-mist px-2 py-1 text-xs font-medium text-harlo-teal">
                              {source.sourceTitle}
                              {typeof source.similarity === "number" ? <span>{Math.round(source.similarity * 100)}%</span> : null}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-harlo-muted">No retrieved sources for this answer.</p>
                      )}
                    </div>
                  ) : null}
                </div>
                {item.role === "user" ? (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-harlo-line bg-white text-harlo-muted">
                    <UserRound size={17} />
                  </span>
                ) : null}
              </div>
            ))}
            {isPending ? (
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-harlo-teal text-white">
                  <Bot size={17} />
                </span>
                <div className="rounded-lg bg-white px-4 py-3 text-sm text-harlo-muted shadow-sm">Thinking...</div>
              </div>
            ) : null}
          </div>
        )}
        {error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="border-t border-harlo-line p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
            className="h-11 min-w-0 flex-1 rounded-lg border border-harlo-line px-3 text-sm outline-none transition focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/15"
            placeholder="Ask another question..."
          />
          <Button className="h-11 w-11 bg-harlo-teal px-0 hover:bg-harlo-navy" disabled={isPending} aria-label="Send test question">
            {isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          </Button>
        </form>
        <p className="mt-3 text-xs text-harlo-muted">
          Test mode uses published knowledge only and does not save messages.
        </p>
      </div>
    </section>
  );
}

function TextInput({
  label,
  onChange,
  placeholder,
  required,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-harlo-ink">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        className="mt-1.5 h-10 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none transition focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/15"
        placeholder={placeholder}
      />
    </label>
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

  useEffect(() => {
    setLogoIndex(0);
  }, [source.id, logoCandidates.length]);

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

function StatusBadge({ status }: { status: string }) {
  const statusClass = status === "ready"
    ? "bg-emerald-50 text-emerald-700"
    : status === "failed"
      ? "bg-red-50 text-red-700"
      : "bg-blue-50 text-blue-700";

  return <Badge className={`w-fit border-transparent capitalize ${statusClass}`}>{capitalize(status)}</Badge>;
}

function DetailTabButton({ active, count, label, onClick }: { active: boolean; count?: number; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-11 px-4 text-sm font-semibold transition ${
        active ? "text-harlo-teal" : "text-harlo-muted hover:text-harlo-ink"
      }`}
    >
      {label}
      {typeof count === "number" ? <span className="ml-2 rounded-full bg-harlo-canvas px-2 py-0.5 text-xs text-harlo-muted">{count.toLocaleString()}</span> : null}
      {active ? <span className="absolute inset-x-0 bottom-[-1px] h-0.5 rounded-full bg-harlo-teal" /> : null}
    </button>
  );
}

function SummaryMetric({ icon, label, value }: { icon?: boolean; label: string; value: string }) {
  return (
    <div className="border-l border-harlo-line pl-5">
      <p className="text-2xl font-semibold text-harlo-ink">{value}</p>
      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-harlo-muted">
        {label}
        {icon ? <Info size={13} /> : null}
      </p>
    </div>
  );
}

function HealthRing({ score }: { score: number }) {
  const angle = Math.max(0, Math.min(100, score)) * 3.6;

  return (
    <div
      className="grid h-28 w-28 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(#087f95 ${angle}deg, #dbe8ed 0deg)` }}
    >
      <div className="grid h-20 w-20 place-items-center rounded-full bg-white">
        <span className="text-center text-2xl font-semibold leading-none text-harlo-teal">
          {score}
          <span className="block text-xs font-medium text-harlo-muted">of 100</span>
        </span>
      </div>
    </div>
  );
}

function HealthSmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-harlo-line p-4 text-center last:border-r-0">
      <p className="text-lg font-semibold text-harlo-teal">{value}</p>
      <p className="mt-1 text-xs text-harlo-muted">{label}</p>
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-grid h-5 w-5 place-items-center">
      <Info size={15} className="text-harlo-muted" />
      <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-56 -translate-x-1/2 rounded-lg bg-harlo-ink px-3 py-2 text-xs font-medium leading-5 text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  );
}

function IconButton({
  label,
  children,
  disabled,
  onClick,
  tone = "default"
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
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
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 translate-y-1 rounded-md bg-harlo-ink px-2 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
        {label}
      </span>
    </button>
  );
}

function getSourceIcon(source: KnowledgeSourceRow) {
  return source.source_type === "file" ? FileText : source.source_type === "url" ? Globe2 : BookOpen;
}

function sourceSubtitle(source: KnowledgeSourceRow) {
  if (source.source_type === "url" && typeof source.metadata.url === "string") {
    return source.metadata.url;
  }

  if (source.source_type === "file" && typeof source.metadata.file_name === "string") {
    return source.metadata.file_name;
  }

  return capitalize(source.source_type);
}

function getSourceLogoCandidates(source: KnowledgeSourceRow, brandLogoUrl: string | null) {
  if (source.source_type !== "url" || source.status !== "ready") {
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
    const url = new URL(withProtocol);
    return [
      `${url.origin}/icon.png`,
      `${url.origin}/apple-touch-icon.png`,
      `${url.origin}/favicon.ico`,
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url.hostname)}&sz=64`
    ];
  } catch {
    return [];
  }
}

function filterSources(sources: KnowledgeSourceRow[], searchQuery: string, statusFilter: StatusFilter) {
  const query = searchQuery.trim().toLowerCase();

  return sources.filter((source) => {
    const matchesQuery = query.length === 0
      || source.name.toLowerCase().includes(query)
      || sourceSubtitle(source).toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || source.status === statusFilter;

    return matchesQuery && matchesStatus;
  });
}

function getContentCards(source: KnowledgeSourceRow | null): ContentCard[] {
  if (!source) {
    return [];
  }

  return source.chunks.map((chunk, index) => ({
    title: getChunkTitle(chunk, source, index),
    body: chunk.content,
    tags: getChunkTags(chunk, source)
  }));
}

function getChunkTitle(chunk: KnowledgeChunkContentRow, source: KnowledgeSourceRow, index: number) {
  const pageTitle = chunk.metadata?.page_title?.trim();

  if (pageTitle) {
    return pageTitle;
  }

  if (source.source_type === "file" && typeof source.metadata.file_name === "string") {
    return source.metadata.file_name;
  }

  return `${source.name} chunk ${index + 1}`;
}

function getChunkTags(chunk: KnowledgeChunkContentRow, source: KnowledgeSourceRow) {
  const metadata = chunk.metadata ?? {};
  const tagCandidates = [
    metadata.page_url,
    metadata.source_url,
    source.source_type === "file" && typeof source.metadata.file_name === "string" ? source.metadata.file_name : null,
    source.source_type === "manual" ? source.name : null
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  const tags = tagCandidates.flatMap((value) => getTagsFromValue(value));
  const uniqueTags = Array.from(new Set(tags));

  return uniqueTags.length > 0 ? uniqueTags.slice(0, 3) : [source.source_type];
}

function getTagsFromValue(value: string) {
  try {
    const parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const segments = parsed.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length > 0) {
      return segments;
    }

    return [parsed.hostname.replace(/^www\./, "")];
  } catch {
    return value
      .replace(/\.[^.]+$/, "")
      .split(/[^a-z0-9]+/i)
      .map((segment) => segment.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 3);
  }
}

function getStats(sources: KnowledgeSourceRow[]) {
  const base = sources.reduce((stats, source) => {
    stats.total += 1;
    stats.ready += source.status === "ready" ? 1 : 0;
    stats.failed += source.status === "failed" ? 1 : 0;
    stats.chunks += getChunkCount(source);
    stats.pages += typeof source.metadata.page_count === "number" ? source.metadata.page_count : 0;
    return stats;
  }, { total: 0, ready: 0, failed: 0, chunks: 0, pages: 0 });
  const coverage = base.total === 0 ? 0 : Math.round((base.ready / base.total) * 100);
  const healthScore = base.total === 0 ? 0 : Math.max(0, Math.min(100, Math.round(coverage - (base.failed * 4))));
  const healthLabel = healthScore >= 90 ? "Excellent" : healthScore >= 80 ? "Healthy" : healthScore >= 65 ? "Needs review" : base.total === 0 ? "Empty" : "At risk";

  return {
    ...base,
    coverage,
    healthLabel,
    healthScore
  };
}

function getChunkCount(source: KnowledgeSourceRow) {
  return typeof source.metadata.chunk_count === "number" ? source.metadata.chunk_count : 0;
}

function getLastSourceActivityAt(source: KnowledgeSourceRow) {
  const metadataTime = getMetadataString(source.metadata, ["last_crawled_at", "last_ingested_at", "updated_at"]);
  return metadataTime ?? source.created_at;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
