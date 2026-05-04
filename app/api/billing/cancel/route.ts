import { NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST() {
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
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "No organization found for this account." }, { status: 404 });
  }

  const service = createSupabaseServiceClient();
  const { data: billing } = await service
    .from("organization_billing")
    .select("stripe_subscription_id")
    .eq("organization_id", membership.organization_id)
    .maybeSingle();

  if (!billing?.stripe_subscription_id) {
    return NextResponse.json({ error: "No active Stripe subscription was found." }, { status: 400 });
  }

  const subscription = await stripe.subscriptions.update(billing.stripe_subscription_id, {
    cancel_at_period_end: true
  });

  await service
    .from("organization_billing")
    .update({
      cancel_at_period_end: true,
      current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : undefined,
      updated_at: new Date().toISOString()
    })
    .eq("organization_id", membership.organization_id);

  return NextResponse.json({
    canceledAtPeriodEnd: true,
    periodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null
  });
}
