import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ membershipId: string }>;
};

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { membershipId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to manage members." }, { status: 401 });
  }

  const { data: currentMembership } = await supabase
    .from("memberships")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!currentMembership) {
    return NextResponse.json({ error: "No organization found for this account." }, { status: 404 });
  }

  const service = createSupabaseServiceClient();
  const { data: targetMembership } = await service
    .from("memberships")
    .select("id, organization_id, user_id, role")
    .eq("id", membershipId)
    .maybeSingle();

  if (!targetMembership || targetMembership.organization_id !== currentMembership.organization_id) {
    return NextResponse.json({ error: "Team member was not found." }, { status: 404 });
  }

  if (!canManageMember(currentMembership.role, targetMembership.role, targetMembership.user_id === user.id)) {
    return NextResponse.json({ error: "You do not have permission to remove this member." }, { status: 403 });
  }

  const { error } = await service
    .from("memberships")
    .delete()
    .eq("id", targetMembership.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "removed" });
}

function canManageMember(currentRole: string, targetRole: string, isCurrentUser: boolean) {
  if (isCurrentUser || targetRole === "owner") {
    return false;
  }

  if (currentRole === "owner") {
    return targetRole === "admin" || targetRole === "member";
  }

  return currentRole === "admin" && targetRole === "member";
}
