import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ invitationId: string }>;
};

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { invitationId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to manage invites." }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "No organization found for this account." }, { status: 404 });
  }

  const service = createSupabaseServiceClient();
  const { data: invitation } = await service
    .from("team_invitations")
    .select("id, organization_id, role, status")
    .eq("id", invitationId)
    .maybeSingle();

  if (!invitation || invitation.organization_id !== membership.organization_id || invitation.status !== "pending") {
    return NextResponse.json({ error: "Pending invite was not found." }, { status: 404 });
  }

  if (!canManageInvite(membership.role, invitation.role)) {
    return NextResponse.json({ error: "You do not have permission to cancel this invite." }, { status: 403 });
  }

  const { error } = await service
    .from("team_invitations")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("id", invitation.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "revoked" });
}

function canManageInvite(currentRole: string, inviteRole: string) {
  if (currentRole === "owner") {
    return inviteRole === "admin" || inviteRole === "member";
  }

  return currentRole === "admin" && inviteRole === "member";
}
