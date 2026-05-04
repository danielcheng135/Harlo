import Stripe from "stripe";
import {
  BILLING_PLANS,
  type BillingInterval,
  type BillingPlanKey
} from "@/lib/billing/plans";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  stripeClient ??= new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia"
  });

  return stripeClient;
}

export function getPlanPriceId(planKey: BillingPlanKey, interval: BillingInterval) {
  const envKey = `STRIPE_PRICE_${planKey.toUpperCase()}_${interval.toUpperCase()}`;

  return process.env[envKey] ?? null;
}

export function getPlanProductId(planKey: BillingPlanKey) {
  const envKey = `STRIPE_PRODUCT_${planKey.toUpperCase()}`;

  return process.env[envKey] ?? null;
}

export function getPlanKeyByProductId(productId: string) {
  return BILLING_PLANS.find((plan) => getPlanProductId(plan.key) === productId)?.key ?? null;
}

export async function resolvePlanPriceId(
  stripe: Stripe,
  planKey: BillingPlanKey,
  interval: BillingInterval
) {
  const explicitPriceId = getPlanPriceId(planKey, interval);

  if (explicitPriceId) {
    return explicitPriceId;
  }

  const productId = getPlanProductId(planKey);

  if (!productId) {
    return null;
  }

  const prices = await stripe.prices.list({
    active: true,
    product: productId,
    type: "recurring",
    limit: 100
  });
  const targetInterval = interval === "annual" ? "year" : "month";
  const price = prices.data.find((item) => item.recurring?.interval === targetInterval);

  return price?.id ?? null;
}

export function getAppUrl(requestUrl: string) {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  const url = new URL(requestUrl);

  return `${url.protocol}//${url.host}`;
}

export function isBillingPlanKey(value: unknown): value is BillingPlanKey {
  return typeof value === "string" && BILLING_PLANS.some((plan) => plan.key === value);
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "monthly" || value === "annual";
}

export function getBillingIntervalFromStripeInterval(interval: Stripe.Price.Recurring.Interval): BillingInterval | null {
  if (interval === "month") {
    return "monthly";
  }

  if (interval === "year") {
    return "annual";
  }

  return null;
}
