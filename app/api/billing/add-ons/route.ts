import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getAddOnKeyByProductId,
  getAddOnProductId,
  getAddOnPriceId,
  getAppUrl,
  getStripe
} from "@/lib/billing/stripe";
import { buildMetaStripeMetadata, getMetaAttributionFromRequest } from "@/lib/meta/attribution";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { BILLING_ADD_ONS, getBillingPlan, type AddOnKey } from "@/lib/billing/plans";

const SUPPORTED_ADD_ONS = new Set<AddOnKey>([
  "auto_recharge_credits",
  "extra_agent",
  "extra_seat",
  "remove_branding"
]);
const QUANTITY_ADD_ONS = new Set<AddOnKey>(["extra_agent", "extra_seat"]);
const CHECKOUT_SUBSCRIPTION_ADD_ONS = new Set<AddOnKey>(["extra_agent", "extra_seat", "remove_branding"]);
const AUTO_RECHARGE_CREDITS = 1000;
const AUTO_RECHARGE_AMOUNT_CENTS = 2900;

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const addOnKey = body.addOnKey as AddOnKey;

  if (!SUPPORTED_ADD_ONS.has(addOnKey)) {
    return NextResponse.json({ error: "Choose a valid add-on." }, { status: 400 });
  }

  const quantity = resolveQuantity(addOnKey, body);

  if (quantity === null) {
    return NextResponse.json({ error: "Choose a valid add-on quantity." }, { status: 400 });
  }

  const enabled = QUANTITY_ADD_ONS.has(addOnKey) ? quantity > 0 : body.enabled === true;

  if (!QUANTITY_ADD_ONS.has(addOnKey) && typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "Choose whether this add-on should be enabled." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to manage add-ons." }, { status: 401 });
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
    return NextResponse.json({ error: "Only owners and admins can manage add-ons." }, { status: 403 });
  }

  const service = createSupabaseServiceClient();
  const { data: billing } = await service
    .from("organization_billing")
    .select("plan_key, stripe_customer_id, status")
    .eq("organization_id", membership.organization_id)
    .maybeSingle();
  const { data: currentAddOn } = await service
    .from("organization_add_ons")
    .select("enabled, quantity, metadata")
    .eq("organization_id", membership.organization_id)
    .eq("add_on_key", addOnKey)
    .maybeSingle();

  if (enabled && !billing?.stripe_customer_id) {
    return NextResponse.json({ error: "Start a subscription before enabling add-ons." }, { status: 400 });
  }

  if (enabled && billing?.status !== "active") {
    return NextResponse.json({ error: "Add-ons are only available on an active paid plan." }, { status: 400 });
  }

  const capacityError = await validateCapacityChange({
    addOnKey,
    quantity,
    organizationId: membership.organization_id,
    planKey: billing?.plan_key,
    service
  });

  if (capacityError) {
    return NextResponse.json({ error: capacityError }, { status: 400 });
  }

  let metadata: Record<string, unknown> = isRecord(currentAddOn?.metadata) ? currentAddOn.metadata : {};

  if (addOnKey === "auto_recharge_credits") {
    metadata = enabled
      ? {
          ...metadata,
          enabled_without_initial_charge: true,
          next_charge_amount_cents: AUTO_RECHARGE_AMOUNT_CENTS,
          credits_per_recharge: AUTO_RECHARGE_CREDITS,
          updated_from: "billing_add_on_toggle"
        }
      : {
          ...metadata,
          disabled_at: new Date().toISOString(),
          updated_from: "billing_add_on_toggle"
        };

    return upsertLocalAddOn({
      addOnKey,
      enabled,
      metadata,
      organizationId: membership.organization_id,
      quantity,
      service
    });
  }

  if (CHECKOUT_SUBSCRIPTION_ADD_ONS.has(addOnKey)) {
    const customerId = billing?.stripe_customer_id ?? null;
    const currentQuantity = currentAddOn?.enabled ? Math.max(0, currentAddOn.quantity ?? 0) : 0;

    if (enabled && !customerId) {
      return NextResponse.json({ error: "Start a subscription before enabling this add-on." }, { status: 400 });
    }

    if (enabled && currentAddOn?.enabled && currentQuantity === quantity) {
      return NextResponse.json({ addOnKey, enabled: true, quantity: currentQuantity, requiresStripe: false });
    }

    if (enabled) {
      try {
        const subscriptionId = typeof metadata.stripe_subscription_id === "string" ? metadata.stripe_subscription_id : null;
        const result = subscriptionId && currentAddOn?.enabled
          ? await updateMonthlyAddOnSubscriptionQuantity({
            addOnKey,
            organizationId: membership.organization_id,
            quantity,
            subscriptionId,
            customerId,
            requestUrl: request.url,
            metaMetadata
          })
          : await createMonthlyAddOnCheckout({
            addOnKey,
            organizationId: membership.organization_id,
            customerId,
            quantity,
            requestUrl: request.url,
            metaMetadata
          });

        return NextResponse.json({
          addOnKey,
          enabled: currentAddOn?.enabled ?? false,
          quantity: currentAddOn?.quantity ?? 0,
          ...result
        });
      } catch (error) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
      }
    }

    try {
      await cancelMonthlyAddOnSubscription(metadata);
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
    }

    return upsertLocalAddOn({
      addOnKey,
      enabled: false,
      metadata: {
        ...metadata,
        disabled_at: new Date().toISOString(),
        updated_from: "billing_add_on_toggle"
      },
      organizationId: membership.organization_id,
      quantity: 0,
      service
    });
  }

  return upsertLocalAddOn({
    addOnKey,
    enabled,
    metadata,
    organizationId: membership.organization_id,
    quantity,
    service
  });
}

