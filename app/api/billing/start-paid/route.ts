import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getBillingIntervalFromStripeInterval,
  getAppUrl,
  getPlanKeyByProductId,
  getStripe,
  isBillingInterval,
  isBillingPlanKey,
  resolvePlanPriceId
} from "@/lib/billing/stripe";
import { buildMetaStripeMetadata, getMetaAttributionFromRequest } from "@/lib/meta/attribution";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import type { BillingInterval, BillingPlanKey, BillingStatus } from "@/lib/billing/plans";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.json().catch(() => ({}));

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
  const metaMetadata = buildMetaStripeMetadata({
    attribution: getMetaAttributionFromRequest(request, body.eventSourceUrl),
    userId: user.id
  });

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

  const service = createSupabaseServiceClient();
  const { data: billing } = await service
    .from("organization_billing")
    .select("plan_key, billing_interval, status, stripe_customer_id, stripe_subscription_id")
    .eq("organization_id", membership.organization_id)
    .maybeSingle();

  if (billing?.status === "active") {
    return NextResponse.json({
      ok: true,
      status: "active",
      periodEnd: null
    });
  }

  if (billing?.status !== "trialing") {
    return NextResponse.json({ error: "Only trialing subscriptions can be started early." }, { status: 400 });
  }

  const planKey = isBillingPlanKey(billing.plan_key) ? billing.plan_key : "starter";
  const interval = isBillingInterval(billing.billing_interval) ? billing.billing_interval : "monthly";

  if (!billing.stripe_subscription_id) {
    return startCardlessTrialCheckout({
      request,
      stripe,
      service,
      organizationId: membership.organization_id,
      user: {
        id: user.id,
        email: user.email ?? null
      },
      planKey,
      interval,
      customerId: typeof billing.stripe_customer_id === "string" ? billing.stripe_customer_id : null,
      metaMetadata
    });
  }

  try {
    const subscription = await stripe.subscriptions.update(billing.stripe_subscription_id, {
      trial_end: "now",
      proration_behavior: "always_invoice",
      payment_behavior: "pending_if_incomplete",
      metadata: metaMetadata,
      expand: ["latest_invoice"]
    });
    const resolvedPlan = await resolveSubscriptionPlan(stripe, subscription);
    const syncedPlanKey = resolvedPlan?.planKey ?? planKey;
    const syncedInterval = resolvedPlan?.interval ?? interval;
    const status = normalizeStripeStatus(subscription.status);

    await syncBillingFromSubscription({
      service,
      organizationId: membership.organization_id,
      subscription,
      planKey: syncedPlanKey,
      interval: syncedInterval,
      status
    });

    const invoice = getExpandedInvoice(subscription.latest_invoice);

    if (invoice?.hosted_invoice_url && invoice.status !== "paid") {
      return NextResponse.json({
        ok: true,
        status,
        periodEnd: toIso(subscription.current_period_end),
        url: invoice.hosted_invoice_url
      });
    }

    return NextResponse.json({
      ok: true,
      status,
      periodEnd: toIso(subscription.current_period_end)
    });
  } catch (error) {
    const message = getStripePaymentErrorMessage(error);

    return NextResponse.json({
      error: message,
      paymentRequired: true
    }, { status: 402 });
  }
}

async function startCardlessTrialCheckout({
  request,
  stripe,
  service,
  organizationId,
  user,
  planKey,
  interval,
  customerId,
  metaMetadata
}: {
  request: NextRequest;
  stripe: Stripe;
  service: ReturnType<typeof createSupabaseServiceClient>;
  organizationId: string;
  user: {
    id: string;
    email: string | null;
  };
  planKey: BillingPlanKey;
  interval: BillingInterval;
  customerId: string | null;
  metaMetadata: Record<string, string>;
}) {
  const priceId = await resolvePlanPriceId(stripe, planKey, interval);

  if (!priceId) {
    return NextResponse.json({
      error: "Stripe price not found for this plan and interval. Add price IDs or product IDs to the environment."
    }, { status: 400 });
  }

  const { data: organization } = await service
    .from("organizations")
    .select("id, name")
    .eq("id", organizationId)
    .single();

  if (!organization) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  let resolvedCustomerId = customerId;

  if (!resolvedCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: organization.name,
      metadata: {
        organization_id: organization.id,
        meta_user_id: user.id,
        ...metaMetadata
      }
    });
    resolvedCustomerId = customer.id;
  }

  await service.from("organization_billing").upsert({
    organization_id: organization.id,
    stripe_customer_id: resolvedCustomerId,
    updated_at: new Date().toISOString()
  }, {
    onConflict: "organization_id"
  });

  const appUrl = getAppUrl(request.url);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: resolvedCustomerId,
    payment_method_collection: "always",
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    allow_promotion_codes: true,
    success_url: `${appUrl}/dashboard/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=canceled`,
    subscription_data: {
      metadata: {
        organization_id: organization.id,
        plan_key: planKey,
        billing_interval: interval,
        meta_user_id: user.id,
        ...metaMetadata
      }
    },
    metadata: {
      organization_id: organization.id,
      plan_key: planKey,
      billing_interval: interval,
      purchase_type: "subscription_conversion",
      google_ads_new_customer: "true",
      meta_user_id: user.id,
      ...metaMetadata
    }
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    status: "checkout_required",
    url: session.url
  });
}

async function syncBillingFromSubscription({
  service,
  organizationId,
  subscription,
  planKey,
  interval,
  status
}: {
  service: ReturnType<typeof createSupabaseServiceClient>;
  organizationId: string;
  subscription: Stripe.Subscription;
  planKey: BillingPlanKey;
  interval: BillingInterval;
  status: BillingStatus;
}) {
  await service.from("organization_billing").upsert({
    organization_id: organizationId,
    plan_key: planKey,
    billing_interval: interval,
    status,
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

async function resolveSubscriptionPlan(stripe: Stripe, subscription: Stripe.Subscription): Promise<{
  planKey: BillingPlanKey;
  interval: BillingInterval;
} | null> {
  for (const item of subscription.items.data) {
    const productId = getStripeId(item.price?.product);
    const interval = item.price?.recurring?.interval ? getBillingIntervalFromStripeInterval(item.price.recurring.interval) : null;

    if (!productId || !interval) {
      continue;
    }

    const planKey = getPlanKeyByProductId(productId);

    if (planKey) {
      return { planKey, interval };
    }

    const product = await stripe.products.retrieve(productId);
    const metadataPlanKey = product.metadata.plan_key;

    if (isBillingPlanKey(metadataPlanKey)) {
      return { planKey: metadataPlanKey, interval };
    }
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

function getExpandedInvoice(value: string | Stripe.Invoice | null | undefined) {
  return typeof value === "object" && value ? value : null;
}

function getStripePaymentErrorMessage(error: unknown) {
  if (error instanceof Stripe.errors.StripeCardError) {
    return error.message;
  }

  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    return error.message;
  }

  return "Payment could not be collected. Update your payment method, then try again.";
}
