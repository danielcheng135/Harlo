import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAddOnProductId, getStripe, resolveAddOnPriceId } from "@/lib/billing/stripe";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { getBillingPlan, type AddOnKey } from "@/lib/billing/plans";

const SUPPORTED_ADD_ONS = new Set<AddOnKey>([
  "auto_recharge_credits",
  "extra_agent",
  "extra_seat",
  "remove_branding"
]);
const QUANTITY_ADD_ONS = new Set<AddOnKey>(["extra_agent", "extra_seat"]);
const SUBSCRIPTION_ADD_ONS = new Set<AddOnKey>(["extra_agent", "extra_seat", "remove_branding"]);

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
    .select("plan_key, stripe_customer_id, stripe_subscription_id, status")
    .eq("organization_id", membership.organization_id)
    .maybeSingle();

  if (enabled && !billing?.stripe_customer_id) {
    return NextResponse.json({ error: "Start a subscription before enabling add-ons." }, { status: 400 });
  }

  if (enabled && billing?.status !== "active" && billing?.status !== "trialing") {
    return NextResponse.json({ error: "Add-ons require an active subscription." }, { status: 400 });
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

  let metadata: Record<string, unknown> = {};

  if (SUBSCRIPTION_ADD_ONS.has(addOnKey)) {
    if (enabled && !billing?.stripe_subscription_id) {
      return NextResponse.json({ error: "No active Stripe subscription was found for this add-on." }, { status: 400 });
    }

    if (billing?.stripe_subscription_id) {
      try {
        metadata = await syncStripeSubscriptionAddOn({
          addOnKey,
          enabled,
          quantity,
          subscriptionId: billing.stripe_subscription_id
        });
      } catch (error) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
      }
    }
  }

  const { error } = await service.from("organization_add_ons").upsert({
    organization_id: membership.organization_id,
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
      .eq("organization_id", organizationId);

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

async function syncStripeSubscriptionAddOn({
  addOnKey,
  enabled,
  quantity,
  subscriptionId
}: {
  addOnKey: AddOnKey;
  enabled: boolean;
  quantity: number;
  subscriptionId: string;
}) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe is not configured for add-on billing.");
  }

  const priceId = await resolveAddOnPriceId(stripe, addOnKey);

  if (!priceId) {
    throw new Error("No active Stripe price was found for this add-on.");
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"]
  });
  const existingItem = subscription.items.data.find((item) => isMatchingAddOnItem(item, addOnKey, priceId));

  if (enabled && quantity > 0) {
    const item = existingItem
      ? await stripe.subscriptionItems.update(existingItem.id, {
          quantity,
          proration_behavior: "create_prorations"
        })
      : await stripe.subscriptionItems.create({
          subscription: subscriptionId,
          price: priceId,
          quantity,
          proration_behavior: "create_prorations"
        });

    return {
      stripe_price_id: priceId,
      stripe_subscription_item_id: item.id,
      synced_at: new Date().toISOString()
    };
  }

  if (existingItem) {
    await stripe.subscriptionItems.del(existingItem.id, {
      proration_behavior: "create_prorations"
    });
  }

  return {
    stripe_price_id: priceId,
    stripe_subscription_item_id: null,
    synced_at: new Date().toISOString()
  };
}

function isMatchingAddOnItem(item: Stripe.SubscriptionItem, addOnKey: AddOnKey, priceId: string) {
  if (item.price.id === priceId) {
    return true;
  }

  const addOnProductId = getAddOnProductId(addOnKey);
  const productId = getStripeId(item.price.product);

  return Boolean(addOnProductId && productId === addOnProductId);
}

function getStripeId(value: string | Stripe.Product | Stripe.DeletedProduct | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Could not update this add-on.";
}
