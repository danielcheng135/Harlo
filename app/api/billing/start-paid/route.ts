import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getBillingIntervalFromStripeInterval,
  getPlanKeyByProductId,
  getStripe,
  isBillingInterval,
  isBillingPlanKey
} from "@/lib/billing/stripe";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import type { BillingInterval, BillingPlanKey, BillingStatus } from "@/lib/billing/plans";

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
    .select("plan_key, billing_interval, status, stripe_subscription_id")
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

  if (!billing.stripe_subscription_id) {
    return NextResponse.json({ error: "No active Stripe subscription was found for this trial." }, { status: 400 });
  }

  try {
    const subscription = await stripe.subscriptions.update(billing.stripe_subscription_id, {
      trial_end: "now",
      proration_behavior: "always_invoice",
      payment_behavior: "pending_if_incomplete",
      expand: ["latest_invoice"]
    });
    const resolvedPlan = await resolveSubscriptionPlan(stripe, subscription);
    const planKey = isBillingPlanKey(billing.plan_key) ? billing.plan_key : resolvedPlan?.planKey ?? "starter";
    const interval = isBillingInterval(billing.billing_interval) ? billing.billing_interval : resolvedPlan?.interval ?? "monthly";
    const status = normalizeStripeStatus(subscription.status);

    await syncBillingFromSubscription({
      service,
      organizationId: membership.organization_id,
      subscription,
      planKey,
      interval,
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
