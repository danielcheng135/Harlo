import { embedText } from "@/lib/ai/rag";
import { chunkKnowledgeText, cleanKnowledgeText, formatEmbeddingForPgvector } from "@/lib/knowledge/chunking";
import type { createSupabaseServiceClient } from "@/lib/supabase/server";

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>;

type IngestBase = {
  serviceClient: ServiceClient;
  organizationId: string;
  botId: string;
  name: string;
};

type IngestTextSourceInput = IngestBase & {
  sourceType: "manual" | "file";
  content: string;
  metadata?: Record<string, unknown>;
};

type IngestUrlSourceInput = IngestBase & {
  url: string;
  maxPages?: number;
};

type PreparedPage = {
  url: string;
  title: string;
  text: string;
};

const MAX_CHUNKS = 120;
const MAX_FILE_BYTES = 10_000_000;
const SUPPORTED_FILE_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "application/json",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export async function ingestTextSource({
  serviceClient,
  organizationId,
  botId,
  name,
  sourceType,
  content,
  metadata = {}
}: IngestTextSourceInput) {
  const cleanContent = cleanKnowledgeText(content);

  if (cleanContent.length < 40) {
    throw new Error("Content must be at least 40 characters.");
  }

  const chunks = chunkKnowledgeText(cleanContent);

  if (chunks.length === 0) {
    throw new Error("Content is too short to ingest.");
  }

  if (chunks.length > MAX_CHUNKS) {
    throw new Error(`This source creates ${chunks.length} chunks. Please split it into smaller sources.`);
  }

  const { data: source, error: sourceError } = await serviceClient
    .from("knowledge_sources")
    .insert({
      organization_id: organizationId,
      bot_id: botId,
      name,
      source_type: sourceType,
      status: "processing",
      metadata: {
        ...metadata,
        character_count: cleanContent.length,
        chunk_count: chunks.length,
        ...(sourceType === "manual" ? { content: cleanContent } : {})
      }
    })
    .select("id")
    .single();

  if (sourceError || !source) {
    throw new Error(sourceError?.message ?? "Could not create source.");
  }

  try {
    await insertChunks({
      serviceClient,
      organizationId,
      botId,
      sourceId: source.id,
      sourceName: name,
      chunks,
      getMetadata: (index) => ({
        source_name: name,
        chunk_index: index,
        chunk_count: chunks.length
      })
    });

    await serviceClient
      .from("knowledge_sources")
      .update({
        status: "ready",
        metadata: {
          ...metadata,
          character_count: cleanContent.length,
          chunk_count: chunks.length,
          ...(sourceType === "manual" ? { content: cleanContent } : {})
        }
      })
      .eq("id", source.id);

    return {
      sourceId: source.id,
      chunks: chunks.length,
      status: "ready" as const
    };
  } catch (error) {
    await markSourceFailed(serviceClient, source.id, {
      ...metadata,
      character_count: cleanContent.length,
      chunk_count: chunks.length,
      ...(sourceType === "manual" ? { content: cleanContent } : {}),
      error: error instanceof Error ? error.message : "Unknown ingestion error"
    });
    throw error;
  }
}

export async function createPendingUrlSource({
  serviceClient,
  organizationId,
  botId,
  name,
  url,
  maxPages = 8
}: IngestUrlSourceInput) {
  const normalizedUrl = normalizeUrl(url);
  const { data: source, error } = await serviceClient
    .from("knowledge_sources")
    .insert({
      organization_id: organizationId,
      bot_id: botId,
      name,
      source_type: "url",
      status: "pending",
      metadata: {
        url: normalizedUrl,
        max_pages: maxPages
      }
    })
    .select("id")
    .single();

  if (error || !source) {
    throw new Error(error?.message ?? "Could not create source.");
  }

  return {
    sourceId: source.id,
    chunks: 0,
    pages: 0,
    status: "pending" as const
  };
}