async function upsertLocalAddOn({
  addOnKey,
  enabled,
  metadata,
  organizationId,
  quantity,
  service
}: {
  addOnKey: AddOnKey;
  enabled: boolean;
  metadata: Record<string, unknown>;
  organizationId: string;
  quantity: number;
  service: ReturnType<typeof createSupabaseServiceClient>;
}) {
  const { error } = await service.from("organization_add_ons").upsert({
    organization_id: organizationId,
    add_on_key: addOnKey,
    enabled,
    quantity,
    metadata,
    updated_at: new Date().toISOString()
  }, {
    onConflict: "organization_id,add_on_key"
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ addOnKey, enabled, quantity });
}

async function createMonthlyAddOnCheckout({
  addOnKey,
  organizationId,
  customerId,
  quantity,
  requestUrl,
  metaMetadata
}: {
  addOnKey: AddOnKey;
  organizationId: string;
  customerId: string;
  quantity: number;
  requestUrl: string;
  metaMetadata: Record<string, string>;
}) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe is not configured for add-on billing.");
  }

  const priceId = await resolveOrCreateMonthlyAddOnPriceId(stripe, addOnKey);
  const appUrl = getAppUrl(requestUrl);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity
      }
    ],
    success_url: `${appUrl}/dashboard/billing?checkout=success&add_on=${addOnKey}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=canceled&add_on=${addOnKey}`,
    metadata: {
      organization_id: organizationId,
      add_on_key: addOnKey,
      purchase_type: "subscription_add_on",
      ...metaMetadata
    },
    subscription_data: {
      metadata: {
        organization_id: organizationId,
        add_on_key: addOnKey,
        purchase_type: "subscription_add_on",
        ...metaMetadata
      }
    }
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout page for this add-on.");
  }

  return {
    url: session.url,
    requiresStripe: true
  };
}

async function updateMonthlyAddOnSubscriptionQuantity({
  addOnKey,
  customerId,
  organizationId,
  quantity,
  requestUrl,
  subscriptionId,
  metaMetadata
}: {
  addOnKey: AddOnKey;
  customerId: string;
  organizationId: string;
  quantity: number;
  requestUrl: string;
  subscriptionId: string;
  metaMetadata: Record<string, string>;
}) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe is not configured for add-on billing.");
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product", "latest_invoice"]
  });

  if (subscription.status !== "active") {
    return createMonthlyAddOnCheckout({
      addOnKey,
      organizationId,
      customerId,
      quantity,
      requestUrl,
      metaMetadata
    });
  }

  const existingItem = await findSubscriptionAddOnItem(stripe, subscription, addOnKey);
  const priceId = existingItem?.price.id ?? await resolveOrCreateMonthlyAddOnPriceId(stripe, addOnKey);
  const item: Stripe.SubscriptionUpdateParams.Item = existingItem
    ? {
        id: existingItem.id,
        quantity
      }
    : {
        price: priceId,
        quantity,
        metadata: {
          organization_id: organizationId,
          add_on_key: addOnKey
        }
      };
  const updated = await stripe.subscriptions.update(subscriptionId, {
    items: [item],
    proration_behavior: "always_invoice",
    payment_behavior: "pending_if_incomplete",
    expand: ["latest_invoice"],
    metadata: {
      ...subscription.metadata,
      organization_id: organizationId,
      add_on_key: addOnKey,
      purchase_type: "subscription_add_on",
      ...metaMetadata
    }
  });
  const invoice = getExpandedInvoice(updated.latest_invoice);

  if (invoice?.hosted_invoice_url && invoice.status !== "paid") {
    return {
      url: invoice.hosted_invoice_url,
      requiresStripe: true
    };
  }

  return {
    enabled: quantity > 0,
    quantity,
    requiresStripe: false
  };
}

async function cancelMonthlyAddOnSubscription(metadata: Record<string, unknown>) {
  const subscriptionId = typeof metadata.stripe_subscription_id === "string" ? metadata.stripe_subscription_id : null;

  if (!subscriptionId) {
    return;
  }

  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe is not configured for add-on billing.");
  }

  await stripe.subscriptions.cancel(subscriptionId);
}

function resolveQuantity(addOnKey: AddOnKey, body: Record<string, unknown>) {
  if (!QUANTITY_ADD_ONS.has(addOnKey)) {
    return body.enabled === true ? 1 : 0;
  }

  const rawQuantity = body.quantity;

  if (typeof rawQuantity !== "number" || !Number.isInteger(rawQuantity) || rawQuantity < 0 || rawQuantity > 99) {
    return null;
  }

  return rawQuantity;
}

