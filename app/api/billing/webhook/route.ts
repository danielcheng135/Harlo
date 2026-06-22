import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getAddOnKeyByProductId,
  getBillingIntervalFromStripeInterval,
  getPlanKeyByProductId,
  getStripe
} from "@/lib/billing/stripe";
import { getMetaAttributionFromStripeMetadata, mergeMetaAttribution } from "@/lib/meta/attribution";
import { sendMetaCapiEventOnce } from "@/lib/meta/capi";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { createAutoRechargeCreditGrant } from "@/lib/billing/usage";
import type { AddOnKey, BillingStatus } from "@/lib/billing/plans";

const LEGACY_SUBSCRIPTION_ADD_ONS = ["extra_agent", "extra_seat"] satisfies AddOnKey[];
const PAID_SUBSCRIPTION_ADD_ONS = ["extra_agent", "extra_seat", "remove_branding"] satisfies AddOnKey[];
const QUANTITY_ADD_ONS = ["extra_agent", "extra_seat"] satisfies AddOnKey[];
const AUTO_RECHARGE_CREDITS = 1000;

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

  if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
    await handleInvoicePaid(stripe, event.data.object as Stripe.Invoice);
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;

    if (isCheckoutAddOnSubscription(subscription)) {
      await syncCheckoutAddOnSubscription(subscription);
    } else {
      await syncSubscription(stripe, subscription);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    if (isCheckoutAddOnSubscription(subscription)) {
      await syncCheckoutAddOnSubscription(subscription, false);
    } else {
      await markSubscriptionCanceled(subscription);
    }
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(stripe: Stripe, session: Stripe.Checkout.Session) {
  if (session.metadata?.purchase_type === "auto_recharge_enable") {
    await handleAutoRechargeCheckoutCompleted(session);
    return;
  }

  if (typeof session.subscription !== "string") {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  if (session.metadata?.purchase_type === "subscription_add_on" && isAddOnKey(session.metadata.add_on_key)) {
    await syncCheckoutAddOnSubscription(subscription, session.payment_status === "paid");
    return;
  }

  await syncSubscription(stripe, subscription);
  await sendMetaCheckoutSubscriptionEvent(stripe, session, subscription);
}

async function handleAutoRechargeCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organization_id;

  if (!organizationId || session.payment_status !== "paid") {
    return;
  }

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  const supabase = createSupabaseServiceClient();
  const grantedAt = new Date().toISOString();

  if (!paymentIntentId) {
    return;
  }

  const { data: existingGrant } = await supabase
    .from("credit_grants")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (!existingGrant) {
    await createAutoRechargeCreditGrant({
      supabase,
      organizationId,
      credits: Number(session.metadata?.credits ?? AUTO_RECHARGE_CREDITS),
      stripePaymentIntentId: paymentIntentId,
      metadata: {
        stripe_checkout_session_id: session.id,
        purchase_type: "auto_recharge_enable",
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency
      }
    });
  }

  await supabase.from("organization_add_ons").upsert({
    organization_id: organizationId,
    add_on_key: "auto_recharge_credits",
    enabled: true,
    quantity: 1,
    metadata: {
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      initial_credits_granted: Number(session.metadata?.credits ?? AUTO_RECHARGE_CREDITS),
      initial_payment_collected_at: grantedAt,
      synced_from: "stripe_webhook"
    },
    updated_at: grantedAt
  }, {
    onConflict: "organization_id,add_on_key"
  });
}

async function sendMetaCheckoutSubscriptionEvent(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  subscription: Stripe.Subscription
) {
  if (session.metadata?.purchase_type || isCheckoutAddOnSubscription(subscription)) {
    return;
  }

  const isTrial = subscription.status === "trialing";
  const isPaidSubscriptionCreation = subscription.status === "active" && session.payment_status === "paid";
  const eventName = isTrial ? "StartTrial" : isPaidSubscriptionCreation ? "Subscribe" : null;

  if (!eventName) {
    return;
  }

  const attribution = mergeMetaAttribution(
    getMetaAttributionFromStripeMetadata(session.metadata),
    getMetaAttributionFromStripeMetadata(subscription.metadata)
  );
  const customerEmail = await resolveStripeCustomerEmail(stripe, getStripeId(subscription.customer), session.customer_details?.email ?? session.customer_email);
  const userId = getMetaUserId(session.metadata, subscription.metadata);
  const price = subscription.items.data[0]?.price ?? null;
  const value = eventName === "Subscribe" ? centsToValue(session.amount_total ?? price?.unit_amount ?? null) : undefined;
  const currency = eventName === "Subscribe" ? normalizeCurrency(session.currency ?? price?.currency ?? null) : undefined;

  if (eventName === "Subscribe" && (value === undefined || !currency)) {
    return;
  }

  await sendMetaCapiEventOnce({
    event_name: eventName,
    event_id: `stripe:${subscription.id}:${eventName === "StartTrial" ? "start-trial" : "subscribe"}`,
    event_time: subscription.created ?? session.created,
    event_source_url: attribution.eventSourceUrl,
    user_data: {
      email: customerEmail,
      externalId: userId,
      fbp: attribution.fbp,
      fbc: attribution.fbc,
      clientIpAddress: attribution.clientIpAddress,
      clientUserAgent: attribution.clientUserAgent,
      subscriptionId: subscription.id
    },
    custom_data: {
      content_name: eventName === "StartTrial" ? "Harlo trial" : "Harlo paid subscription",
      value,
      currency
    }
  });
}

async function handleInvoicePaid(stripe: Stripe, invoice: Stripe.Invoice) {
  if ((invoice.amount_paid ?? 0) <= 0) {
    return;
  }

  const subscription = await resolveInvoiceSubscription(stripe, invoice);
  const subscriptionId = subscription?.id ?? getInvoiceSubscriptionId(invoice);

  if (invoice.billing_reason === "subscription_create" && subscription && !isCheckoutAddOnSubscription(subscription)) {
    return;
  }

  const attribution = getMetaAttributionFromStripeMetadata(subscription?.metadata);
  const customerEmail = await resolveStripeCustomerEmail(stripe, getStripeId(invoice.customer), invoice.customer_email);
  const userId = subscription?.metadata?.meta_user_id;
  const currency = normalizeCurrency(invoice.currency);

  if (!currency) {
    return;
  }

  await sendMetaCapiEventOnce({
    event_name: "Purchase",
    event_id: `stripe:invoice:${invoice.id}:purchase`,
    event_time: invoice.status_transitions?.paid_at ?? invoice.created,
    event_source_url: attribution.eventSourceUrl,
    user_data: {
      email: customerEmail,
      externalId: userId,
      fbp: attribution.fbp,
      fbc: attribution.fbc,
      clientIpAddress: attribution.clientIpAddress,
      clientUserAgent: attribution.clientUserAgent,
      subscriptionId
    },
    custom_data: {
      content_name: "Harlo paid invoice",
      order_id: invoice.id,
      value: centsToValue(invoice.amount_paid),
      currency
    }
  });
}

async function syncCheckoutAddOnSubscription(subscription: Stripe.Subscription, overrideEnabled?: boolean) {
  const organizationId = subscription.metadata.organization_id;
  const addOnKey = subscription.metadata.add_on_key;

  if (!organizationId || !isAddOnKey(addOnKey)) {
    return;
  }

  const syncedAt = new Date().toISOString();
  const item = subscription.items.data[0] ?? null;
  const supabase = createSupabaseServiceClient();
  const { data: billing } = await supabase
    .from("organization_billing")
    .select("status")
    .eq("organization_id", organizationId)
    .maybeSingle();
  const hasActivePlan = billing?.status === "active";
  const paidQuantity = isQuantityAddOn(addOnKey) ? Math.max(0, item?.quantity ?? 0) : 1;
  const enabled = hasActivePlan && paidQuantity > 0 && (overrideEnabled ?? subscription.status === "active");

  await supabase.from("organization_add_ons").upsert({
    organization_id: organizationId,
    add_on_key: addOnKey,
    enabled,
    quantity: enabled ? paidQuantity : 0,
    metadata: {
      stripe_subscription_id: subscription.id,
      stripe_customer_id: getStripeId(subscription.customer),
      stripe_price_id: item?.price.id ?? null,
      stripe_subscription_item_id: item?.id ?? null,
      stripe_status: subscription.status,
      plan_status: billing?.status ?? null,
      current_period_start: toIso(subscription.current_period_start),
      current_period_end: toIso(subscription.current_period_end),
      synced_at: syncedAt,
      synced_from: "stripe_checkout_subscription"
    },
    updated_at: syncedAt
  }, {
    onConflict: "organization_id,add_on_key"
  });
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

  if (subscription.status === "active") {
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
          plan_status: subscription.status,
          synced_at: syncedAt,
          synced_from: "stripe_webhook"
        }
      });
    }
  }

  if (activeAddOns.size === 0) {
    return;
  }

  const rows = Array.from(activeAddOns.entries()).map(([addOnKey, activeAddOn]) => {
    const quantity = activeAddOn.quantity;

    return {
      organization_id: organizationId,
      add_on_key: addOnKey,
      enabled: quantity > 0,
      quantity,
      metadata: activeAddOn.metadata,
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
    .in("add_on_key", PAID_SUBSCRIPTION_ADD_ONS);
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
  return (LEGACY_SUBSCRIPTION_ADD_ONS as readonly AddOnKey[]).includes(value);
}

function isQuantityAddOn(value: AddOnKey) {
  return (QUANTITY_ADD_ONS as readonly AddOnKey[]).includes(value);
}

function isCheckoutAddOnSubscription(subscription: Stripe.Subscription) {
  return subscription.metadata.purchase_type === "subscription_add_on" && isAddOnKey(subscription.metadata.add_on_key);
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

async function resolveInvoiceSubscription(stripe: Stripe, invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return null;
  }

  return stripe.subscriptions.retrieve(subscriptionId).catch(() => null);
}

async function resolveStripeCustomerEmail(stripe: Stripe, customerId: string | null, fallback?: string | null) {
  if (fallback) {
    return fallback;
  }

  if (!customerId) {
    return null;
  }

  const customer = await stripe.customers.retrieve(customerId).catch(() => null);

  if (!customer || "deleted" in customer) {
    return null;
  }

  return customer.email ?? null;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const value = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription;

  return getStripeId(value);
}

function getMetaUserId(primaryMetadata: Record<string, string> | null | undefined, fallbackMetadata: Record<string, string> | null | undefined) {
  return primaryMetadata?.meta_user_id ?? fallbackMetadata?.meta_user_id ?? null;
}

function centsToValue(cents: number | null | undefined) {
  return typeof cents === "number" ? Number((cents / 100).toFixed(2)) : undefined;
}

function normalizeCurrency(value: string | null | undefined) {
  const currency = value?.trim().toUpperCase();

  return currency || undefined;
}

function getStripeId(value: string | { id?: string | null } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}