export async function ingestUrlSource({
  serviceClient,
  organizationId,
  botId,
  name,
  url,
  maxPages = 8
}: IngestUrlSourceInput) {
  const normalizedUrl = normalizeUrl(url);
  const { data: source, error: sourceError } = await serviceClient
    .from("knowledge_sources")
    .insert({
      organization_id: organizationId,
      bot_id: botId,
      name,
      source_type: "url",
      status: "processing",
      metadata: {
        url: normalizedUrl,
        max_pages: maxPages
      }
    })
    .select("id")
    .single();

  if (sourceError || !source) {
    throw new Error(sourceError?.message ?? "Could not create source.");
  }

  try {
    const pages = await crawlWebsite(normalizedUrl, maxPages);
    const chunksWithPage = pages.flatMap((page) => {
      const chunks = chunkKnowledgeText(`${page.title}\n${page.url}\n\n${page.text}`);
      return chunks.map((chunk, index) => ({
        chunk,
        page,
        pageChunkIndex: index
      }));
    });

    if (chunksWithPage.length === 0) {
      throw new Error("No readable website content was found.");
    }

    if (chunksWithPage.length > MAX_CHUNKS) {
      chunksWithPage.length = MAX_CHUNKS;
    }

    await insertChunks({
      serviceClient,
      organizationId,
      botId,
      sourceId: source.id,
      sourceName: name,
      chunks: chunksWithPage.map((item) => item.chunk),
      getMetadata: (index) => {
        const item = chunksWithPage[index];
        return {
          source_name: name,
          source_url: normalizedUrl,
          page_url: item.page.url,
          page_title: item.page.title,
          page_chunk_index: item.pageChunkIndex,
          chunk_index: index,
          chunk_count: chunksWithPage.length
        };
      }
    });

    const characterCount = pages.reduce((total, page) => total + page.text.length, 0);
    const metadata = {
      url: normalizedUrl,
      page_count: pages.length,
      character_count: characterCount,
      chunk_count: chunksWithPage.length,
      pages: pages.map((page) => ({
        url: page.url,
        title: page.title,
        character_count: page.text.length
      }))
    };

    await serviceClient
      .from("knowledge_sources")
      .update({
        status: "ready",
        metadata
      })
      .eq("id", source.id);

    return {
      sourceId: source.id,
      chunks: chunksWithPage.length,
      pages: pages.length,
      status: "ready" as const
    };
  } catch (error) {
    await markSourceFailed(serviceClient, source.id, {
      url: normalizedUrl,
      error: error instanceof Error ? error.message : "Unknown crawl error"
    });
    throw error;
  }
}


export async function reingestUrlSource({
  serviceClient,
  organizationId,
  botId,
  sourceId,
  name,
  url,
  maxPages = 8
}: IngestUrlSourceInput & { sourceId: string }) {
  const normalizedUrl = normalizeUrl(url);

  try {
    const pages = await crawlWebsite(normalizedUrl, maxPages);
    const chunksWithPage = pages.flatMap((page) => {
      const chunks = chunkKnowledgeText(`${page.title}
${page.url}

${page.text}`);
      return chunks.map((chunk, index) => ({
        chunk,
        page,
        pageChunkIndex: index
      }));
    });

    if (chunksWithPage.length === 0) {
      throw new Error("No readable website content was found.");
    }

    if (chunksWithPage.length > MAX_CHUNKS) {
      chunksWithPage.length = MAX_CHUNKS;
    }

    await serviceClient
      .from("knowledge_sources")
      .update({
        name,
        status: "processing",
        metadata: {
          url: normalizedUrl,
          max_pages: maxPages
        }
      })
      .eq("id", sourceId)
      .eq("organization_id", organizationId);

    await serviceClient.from("knowledge_chunks").delete().eq("source_id", sourceId);
    await insertChunks({
      serviceClient,
      organizationId,
      botId,
      sourceId,
      sourceName: name,
      chunks: chunksWithPage.map((item) => item.chunk),
      getMetadata: (index) => {
        const item = chunksWithPage[index];
        return {
          source_name: name,
          source_url: normalizedUrl,
          page_url: item.page.url,
          page_title: item.page.title,
          page_chunk_index: item.pageChunkIndex,
          chunk_index: index,
          chunk_count: chunksWithPage.length
        };
      }
    });

    const characterCount = pages.reduce((total, page) => total + page.text.length, 0);
    const metadata = {
      url: normalizedUrl,
      page_count: pages.length,
      character_count: characterCount,
      chunk_count: chunksWithPage.length,
      pages: pages.map((page) => ({
        url: page.url,
        title: page.title,
        character_count: page.text.length
      }))
    };

    await serviceClient
      .from("knowledge_sources")
      .update({
        name,
        status: "ready",
        metadata
      })
      .eq("id", sourceId)
      .eq("organization_id", organizationId);

    return {
      sourceId,
      chunks: chunksWithPage.length,
      pages: pages.length,
      status: "ready" as const
    };
  } catch (error) {
    await markSourceFailed(serviceClient, sourceId, {
      url: normalizedUrl,
      error: error instanceof Error ? error.message : "Unknown crawl error"
    });
    throw error;
  }
}

