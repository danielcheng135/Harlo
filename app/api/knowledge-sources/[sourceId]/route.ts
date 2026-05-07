import { NextRequest, NextResponse } from "next/server";
import { embedText } from "@/lib/ai/rag";
import { chunkKnowledgeText, formatEmbeddingForPgvector } from "@/lib/knowledge/chunking";
import { reingestUrlSource } from "@/lib/knowledge/ingestion";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    sourceId: string;
  }>;
};

type UpdateSourceRequest = {
  action?: "sync";
  name?: string;
  content?: string;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { sourceId } = await context.params;
  const body = (await request.json()) as UpdateSourceRequest;
  const name = body.name?.trim();
  const content = body.content?.trim();

  if (!name) {
    return NextResponse.json({ error: "Source name is required." }, { status: 400 });
  }

  const auth = await getWorkspaceAuth();

  if ("response" in auth) {
    return auth.response;
  }

  const serviceClient = createSupabaseServiceClient();
  const { data: source, error: sourceError } = await serviceClient
    .from("knowledge_sources")
    .select("id, organization_id, bot_id, source_type, metadata")
    .eq("id", sourceId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (sourceError || !source) {
    return NextResponse.json({ error: "Knowledge source not found." }, { status: 404 });
  }

  if (body.action === "sync") {
    if (source.source_type !== "url") {
      return NextResponse.json({ error: "Only URL sources can be synced." }, { status: 400 });
    }

    const metadata = source.metadata && typeof source.metadata === "object" ? source.metadata as Record<string, unknown> : {};
    const url = typeof metadata.url === "string" ? metadata.url : "";

    if (!url) {
      return NextResponse.json({ error: "This URL source is missing its website URL." }, { status: 400 });
    }

    try {
      const result = await reingestUrlSource({
        serviceClient,
        organizationId: source.organization_id,
        botId: source.bot_id,
        sourceId: source.id,
        name,
        url
      });

      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not sync website source." },
        { status: 500 }
      );
    }
  }

  if (source.source_type !== "manual") {
    const { error } = await serviceClient
      .from("knowledge_sources")
      .update({
        name,
        metadata: {
          ...source.metadata,
          source_name: name
        }
      })
      .eq("id", source.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "saved" });
  }

  if (!content) {
    return NextResponse.json({ error: "Manual source content is required." }, { status: 400 });
  }

  const chunks = chunkKnowledgeText(content);

  if (chunks.length === 0) {
    return NextResponse.json({ error: "Content is too short to ingest." }, { status: 400 });
  }

  if (chunks.length > 80) {
    return NextResponse.json({ error: "Manual sources are limited to 80 chunks for v1." }, { status: 400 });
  }

  await serviceClient
    .from("knowledge_sources")
    .update({
      name,
      status: "processing",
      metadata: {
        ...source.metadata,
        character_count: content.length,
        chunk_count: chunks.length,
        content
      }
    })
    .eq("id", source.id);

  try {
    const rows = [];

    for (const [index, chunk] of chunks.entries()) {
      const embedding = await embedText(chunk);
      rows.push({
        organization_id: source.organization_id,
        bot_id: source.bot_id,
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

    await serviceClient.from("knowledge_chunks").delete().eq("source_id", source.id);
    const { error: chunkError } = await serviceClient.from("knowledge_chunks").insert(rows);

    if (chunkError) {
      throw chunkError;
    }

    await serviceClient
      .from("knowledge_sources")
      .update({
        status: "ready",
        metadata: {
          ...source.metadata,
          character_count: content.length,
          chunk_count: chunks.length,
          content
        }
      })
      .eq("id", source.id);

    return NextResponse.json({
      status: "ready",
      chunks: chunks.length
    });
  } catch (error) {
    await serviceClient
      .from("knowledge_sources")
      .update({
        status: "failed",
        metadata: {
          ...source.metadata,
          character_count: content.length,
          chunk_count: chunks.length,
          content,
          error: error instanceof Error ? error.message : "Unknown ingestion error"
        }
      })
      .eq("id", source.id);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update source." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { sourceId } = await context.params;
  const auth = await getWorkspaceAuth();

  if ("response" in auth) {
    return auth.response;
  }

  const serviceClient = createSupabaseServiceClient();
  const { error } = await serviceClient
    .from("knowledge_sources")
    .delete()
    .eq("id", sourceId)
    .eq("organization_id", auth.organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "deleted" });
}

async function getWorkspaceAuth(): Promise<{ organizationId: string } | { response: NextResponse }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { response: NextResponse.json({ error: "You must be signed in." }, { status: 401 }) };
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return { response: NextResponse.json({ error: "Finish onboarding before editing knowledge." }, { status: 409 }) };
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    return { response: NextResponse.json({ error: "Only owners and admins can edit knowledge." }, { status: 403 }) };
  }

  return { organizationId: membership.organization_id };
}
