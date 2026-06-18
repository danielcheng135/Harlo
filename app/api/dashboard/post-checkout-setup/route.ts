import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to finish setup." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const organizationId = typeof body.organizationId === "string" ? body.organizationId : null;

  if (!organizationId) {
    return NextResponse.json({ error: "Missing organization." }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const service = createSupabaseServiceClient();
  const { error } = await service
    .from("memberships")
    .update({ post_checkout_setup_seen_at: new Date().toISOString() })
    .eq("id", membership.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
