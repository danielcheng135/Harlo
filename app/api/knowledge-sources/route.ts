import { NextRequest, NextResponse } from "next/server";
import {
  createPendingUrlSource,
  ingestTextSource,
  parseUploadedTextFile
} from "@/lib/knowledge/ingestion";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type KnowledgeSourceRequest = {
  name?: string;
  content?: string;
  url?: string;
  sourceType?: "manual" | "url";
};

type WorkspaceAuth = {
  organizationId: string;
  botId: string;
};

export async function POST(request: NextRequest) {
  const auth = await getWorkspaceAuth();

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    const serviceClient = createSupabaseServiceClient();

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const rawName = String(formData.get("name") ?? "").trim();

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
      }

      const name = rawName || file.name;
      const content = await parseUploadedTextFile(file);
      const result = await ingestTextSource({
        serviceClient,
        organizationId: auth.organizationId,
        botId: auth.botId,
        name,
        sourceType: "file",
        content,
        metadata: {
          file_name: file.name,
          file_type: file.type || "text/plain",
          file_size: file.size
        }
      });

      return NextResponse.json(result);
    }

    const body = (await request.json()) as KnowledgeSourceRequest;
    const sourceType = body.sourceType ?? "manual";

    if (sourceType === "url") {
      const url = body.url?.trim();

      if (!url) {
        return NextResponse.json({ error: "Website URL is required." }, { status: 400 });
      }

      const result = await createPendingUrlSource({
        serviceClient,
        organizationId: auth.organizationId,
        botId: auth.botId,
        name: body.name?.trim() || url,
        url
      });

      return NextResponse.json(result);
    }

    const name = body.name?.trim();
    const content = body.content?.trim();

    if (!name || !content) {
      return NextResponse.json({ error: "Source name and content are required." }, { status: 400 });
    }

    const result = await ingestTextSource({
      serviceClient,
      organizationId: auth.organizationId,
      botId: auth.botId,
      name,
      sourceType: "manual",
      content
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not ingest source." },
      { status: 500 }
    );
  }
}

async function getWorkspaceAuth(): Promise<WorkspaceAuth | { response: NextResponse }> {
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
    return { response: NextResponse.json({ error: "Finish onboarding before adding knowledge." }, { status: 409 }) };
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    return { response: NextResponse.json({ error: "Only owners and admins can manage knowledge." }, { status: 403 }) };
  }

  const { data: bot } = await supabase
    .from("bots")
    .select("id")
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!bot) {
    return { response: NextResponse.json({ error: "No chatbot found for this workspace." }, { status: 409 }) };
  }

  return {
    organizationId: membership.organization_id,
    botId: bot.id
  };
}
