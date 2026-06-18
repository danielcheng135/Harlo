import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";
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

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

type CheckoutSuccessPageProps = {
  searchParams?: Promise<{
    session_id?: string;
    welcome?: string;
    meta_event?: string;
  }>;
};

export default async function OnboardingCheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const sessionId = params?.session_id;

  if (!sessionId) {
    redirect("/onboarding/checkout?checkout=missing-session");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(`/onboarding/checkout/success?session_id=${sessionId}`)}`);
  }

  const stripe = getStripe();

  if (!stripe) {
    redirect("/onboarding/checkout?checkout=stripe-not-configured");
  }

  const session = await stripe.checkout.sessions
    .retrieve(sessionId, { expand: ["subscription"] })
    .catch(() => null);
  const subscription = session ? await getCheckoutSubscription(stripe, session) : null;
  const organizationId = subscription?.metadata.organization_id ?? session?.metadata?.organization_id;

  if (!session || !subscription || !organizationId) {
    redirect("/onboarding/checkout?checkout=processing");
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const plan = await resolveSubscriptionPlan(stripe, subscription);
  const planKey = isBillingPlanKey(subscription.metadata.plan_key) ? subscription.metadata.plan_key : plan?.planKey;
  const interval = isBillingInterval(subscription.metadata.billing_interval) ? subscription.metadata.billing_interval : plan?.interval;

  if (!planKey || !interval) {
    redirect("/onboarding/checkout?checkout=processing");
  }

  const status = normalizeStripeStatus(subscription.status);
  const service = createSupabaseServiceClient();

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

  if (status === "active" || status === "trialing") {
    const [{ data: organization }, { data: bot }] = await Promise.all([
      service
        .from("organizations")
        .select("id")
        .eq("id", organizationId)
        .maybeSingle(),
      service
        .from("bots")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()
    ]);

    if (!organization || !bot) {
      redirect("/onboarding");
    }

    const dashboardUrl = new URL("/dashboard", "https://harlo.local");
    const newCustomer = session.metadata?.google_ads_new_customer ?? "true";

    if (params?.welcome === "1") {
      dashboardUrl.searchParams.set("welcome", "1");
      dashboardUrl.searchParams.set("post_checkout_setup", "1");
    }

    dashboardUrl.searchParams.set("gads_conversion", "checkout");
    dashboardUrl.searchParams.set("gads_transaction_id", sessionId);
    dashboardUrl.searchParams.set("gads_new_customer", newCustomer === "true" ? "true" : "false");
    dashboardUrl.searchParams.set("meta_event", status === "trialing" ? "StartTrial" : "Subscribe");
    dashboardUrl.searchParams.set("meta_event_id", sessionId);

    redirect(`${dashboardUrl.pathname}${dashboardUrl.search}` as Route);
  }

  redirect("/onboarding/checkout?checkout=processing");
}

async function getCheckoutSubscription(stripe: Stripe, session: Stripe.Checkout.Session) {
  if (!session.subscription) {
    return null;
  }

  if (typeof session.subscription === "string") {
    return stripe.subscriptions.retrieve(session.subscription);
  }

  return session.subscription as Stripe.Subscription;
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