async function validateCapacityChange({
  addOnKey,
  quantity,
  organizationId,
  planKey,
  service
}: {
  addOnKey: AddOnKey;
  quantity: number;
  organizationId: string;
  planKey: unknown;
  service: ReturnType<typeof createSupabaseServiceClient>;
}) {
  if (addOnKey !== "extra_agent" && addOnKey !== "extra_seat") {
    return null;
  }

  const plan = getBillingPlan(typeof planKey === "string" ? planKey : null);
  const included = addOnKey === "extra_agent" ? plan.includedAgents : plan.seats;
  const used = await getCurrentCapacityUsage(service, organizationId, addOnKey);
  const requiredAddOnQuantity = Math.max(0, used - included);

  if (quantity >= requiredAddOnQuantity) {
    return null;
  }

  if (addOnKey === "extra_agent") {
    return `This workspace is using ${used} agents. Remove agents before lowering extra agents below ${requiredAddOnQuantity}.`;
  }

  return `This workspace has ${used} seats in use. Remove team members before lowering extra seats below ${requiredAddOnQuantity}.`;
}

async function getCurrentCapacityUsage(
  service: ReturnType<typeof createSupabaseServiceClient>,
  organizationId: string,
  addOnKey: AddOnKey
) {
  if (addOnKey === "extra_agent") {
    const { count } = await service
      .from("bots")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active");

    return count ?? 0;
  }

  const [{ count: memberCount }, { count: pendingInviteCount }] = await Promise.all([
    service
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    service
      .from("team_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
  ]);

  return (memberCount ?? 0) + (pendingInviteCount ?? 0);
}

async function resolveOrCreateMonthlyAddOnPriceId(stripe: Stripe, addOnKey: AddOnKey) {
  const configuredPriceId = getAddOnPriceId(addOnKey);

  if (configuredPriceId) {
    const configuredPrice = await stripe.prices.retrieve(configuredPriceId);

    if (
      configuredPrice.active &&
      configuredPrice.recurring?.interval === "month" &&
      (configuredPrice.recurring.interval_count ?? 1) === 1
    ) {
      return configuredPrice.id;
    }

    throw new Error("The configured Stripe add-on price must be an active monthly recurring price.");
  }

  const addOn = getBillingAddOn(addOnKey);
  const productId = await resolveOrCreateAddOnProductId(stripe, addOnKey);
  const prices = await stripe.prices.list({
    active: true,
    product: productId,
    type: "recurring",
    limit: 100
  });
  const amount = addOn.price * 100;
  const existingPrice = prices.data.find((price) =>
    price.unit_amount === amount &&
    price.recurring?.interval === "month" &&
    (price.recurring.interval_count ?? 1) === 1
  );

  if (existingPrice) {
    return existingPrice.id;
  }

  const price = await stripe.prices.create({
    currency: "usd",
    product: productId,
    unit_amount: amount,
    recurring: {
      interval: "month",
      interval_count: 1
    },
    metadata: {
      add_on_key: addOnKey,
      billing_behavior: "separate_monthly_subscription"
    }
  });

  return price.id;
}

async function resolveOrCreateAddOnProductId(stripe: Stripe, addOnKey: AddOnKey) {
  const configuredProductId = getAddOnProductId(addOnKey);

  if (configuredProductId) {
    return configuredProductId;
  }

  const products = await stripe.products.list({
    active: true,
    limit: 100
  });
  const existingProduct = products.data.find((product) => product.metadata.add_on_key === addOnKey);

  if (existingProduct) {
    return existingProduct.id;
  }

  const addOn = getBillingAddOn(addOnKey);
  const product = await stripe.products.create({
    name: addOn.name,
    metadata: {
      add_on_key: addOnKey
    }
  });

  return product.id;
}

async function findSubscriptionAddOnItem(stripe: Stripe, subscription: Stripe.Subscription, addOnKey: AddOnKey) {
  for (const item of subscription.items.data) {
    const productId = getStripeId(item.price?.product);

    if (!productId) {
      continue;
    }

    const configuredAddOnKey = getAddOnKeyByProductId(productId);

    if (configuredAddOnKey === addOnKey) {
      return item;
    }

    const product = typeof item.price?.product === "object" && item.price.product && !("deleted" in item.price.product)
      ? item.price.product
      : await stripe.products.retrieve(productId);

    if ("metadata" in product && product.metadata.add_on_key === addOnKey) {
      return item;
    }
  }

  return null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Could not update this add-on.";
}

function getBillingAddOn(addOnKey: AddOnKey) {
  const addOn = BILLING_ADD_ONS.find((item) => item.key === addOnKey);

  if (!addOn) {
    throw new Error("Choose a valid add-on.");
  }

  return addOn;
}

function getExpandedInvoice(value: string | Stripe.Invoice | null | undefined) {
  return typeof value === "object" && value ? value : null;
}

function getStripeId(value: string | Stripe.Product | Stripe.DeletedProduct | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
