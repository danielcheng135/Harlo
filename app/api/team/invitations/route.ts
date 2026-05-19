import { NextRequest, NextResponse } from "next/server";
import { getBillingPlan } from "@/lib/billing/plans";
import { sendTeamInviteEmail } from "@/lib/team/invite-email";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type InviteRequest = {
  email?: string;
  role?: "admin" | "member";
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as InviteRequest;
  const email = body.email?.trim().toLowerCase();
  const role = body.role === "admin" ? "admin" : "member";

  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to invite teammates." }, { status: 401 });
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

  if (membership.role !== "owner" && membership.role !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can invite teammates." }, { status: 403 });
  }

  if (membership.role === "admin" && role === "admin") {
    return NextResponse.json({ error: "Only owners can invite admins." }, { status: 403 });
  }

  const service = createSupabaseServiceClient();
  const isExistingMember = await emailBelongsToOrganizationMember(service, membership.organization_id, email);

  if (isExistingMember) {
    return NextResponse.json({ error: "That email is already a member of this workspace." }, { status: 409 });
  }

  const capacity = await getSeatCapacity(service, membership.organization_id);

  if (capacity.used >= capacity.limit) {
    return NextResponse.json({ error: "Seat limit reached. Add an extra seat before inviting another teammate." }, { status: 400 });
  }

  const { count: existingMemberCount } = await service
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", membership.organization_id)
    .eq("user_id", user.id);

  if ((existingMemberCount ?? 0) === 0) {
    return NextResponse.json({ error: "Your membership could not be verified." }, { status: 403 });
  }

  const { data: invitation, error } = await service
    .from("team_invitations")
    .insert({
      organization_id: membership.organization_id,
      email,
      role,
      invited_by: user.id
    })
    .select("id, token")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "There is already a pending invite for that email." }, { status: 409 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appUrl = getAppUrl(request.url);
  const inviteUrl = `${appUrl}/invite/${invitation.token}`;
  const { data: organization } = await service
    .from("organizations")
    .select("name")
    .eq("id", membership.organization_id)
    .maybeSingle();
  let emailSent = false;
  let emailSkipped: string | null = null;

  try {
    const result = await sendTeamInviteEmail({
      to: email,
      inviteUrl,
      organizationName: organization?.name ?? "your Harlo workspace",
      inviterEmail: user.email ?? null,
      role
    });
    emailSent = result.sent;
    emailSkipped = result.skipped;
  } catch (error) {
    emailSkipped = error instanceof Error ? error.message : "email_failed";
  }

  return NextResponse.json({
    id: invitation.id,
    inviteUrl,
    emailSent,
    emailSkipped
  });
}


async function emailBelongsToOrganizationMember(service: ReturnType<typeof createSupabaseServiceClient>, organizationId: string, email: string) {
  const { data: memberships } = await service
    .from("memberships")
    .select("user_id")
    .eq("organization_id", organizationId);

  const userIds = ((memberships ?? []) as Array<{ user_id: string }>).map((membership) => membership.user_id);

  if (userIds.length === 0) {
    return false;
  }

  const users = await Promise.all(userIds.map(async (userId) => {
    const { data } = await service.auth.admin.getUserById(userId);

    return data.user;
  }));

  return users.some((user) => user?.email?.toLowerCase() === email);
}

async function getSeatCapacity(service: ReturnType<typeof createSupabaseServiceClient>, organizationId: string) {
  const [{ data: billing }, { data: addOns }, { count: memberCount }, { count: pendingInviteCount }] = await Promise.all([
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
      .eq("organization_id", organizationId),
    service
      .from("team_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
  ]);
  const plan = getBillingPlan(typeof billing?.plan_key === "string" ? billing.plan_key : null);
  const extraSeats = billing?.status === "active"
    ? ((addOns ?? []) as Array<{ add_on_key: string; enabled: boolean; quantity: number }>)
      .filter((row) => row.add_on_key === "extra_seat" && row.enabled)
      .reduce((total, row) => total + Math.max(0, row.quantity ?? 0), 0)
    : 0;

  return {
    limit: plan.seats + extraSeats,
    used: (memberCount ?? 0) + (pendingInviteCount ?? 0)
  };
}

function getAppUrl(requestUrl: string) {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  const url = new URL(requestUrl);

  return `${url.protocol}//${url.host}`;
}
