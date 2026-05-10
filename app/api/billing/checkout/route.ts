import { NextRequest, NextResponse } from "next/server";
import { getAppUrl, getStripe, isBillingInterval, isBillingPlanKey, resolvePlanPriceId } from "@/lib/billing/stripe";
import { TRIAL_CONFIG } from "@/lib/billing/plans";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const planKey = body.planKey;
  const interval = body.interval;
  const successPath = sanitizePath(body.successPath, "/dashboard/billing?checkout=success");
  const cancelPath = sanitizePath(body.cancelPath, "/dashboard/billing?checkout=canceled");

  if (!isBillingPlanKey(planKey) || !isBillingInterval(interval)) {
    return NextResponse.json({ error: "Choose a valid plan and billing interval." }, { status: 400 });
  }

  const stripe = getStripe();

  if (!stripe) {
    return NextResponse.json({
      error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY to enable checkout."
    }, { status: 400 });
  }

  const priceId = await resolvePlanPriceId(stripe, planKey, interval);

  if (!priceId) {
    return NextResponse.json({
      error: "Stripe price not found for this plan and interval. Add price IDs or product IDs to the environment."
    }, { status: 400 });
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
  const [{ data: organization }, { data: billing }] = await Promise.all([
    service
      .from("organizations")
      .select("id, name")
      .eq("id", membership.organization_id)
      .single(),
    service
      .from("organization_billing")
      .select("stripe_customer_id")
      .eq("organization_id", membership.organization_id)
      .maybeSingle()
  ]);

  if (!organization) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  let customerId = billing?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: organization.name,
      metadata: {
        organization_id: organization.id
      }
    });
    customerId = customer.id;

    await service.from("organization_billing").upsert({
      organization_id: organization.id,
      stripe_customer_id: customerId
    }, {
      onConflict: "organization_id"
    });
  }

  await service.from("organization_billing").upsert({
    organization_id: organization.id,
    stripe_customer_id: customerId,
    plan_key: planKey,
    billing_interval: interval,
    status: "incomplete"
  }, {
    onConflict: "organization_id"
  });

  const appUrl = getAppUrl(request.url);
  const successUrl = buildCheckoutUrl(appUrl, successPath, true);
  const cancelUrl = buildCheckoutUrl(appUrl, cancelPath, false);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    payment_method_collection: "always",
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      ...(planKey === TRIAL_CONFIG.convertsToPlan ? { trial_period_days: TRIAL_CONFIG.days } : {}),
      metadata: {
        organization_id: organization.id,
        plan_key: planKey,
        billing_interval: interval
      }
    },
    metadata: {
      organization_id: organization.id,
      plan_key: planKey,
      billing_interval: interval
    }
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}

function sanitizePath(value: unknown, fallback: string) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function buildCheckoutUrl(appUrl: string, path: string, includeSessionId: boolean) {
  const url = new URL(path, appUrl);

  if (includeSessionId) {
    url.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
  }

  return url.toString().replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}");
}
