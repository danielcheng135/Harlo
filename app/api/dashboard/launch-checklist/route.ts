import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

const CHECKLIST_IDS = new Set(["knowledge", "assistant", "widget"]);

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { doneIds?: unknown; organizationId?: unknown } | null;
  const doneIds = sanitizeDoneIds(body?.doneIds);
  const organizationId = typeof body?.organizationId === "string" ? body.organizationId : "";

  if (!organizationId) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 400 });
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
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const service = createSupabaseServiceClient();
  const { data: organization } = await service
    .from("organizations")
    .select("metadata")
    .eq("id", organizationId)
    .maybeSingle();
  const metadata = isRecord(organization?.metadata) ? organization.metadata : {};
  const nextMetadata = {
    ...metadata,
    launch_checklist: {
      done_ids: doneIds,
      updated_at: new Date().toISOString()
    }
  };

  const { error } = await service
    .from("organizations")
    .update({
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    })
    .eq("id", organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, doneIds });
}

function sanitizeDoneIds(value: unknown) {
  return Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .filter((id): id is string => typeof id === "string" && CHECKLIST_IDS.has(id))
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
