import { NextRequest, NextResponse } from "next/server";
import { reingestUrlSource } from "@/lib/knowledge/ingestion";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type WebsiteSource = {
  id: string;
  organization_id: string;
  bot_id: string;
  name: string;
  metadata: Record<string, unknown> | null;
};

type SyncResult = {
  sourceId: string;
  status: "synced" | "failed" | "skipped";
  pages?: number;
  chunks?: number;
  reason?: string;
};

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const serviceClient = createSupabaseServiceClient();
  const { data, error } = await serviceClient
    .from("knowledge_sources")
    .select("id, organization_id, bot_id, name, metadata")
    .eq("source_type", "url");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sources = (data ?? []) as WebsiteSource[];
  const results: SyncResult[] = [];

  for (const source of sources) {
    const url = typeof source.metadata?.url === "string" ? source.metadata.url : "";
    const configuredMaxPages = source.metadata?.max_pages;
    const maxPages =
      typeof configuredMaxPages === "number" && Number.isFinite(configuredMaxPages)
        ? Math.max(1, Math.min(20, Math.floor(configuredMaxPages)))
        : 8;

    if (!url) {
      results.push({
        sourceId: source.id,
        status: "skipped",
        reason: "missing_url"
      });
      continue;
    }

    try {
      const result = await reingestUrlSource({
        serviceClient,
        organizationId: source.organization_id,
        botId: source.bot_id,
        sourceId: source.id,
        name: source.name,
        url,
        maxPages
      });

      results.push({
        sourceId: source.id,
        status: "synced",
        pages: result.pages,
        chunks: result.chunks
      });
    } catch (syncError) {
      console.error("Weekly website knowledge sync failed", {
        sourceId: source.id,
        organizationId: source.organization_id,
        error: syncError
      });
      results.push({
        sourceId: source.id,
        status: "failed",
        reason: syncError instanceof Error ? syncError.message : "unknown_error"
      });
    }
  }

  return NextResponse.json({
    checked: sources.length,
    synced: results.filter((result) => result.status === "synced").length,
    failed: results.filter((result) => result.status === "failed").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    results
  });
}
