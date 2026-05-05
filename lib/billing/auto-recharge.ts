import Stripe from "stripe";
import { createAutoRechargeCreditGrant, getCreditUsageStatus } from "@/lib/billing/usage";
import { getStripe } from "@/lib/billing/stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type SupabaseServiceClient = ReturnType<typeof createSupabaseServiceClient>;

type AutoRechargeResult = {
  recharged: boolean;
  skipped: string | null;
  paymentIntentId?: string;
};

type AutoRechargeAddOnRow = {
  enabled?: boolean;
  metadata?: Record<string, unknown> | null;
};

const AUTO_RECHARGE_CREDITS = 1000;
const AUTO_RECHARGE_AMOUNT_CENTS = 2900;

export function isAutoRechargeFailureReason(reason: string | null | undefined) {
  return reason === "stripe_not_configured" ||
    reason === "missing_stripe_customer" ||
    reason === "missing_payment_method" ||
    reason === "payment_failed" ||
    reason?.startsWith("payment_") === true;
}

export async function attemptAutoRecharge({
  supabase,
  organizationId
}: {
  supabase: SupabaseServiceClient;
  organizationId: string;
}): Promise<AutoRechargeResult> {
  const [{ data: addOn }, { data: billing }, { data: organization }] = await Promise.all([
    supabase
      .from("organization_add_ons")
      .select("enabled, metadata")
      .eq("organization_id", organizationId)
      .eq("add_on_key", "auto_recharge_credits")
      .maybeSingle(),
    supabase
      .from("organization_billing")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .maybeSingle()
  ]);
  const addOnRow = addOn as AutoRechargeAddOnRow | null;

  if (addOnRow?.enabled !== true) {
    return { recharged: false, skipped: "auto_recharge_disabled" };
  }

  const stripe = getStripe();

  if (!stripe) {
    await recordAutoRechargeFailure(supabase, organizationId, addOnRow, "stripe_not_configured");
    return { recharged: false, skipped: "stripe_not_configured" };
  }

  if (!billing?.stripe_customer_id) {
    await recordAutoRechargeFailure(supabase, organizationId, addOnRow, "missing_stripe_customer");
    return { recharged: false, skipped: "missing_stripe_customer" };
  }

  const usage = await getCreditUsageStatus(supabase, organizationId);

  if (usage.creditsRemaining > 0) {
    return { recharged: false, skipped: "credits_available" };
  }

  const paymentMethodId = await resolveDefaultPaymentMethodId(stripe, {
    customerId: billing.stripe_customer_id,
    subscriptionId: billing.stripe_subscription_id ?? null
  });

  if (!paymentMethodId) {
    await recordAutoRechargeFailure(supabase, organizationId, addOnRow, "missing_payment_method");
    return { recharged: false, skipped: "missing_payment_method" };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: AUTO_RECHARGE_AMOUNT_CENTS,
      currency: "usd",
      customer: billing.stripe_customer_id,
      payment_method: paymentMethodId,
      confirm: true,
      off_session: true,
      description: "Harlo auto-recharge credits",
      metadata: {
        organization_id: organizationId,
        add_on_key: "auto_recharge_credits",
        credits: String(AUTO_RECHARGE_CREDITS),
        organization_name: organization?.name ?? ""
      }
    }, {
      idempotencyKey: `auto-recharge-${organizationId}-${usage.start}-${usage.creditsUsed}`
    });

    if (paymentIntent.status !== "succeeded") {
      const reason = `payment_${paymentIntent.status}`;
      await recordAutoRechargeFailure(supabase, organizationId, addOnRow, reason);
      return { recharged: false, skipped: reason };
    }

    const { data: existingGrant } = await supabase
      .from("credit_grants")
      .select("id")
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .maybeSingle();

    if (!existingGrant) {
      await createAutoRechargeCreditGrant({
        supabase,
        organizationId,
        credits: AUTO_RECHARGE_CREDITS,
        stripePaymentIntentId: paymentIntent.id,
        metadata: {
          amount_cents: AUTO_RECHARGE_AMOUNT_CENTS,
          payment_intent_status: paymentIntent.status
        }
      });
    }

    await clearAutoRechargeFailure(supabase, organizationId, addOnRow);

    return { recharged: true, skipped: null, paymentIntentId: paymentIntent.id };
  } catch (error) {
    console.error("Auto-recharge payment failed", { organizationId, error });
    await recordAutoRechargeFailure(supabase, organizationId, addOnRow, "payment_failed");
    return { recharged: false, skipped: "payment_failed" };
  }
}

async function recordAutoRechargeFailure(
  supabase: SupabaseServiceClient,
  organizationId: string,
  addOn: AutoRechargeAddOnRow | null,
  reason: string
) {
  await supabase
    .from("organization_add_ons")
    .update({
      metadata: {
        ...(isRecord(addOn?.metadata) ? addOn.metadata : {}),
        last_failure_reason: reason,
        last_failed_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq("organization_id", organizationId)
    .eq("add_on_key", "auto_recharge_credits");
}

async function clearAutoRechargeFailure(
  supabase: SupabaseServiceClient,
  organizationId: string,
  addOn: AutoRechargeAddOnRow | null
) {
  const metadata = { ...(isRecord(addOn?.metadata) ? addOn.metadata : {}) };
  delete metadata.last_failure_reason;
  delete metadata.last_failed_at;

  await supabase
    .from("organization_add_ons")
    .update({
      metadata,
      updated_at: new Date().toISOString()
    })
    .eq("organization_id", organizationId)
    .eq("add_on_key", "auto_recharge_credits");
}

async function resolveDefaultPaymentMethodId(
  stripe: Stripe,
  {
    customerId,
    subscriptionId
  }: {
    customerId: string;
    subscriptionId: string | null;
  }
) {
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionPaymentMethod = getStripeId(subscription.default_payment_method);

    if (subscriptionPaymentMethod) {
      return subscriptionPaymentMethod;
    }
  }

  const customer = await stripe.customers.retrieve(customerId);

  if (customer.deleted) {
    return null;
  }

  return getStripeId(customer.invoice_settings.default_payment_method);
}

function getStripeId(value: string | Stripe.PaymentMethod | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
