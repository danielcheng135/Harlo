import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import type { AddOnKey } from "@/lib/billing/plans";

const SUPPORTED_ADD_ONS = new Set<AddOnKey>(["auto_recharge_credits"]);

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const addOnKey = body.addOnKey;
  const enabled = body.enabled;

  if (!SUPPORTED_ADD_ONS.has(addOnKey)) {
    return NextResponse.json({ error: "This add-on is not configurable yet." }, { status: 400 });
  }

  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Choose whether this add-on should be enabled." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to manage add-ons." }, { status: 401 });
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
    return NextResponse.json({ error: "Only owners and admins can manage add-ons." }, { status: 403 });
  }

  const service = createSupabaseServiceClient();
  const { data: billing } = await service
    .from("organization_billing")
    .select("stripe_customer_id, status")
    .eq("organization_id", membership.organization_id)
    .maybeSingle();

  if (enabled && !billing?.stripe_customer_id) {
    return NextResponse.json({ error: "Start a subscription before enabling auto-recharge." }, { status: 400 });
  }

  if (enabled && billing?.status !== "active" && billing?.status !== "trialing") {
    return NextResponse.json({ error: "Auto-recharge requires an active subscription." }, { status: 400 });
  }

  const { error } = await service.from("organization_add_ons").upsert({
    organization_id: membership.organization_id,
    add_on_key: addOnKey,
    enabled,
    quantity: enabled ? 1 : 0,
    metadata: {},
    updated_at: new Date().toISOString()
  }, {
    onConflict: "organization_id,add_on_key"
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ addOnKey, enabled });
}
