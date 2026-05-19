import { NextRequest, NextResponse } from "next/server";
import { getBillingPlan } from "@/lib/billing/plans";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type AcceptRequest = {
  token?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as AcceptRequest;
  const token = body.token?.trim();

  if (!token) {
    return NextResponse.json({ error: "Invite token is missing." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to accept this invite." }, { status: 401 });
  }

  const service = createSupabaseServiceClient();
  const { data: invitation } = await service
    .from("team_invitations")
    .select("id, organization_id, email, role, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invitation || invitation.status !== "pending" || new Date(invitation.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "This invite is invalid or expired." }, { status: 404 });
  }

  if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return NextResponse.json({ error: "Sign in with the invited email address to accept this invite." }, { status: 403 });
  }

  const { count: existingMembershipCount } = await service
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", invitation.organization_id)
    .eq("user_id", user.id);

  if ((existingMembershipCount ?? 0) > 0) {
    await service
      .from("team_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", invitation.id);

    return NextResponse.json({ status: "accepted" });
  }

  const capacity = await getSeatCapacity(service, invitation.organization_id);

  if (capacity.members >= capacity.limit) {
    return NextResponse.json({ error: "This workspace is out of seats. Ask an admin to add another seat." }, { status: 400 });
  }

  const { error: membershipError } = await service.from("memberships").insert({
    organization_id: invitation.organization_id,
    user_id: user.id,
    role: invitation.role
  });

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  await service
    .from("team_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", invitation.id);

  return NextResponse.json({ status: "accepted" });
}

async function getSeatCapacity(service: ReturnType<typeof createSupabaseServiceClient>, organizationId: string) {
  const [{ data: billing }, { data: addOns }, { count: memberCount }] = await Promise.all([
    service
      .from("organization_billing")
      .select("plan_key, status")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    service
      .from("organization_add_ons")
      .select("add_on_key, enabled, quantity")
      .eq("organization_id", organizationId),
    service
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
  ]);
  const plan = getBillingPlan(typeof billing?.plan_key === "string" ? billing.plan_key : null);
  const extraSeats = billing?.status === "active"
    ? ((addOns ?? []) as Array<{ add_on_key: string; enabled: boolean; quantity: number }>)
      .filter((row) => row.add_on_key === "extra_seat" && row.enabled)
      .reduce((total, row) => total + Math.max(0, row.quantity ?? 0), 0)
    : 0;

  return {
    limit: plan.seats + extraSeats,
    members: memberCount ?? 0
  };
}
