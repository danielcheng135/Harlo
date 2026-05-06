import { NextRequest, NextResponse } from "next/server";
import { embedText } from "@/lib/ai/rag";
import { chunkKnowledgeText, formatEmbeddingForPgvector } from "@/lib/knowledge/chunking";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type ManualKnowledgeRequest = {
  name?: string;
  content?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ManualKnowledgeRequest;
  const name = body.name?.trim();
  const content = body.content?.trim();

  if (!name || !content) {
    return NextResponse.json({ error: "Source name and content are required." }, { status: 400 });
  }

  const chunks = chunkKnowledgeText(content);

  if (chunks.length === 0) {
    return NextResponse.json({ error: "Content is too short to ingest." }, { status: 400 });
  }

  if (chunks.length > 80) {
    return NextResponse.json({ error: "Manual sources are limited to 80 chunks for v1." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Finish onboarding before adding knowledge." }, { status: 409 });
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can manage knowledge." }, { status: 403 });
  }

  const { data: bot } = await supabase
    .from("bots")
    .select("id")
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!bot) {
    return NextResponse.json({ error: "No chatbot found for this workspace." }, { status: 409 });
  }

  const serviceClient = createSupabaseServiceClient();
  const { data: source, error: sourceError } = await serviceClient
    .from("knowledge_sources")
    .insert({
      organization_id: membership.organization_id,
      bot_id: bot.id,
      name,
      source_type: "manual",
      status: "processing",
      metadata: {
        character_count: content.length,
        chunk_count: chunks.length,
        content
      }
    })
    .select("id")
    .single();

  if (sourceError || !source) {
    return NextResponse.json({ error: sourceError?.message ?? "Could not create source." }, { status: 500 });
  }

  try {
    const rows = [];

    for (const [index, chunk] of chunks.entries()) {
      const embedding = await embedText(chunk);
      rows.push({
        organization_id: membership.organization_id,
        bot_id: bot.id,
        source_id: source.id,
        content: chunk,
        embedding: formatEmbeddingForPgvector(embedding),
        metadata: {
          source_name: name,
          chunk_index: index,
          chunk_count: chunks.length
        }
      });
    }

    const { error: chunkError } = await serviceClient.from("knowledge_chunks").insert(rows);

    if (chunkError) {
      throw chunkError;
    }

    await serviceClient
      .from("knowledge_sources")
      .update({
        status: "ready",
        metadata: {
          character_count: content.length,
          chunk_count: chunks.length,
          content
        }
      })
      .eq("id", source.id);

    return NextResponse.json({
      sourceId: source.id,
      chunks: chunks.length,
      status: "ready"
    });
  } catch (error) {
    await serviceClient
      .from("knowledge_sources")
      .update({
        status: "failed",
        metadata: {
          character_count: content.length,
          chunk_count: chunks.length,
          content,
          error: error instanceof Error ? error.message : "Unknown ingestion error"
        }
      })
      .eq("id", source.id);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not ingest source." },
      { status: 500 }
    );
  }
}
