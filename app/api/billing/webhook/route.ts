import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getBillingIntervalFromStripeInterval,
  getPlanKeyByProductId,
  getStripe
} from "@/lib/billing/stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { BillingStatus } from "@/lib/billing/plans";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhooks are not configured." }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(stripe, event.data.object as Stripe.Checkout.Session);
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    await syncSubscription(stripe, event.data.object as Stripe.Subscription);
  }

  if (event.type === "customer.subscription.deleted") {
    await markSubscriptionCanceled(event.data.object as Stripe.Subscription);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(stripe: Stripe, session: Stripe.Checkout.Session) {
  if (typeof session.subscription !== "string") {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  await syncSubscription(stripe, subscription);
}

async function syncSubscription(stripe: Stripe, subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organization_id;

  if (!organizationId) {
    return;
  }

  const plan = await resolveSubscriptionPlan(stripe, subscription);

  if (!plan) {
    return;
  }

  const supabase = createSupabaseServiceClient();

  await supabase.from("organization_billing").upsert({
    organization_id: organizationId,
    plan_key: plan.planKey,
    billing_interval: plan.interval,
    status: normalizeStripeStatus(subscription.status),
    trial_start: toIso(subscription.trial_start),
    trial_end: toIso(subscription.trial_end),
    current_period_start: toIso(subscription.current_period_start),
    current_period_end: toIso(subscription.current_period_end),
    cancel_at_period_end: subscription.cancel_at_period_end,
    stripe_customer_id: getStripeId(subscription.customer),
    stripe_subscription_id: subscription.id,
    updated_at: new Date().toISOString()
  }, {
    onConflict: "organization_id"
  });
}

async function markSubscriptionCanceled(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organization_id;

  if (!organizationId) {
    return;
  }

  const supabase = createSupabaseServiceClient();

  await supabase
    .from("organization_billing")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString()
    })
    .eq("organization_id", organizationId);
}

async function resolveSubscriptionPlan(stripe: Stripe, subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  const price = item?.price;
  const productId = getStripeId(price?.product);
  const interval = price?.recurring?.interval ? getBillingIntervalFromStripeInterval(price.recurring.interval) : null;

  if (!productId || !interval) {
    return null;
  }

  const planKey = getPlanKeyByProductId(productId);

  if (planKey) {
    return { planKey, interval };
  }

  const product = await stripe.products.retrieve(productId);
  const metadataPlanKey = product.metadata.plan_key;

  if (metadataPlanKey === "starter" || metadataPlanKey === "growth" || metadataPlanKey === "pro") {
    return {
      planKey: metadataPlanKey,
      interval
    };
  }

  return null;
}

function normalizeStripeStatus(status: Stripe.Subscription.Status): BillingStatus {
  if (status === "trialing" || status === "active" || status === "past_due" || status === "canceled" || status === "incomplete") {
    return status;
  }

  return "incomplete";
}

function toIso(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function getStripeId(value: string | Stripe.Customer | Stripe.Product | Stripe.DeletedCustomer | Stripe.DeletedProduct | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}
