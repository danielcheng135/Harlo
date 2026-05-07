import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getAddOnKeyByProductId,
  getBillingIntervalFromStripeInterval,
  getPlanKeyByProductId,
  getStripe
} from "@/lib/billing/stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { AddOnKey, BillingStatus } from "@/lib/billing/plans";

const SUBSCRIPTION_ADD_ONS = ["extra_agent", "extra_seat", "remove_branding"] satisfies AddOnKey[];
const QUANTITY_ADD_ONS = ["extra_agent", "extra_seat"] satisfies AddOnKey[];

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

  await syncSubscriptionAddOns(stripe, supabase, organizationId, subscription);
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

  await disableSubscriptionAddOns(supabase, organizationId);
}

async function syncSubscriptionAddOns(
  stripe: Stripe,
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  organizationId: string,
  subscription: Stripe.Subscription
) {
  const syncedAt = new Date().toISOString();
  const activeAddOns = new Map<AddOnKey, { quantity: number; metadata: Record<string, unknown> }>();

  for (const item of subscription.items.data) {
    const addOnKey = await resolveSubscriptionAddOnItem(stripe, item);

    if (!addOnKey || !isSubscriptionAddOnKey(addOnKey)) {
      continue;
    }

    const quantity = isQuantityAddOn(addOnKey) ? Math.max(0, item.quantity ?? 0) : 1;

    activeAddOns.set(addOnKey, {
      quantity,
      metadata: {
        stripe_price_id: item.price.id,
        stripe_subscription_item_id: item.id,
        synced_at: syncedAt,
        synced_from: "stripe_webhook"
      }
    });
  }

  const rows = SUBSCRIPTION_ADD_ONS.map((addOnKey) => {
    const activeAddOn = activeAddOns.get(addOnKey);
    const quantity = activeAddOn?.quantity ?? 0;

    return {
      organization_id: organizationId,
      add_on_key: addOnKey,
      enabled: quantity > 0,
      quantity,
      metadata: activeAddOn?.metadata ?? {
        stripe_subscription_item_id: null,
        synced_at: syncedAt,
        synced_from: "stripe_webhook"
      },
      updated_at: syncedAt
    };
  });

  await supabase.from("organization_add_ons").upsert(rows, {
    onConflict: "organization_id,add_on_key"
  });
}

async function disableSubscriptionAddOns(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  organizationId: string
) {
  const disabledAt = new Date().toISOString();

  await supabase
    .from("organization_add_ons")
    .update({
      enabled: false,
      quantity: 0,
      metadata: {
        disabled_at: disabledAt,
        synced_from: "stripe_webhook"
      },
      updated_at: disabledAt
    })
    .eq("organization_id", organizationId)
    .in("add_on_key", SUBSCRIPTION_ADD_ONS);
}

async function resolveSubscriptionPlan(stripe: Stripe, subscription: Stripe.Subscription) {
  for (const item of subscription.items.data) {
    const plan = await resolveSubscriptionPlanItem(stripe, item);

    if (plan) {
      return plan;
    }
  }

  return null;
}

async function resolveSubscriptionPlanItem(stripe: Stripe, item: Stripe.SubscriptionItem) {
  const price = item.price;
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

async function resolveSubscriptionAddOnItem(stripe: Stripe, item: Stripe.SubscriptionItem) {
  const productId = getStripeId(item.price?.product);

  if (!productId) {
    return null;
  }

  const addOnKey = getAddOnKeyByProductId(productId);

  if (addOnKey) {
    return addOnKey;
  }

  const product = await stripe.products.retrieve(productId);
  const metadataAddOnKey = product.metadata.add_on_key;

  return isAddOnKey(metadataAddOnKey) ? metadataAddOnKey : null;
}

function isSubscriptionAddOnKey(value: AddOnKey): value is AddOnKey {
  return (SUBSCRIPTION_ADD_ONS as readonly AddOnKey[]).includes(value);
}

function isQuantityAddOn(value: AddOnKey) {
  return (QUANTITY_ADD_ONS as readonly AddOnKey[]).includes(value);
}

function isAddOnKey(value: string | null | undefined): value is AddOnKey {
  return value === "auto_recharge_credits" || value === "extra_agent" || value === "extra_seat" || value === "remove_branding";
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
