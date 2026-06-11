import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

type StatusRequest = {
  status?: unknown;
};

const validStatuses = new Set(["resolved", "needs_review"]);

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { conversationId } = await context.params;
  const body = (await request.json().catch(() => null)) as StatusRequest | null;
  const status = typeof body?.status === "string" ? body.status : "";

  if (!validStatuses.has(status)) {
    return NextResponse.json({ error: "Choose a valid conversation status." }, { status: 400 });
  }

  const auth = await getWorkspaceAuth();

  if ("response" in auth) {
    return auth.response;
  }

  const serviceClient = createSupabaseServiceClient();
  const { data, error } = await serviceClient
    .from("conversations")
    .update({ review_status: status })
    .eq("id", conversationId)
    .eq("organization_id", auth.organizationId)
    .select("id, review_status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  revalidatePath("/dashboard/conversations");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/analytics");

  return NextResponse.json({ conversationId: data.id, reviewStatus: data.review_status });
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
    return { response: NextResponse.json({ error: "Finish onboarding before updating conversations." }, { status: 409 }) };
  }

  return { organizationId: membership.organization_id };
}
