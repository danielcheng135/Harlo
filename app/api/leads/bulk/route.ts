import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type BulkDeleteRequest = {
  leadIds?: unknown;
};

export async function DELETE(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as BulkDeleteRequest | null;
  const leadIds = Array.isArray(body?.leadIds)
    ? [...new Set(body.leadIds.filter((leadId): leadId is string => typeof leadId === "string" && leadId.trim().length > 0))]
    : [];

  if (leadIds.length === 0) {
    return NextResponse.json({ error: "Select at least one lead to delete." }, { status: 400 });
  }

  const auth = await getWorkspaceAuth();

  if ("response" in auth) {
    return auth.response;
  }

  const serviceClient = createSupabaseServiceClient();
  const { data: matchingLeads, error: matchingError } = await serviceClient
    .from("leads")
    .select("id")
    .eq("organization_id", auth.organizationId)
    .in("id", leadIds);

  if (matchingError) {
    return NextResponse.json({ error: matchingError.message }, { status: 500 });
  }

  const matchingIds = (matchingLeads ?? []).map((lead) => lead.id);

  if (matchingIds.length === 0) {
    return NextResponse.json({ error: "No matching leads were found." }, { status: 404 });
  }

  const deleteResults = await Promise.all(matchingIds.map(async (leadId) => {
    const { error } = await serviceClient
      .from("leads")
      .delete()
      .eq("organization_id", auth.organizationId)
      .eq("id", leadId);

    return { leadId, error };
  }));
  const deleteError = deleteResults.find((result) => result.error)?.error;

  const { data: remainingLeads, error: verificationError } = await serviceClient
    .from("leads")
    .select("id")
    .eq("organization_id", auth.organizationId)
    .in("id", matchingIds);

  if (verificationError) {
    return NextResponse.json({ error: verificationError.message }, { status: 500 });
  }

  const remainingIds = new Set((remainingLeads ?? []).map((lead) => lead.id));
  const deletedIds = matchingIds.filter((leadId) => !remainingIds.has(leadId));

  if (remainingIds.size > 0) {
    return NextResponse.json(
      {
        error: deleteError?.message ?? "Some selected leads could not be deleted. Please try again.",
        deletedIds,
        failedIds: [...remainingIds]
      },
      { status: 409 }
    );
  }

  revalidatePath("/dashboard/leads");

  return NextResponse.json({ deletedIds });
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