export async function parseUploadedTextFile(file: File) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Files are limited to 10MB for this version.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const isSupportedExtension = extension ? ["txt", "md", "markdown", "csv", "json", "html", "htm", "pdf", "docx"].includes(extension) : false;

  const hasSupportedMimeType = file.type ? SUPPORTED_FILE_TYPES.has(file.type) : false;

  if (!hasSupportedMimeType && !isSupportedExtension) {
    throw new Error("Upload a PDF, DOCX, text, markdown, CSV, JSON, or HTML file.");
  }

  if (extension === "pdf" || file.type === "application/pdf") {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { PDFParse } = await importServerOnly<typeof import("pdf-parse")>("pdf-parse");
    const parser = new PDFParse({ data: buffer });

    try {
      const parsed = await parser.getText();
      return cleanKnowledgeText(parsed.text);
    } finally {
      await parser.destroy();
    }
  }

  if (extension === "docx" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const buffer = Buffer.from(await file.arrayBuffer());
    const mammoth = await importServerOnly<typeof import("mammoth")>("mammoth");
    const parsed = await mammoth.extractRawText({ buffer });
    return cleanKnowledgeText(parsed.value);
  }

  const rawText = await file.text();
  const content = extension === "html" || extension === "htm" || file.type === "text/html"
    ? extractReadableText(rawText)
    : rawText;

  return cleanKnowledgeText(content);
}

