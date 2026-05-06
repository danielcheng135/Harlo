import { NextRequest, NextResponse } from "next/server";
import { getAppUrl, getStripe } from "@/lib/billing/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const stripe = getStripe();

  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });
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
    return NextResponse.json({ error: "Only owners and admins can manage billing." }, { status: 403 });
  }

  const { data: billing } = await supabase
    .from("organization_billing")
    .select("stripe_customer_id")
    .eq("organization_id", membership.organization_id)
    .maybeSingle();

  if (!billing?.stripe_customer_id) {
    return NextResponse.json({ error: "No Stripe customer exists yet. Start with checkout first." }, { status: 400 });
  }

  const appUrl = getAppUrl(request.url);
  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${appUrl}/dashboard/billing`
  });

  return NextResponse.json({ url: session.url });
}
