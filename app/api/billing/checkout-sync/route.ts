import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import type { AddOnKey } from "@/lib/billing/plans";

const QUANTITY_ADD_ONS = new Set<AddOnKey>(["extra_agent", "extra_seat"]);

export async function POST(request: NextRequest) {
  const stripe = getStripe();

  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;

  if (!sessionId) {
    return NextResponse.json({ error: "Missing checkout session." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to sync checkout." }, { status: 401 });
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
    return NextResponse.json({ error: "Only owners and admins can sync billing checkout." }, { status: 403 });
  }

  const service = createSupabaseServiceClient();
  const { data: billing } = await service
    .from("organization_billing")
    .select("stripe_customer_id, status")
    .eq("organization_id", membership.organization_id)
    .maybeSingle();

  if (billing?.status !== "active") {
    return NextResponse.json({ error: "Add-ons are only available on an active paid plan." }, { status: 400 });
  }

  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"]
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
  const organizationId = session.metadata?.organization_id;
  const addOnKey = session.metadata?.add_on_key;

  if (session.metadata?.purchase_type !== "subscription_add_on" || !isAddOnKey(addOnKey)) {
    return NextResponse.json({ error: "This checkout session is not an add-on purchase." }, { status: 400 });
  }

  if (organizationId !== membership.organization_id) {
    return NextResponse.json({ error: "This checkout session belongs to another workspace." }, { status: 403 });
  }

  if (billing.stripe_customer_id && getStripeId(session.customer) !== billing.stripe_customer_id) {
    return NextResponse.json({ error: "This checkout session belongs to another Stripe customer." }, { status: 403 });
  }

  if (session.status !== "complete" || session.payment_status !== "paid") {
    return NextResponse.json({ error: "Stripe checkout has not completed payment yet." }, { status: 402 });
  }

  let subscription: Stripe.Subscription | null;

  try {
    subscription = await resolveCheckoutSubscription(stripe, session);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }

  if (!subscription) {
    return NextResponse.json({ error: "Stripe did not return an add-on subscription." }, { status: 400 });
  }

  if (subscription.status !== "active") {
    return NextResponse.json({ error: "Stripe add-on subscription is not active yet." }, { status: 400 });
  }

  const item = subscription.items.data[0] ?? null;
  const quantity = QUANTITY_ADD_ONS.has(addOnKey) ? Math.max(0, item?.quantity ?? 0) : 1;
  const syncedAt = new Date().toISOString();

  await service.from("organization_add_ons").upsert({
    organization_id: organizationId,
    add_on_key: addOnKey,
    enabled: quantity > 0,
    quantity,
    metadata: {
      stripe_checkout_session_id: session.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: getStripeId(subscription.customer),
      stripe_price_id: item?.price.id ?? null,
      stripe_subscription_item_id: item?.id ?? null,
      stripe_status: subscription.status,
      plan_status: billing.status,
      current_period_start: toIso(subscription.current_period_start),
      current_period_end: toIso(subscription.current_period_end),
      synced_at: syncedAt,
      synced_from: "stripe_checkout_sync"
    },
    updated_at: syncedAt
  }, {
    onConflict: "organization_id,add_on_key"
  });

  return NextResponse.json({ ok: true, addOnKey, enabled: quantity > 0, quantity });
}

async function resolveCheckoutSubscription(stripe: Stripe, session: Stripe.Checkout.Session) {
  const subscription = session.subscription;

  if (typeof subscription === "object" && subscription && !("deleted" in subscription)) {
    return subscription;
  }

  if (typeof subscription !== "string") {
    return null;
  }

  return stripe.subscriptions.retrieve(subscription);
}

function isAddOnKey(value: string | null | undefined): value is AddOnKey {
  return value === "auto_recharge_credits" || value === "extra_agent" || value === "extra_seat" || value === "remove_branding";
}

function toIso(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function getStripeId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Checkout could not be synced.";
}
