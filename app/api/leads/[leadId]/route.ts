import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

type LeadUpdateRequest = {
  status?: string;
};

const ALLOWED_STATUSES = new Set(["new", "contacted"]);

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { leadId } = await context.params;
  const body = (await request.json()) as LeadUpdateRequest;
  const status = body.status?.trim().toLowerCase();

  if (!status || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "Unsupported lead status." }, { status: 400 });
  }

  const auth = await getWorkspaceAuth();

  if ("response" in auth) {
    return auth.response;
  }

  const serviceClient = createSupabaseServiceClient();
  const { data, error } = await serviceClient
    .from("leads")
    .update({ status })
    .eq("id", leadId)
    .eq("organization_id", auth.organizationId)
    .select("id, name, email, question, status, created_at, metadata, conversation_id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Lead not found." }, { status: 404 });
  }

  return NextResponse.json({ lead: data });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { leadId } = await context.params;
  const auth = await getWorkspaceAuth();

  if ("response" in auth) {
    return auth.response;
  }

  const serviceClient = createSupabaseServiceClient();
  const { data, error } = await serviceClient
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("organization_id", auth.organizationId)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Lead not found." }, { status: 404 });
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
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return { response: NextResponse.json({ error: "Finish onboarding before editing leads." }, { status: 409 }) };
  }

  return { organizationId: membership.organization_id };
}