async function crawlWebsite(startUrl: string, maxPages: number): Promise<PreparedPage[]> {
  const origin = new URL(startUrl).origin;
  const visited = new Set<string>();
  const queue = [startUrl, ...(await getSitemapUrls(origin, maxPages - 1))];
  const pages: PreparedPage[] = [];
  const failures: string[] = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const currentUrl = normalizeUrl(queue.shift() ?? startUrl);

    if (visited.has(currentUrl) || new URL(currentUrl).origin !== origin) {
      continue;
    }

    visited.add(currentUrl);

    try {
      const html = await fetchHtml(currentUrl);
      const page = preparePage(currentUrl, html);

      if (page.text.length >= 120) {
        pages.push(page);
      }

      if (pages.length < maxPages) {
        for (const link of extractSameOriginLinks(html, currentUrl, origin)) {
          if (!visited.has(link) && !queue.includes(link)) {
            queue.push(link);
          }

          if (queue.length >= maxPages * 3) {
            break;
          }
        }
      }
    } catch (error) {
      failures.push(error instanceof Error ? error.message : `Could not crawl ${currentUrl}.`);
    }
  }

  if (pages.length === 0) {
    throw new Error(failures[0] ?? "No readable website pages could be crawled from that URL.");
  }

  return pages;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "accept": "text/html,application/xhtml+xml",
      "user-agent": "HarloBot/1.0 (+https://harloai.co)"
    },
    signal: AbortSignal.timeout(12000)
  });

  if (!response.ok) {
    throw new Error(`Could not fetch ${url} (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error(`${url} did not return an HTML page.`);
  }

  return response.text();
}

async function getSitemapUrls(origin: string, maxUrls: number) {
  if (maxUrls <= 0) {
    return [];
  }

  try {
    const response = await fetch(`${origin}/sitemap.xml`, {
      headers: {
        "accept": "application/xml,text/xml,text/plain",
        "user-agent": "HarloBot/1.0 (+https://harloai.co)"
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    return Array.from(xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi))
      .map((match) => decodeHtmlEntities(match[1].trim()))
      .filter((url) => isCrawlableUrl(url) && new URL(url).origin === origin)
      .slice(0, maxUrls);
  } catch {
    return [];
  }
}

function preparePage(url: string, html: string): PreparedPage {
  const title = extractTitle(html) || new URL(url).hostname;
  return {
    url,
    title,
    text: extractReadableText(html)
  };
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlEntities(stripTags(match[1])).trim() : "";
}

function extractReadableText(html: string) {
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const scopedHtml = mainMatch?.[1] ?? bodyMatch?.[1] ?? html;

  return cleanKnowledgeText(
    decodeHtmlEntities(
      scopedHtml
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
        .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
        .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|section|article|h[1-6]|li|tr)>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
    )
  );
}

function extractSameOriginLinks(html: string, baseUrl: string, origin: string) {
  return Array.from(html.matchAll(/<a\s+[^>]*href=["']([^"'#]+)["'][^>]*>/gi))
    .map((match) => {
      try {
        const url = new URL(decodeHtmlEntities(match[1]), baseUrl);
        url.hash = "";
        url.search = "";
        return url.toString();
      } catch {
        return null;
      }
    })
    .filter((url): url is string => typeof url === "string")
    .filter((url) => isCrawlableUrl(url) && new URL(url).origin === origin)
    .filter((url, index, all) => all.indexOf(url) === index)
    .slice(0, 24);
}

function normalizeUrl(input: string) {
  const withProtocol = /^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`;
  const url = new URL(withProtocol);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  url.hash = "";

  return url.toString();
}

function isCrawlableUrl(url: string) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    return !/\.(pdf|zip|png|jpe?g|gif|webp|svg|mp4|mov|mp3|css|js|ico|xml)$/i.test(pathname);
  } catch {
    return false;
  }
}

function stripTags(input: string) {
  return input.replace(/<[^>]+>/g, " ");
}

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)));
}

async function insertChunks({
  serviceClient,
  organizationId,
  botId,
  sourceId,
  sourceName,
  chunks,
  getMetadata
}: {
  serviceClient: ServiceClient;
  organizationId: string;
  botId: string;
  sourceId: string;
  sourceName: string;
  chunks: string[];
  getMetadata: (index: number) => Record<string, unknown>;
}) {
  const rows = [];

  for (const [index, chunk] of chunks.entries()) {
    const embedding = await embedText(chunk);
    rows.push({
      organization_id: organizationId,
      bot_id: botId,
      source_id: sourceId,
      content: chunk,
      embedding: formatEmbeddingForPgvector(embedding),
      metadata: {
        source_name: sourceName,
        ...getMetadata(index)
      }
    });
  }

  const { error } = await serviceClient.from("knowledge_chunks").insert(rows);

  if (error) {
    throw error;
  }
}

async function markSourceFailed(serviceClient: ServiceClient, sourceId: string, metadata: Record<string, unknown>) {
  await serviceClient
    .from("knowledge_sources")
    .update({
      status: "failed",
      metadata
    })
    .eq("id", sourceId);
}

async function importServerOnly<T>(specifier: string): Promise<T> {
  const dynamicImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<T>;
  return dynamicImport(specifier);
}
