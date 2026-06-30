import { NextRequest, NextResponse } from "next/server";
import { canUseIntegrationProvider, type BillingPlanKey, type BillingStatus } from "@/lib/billing/plans";
import { getIntegrationAdminAuth } from "@/lib/integrations/auth";
import { getProviderAuthorizationUrl } from "@/lib/integrations/providers";
import { createIntegrationOAuthState } from "@/lib/integrations/state";
import { parseIntegrationProviderParam, isIntegrationOAuthConfigured } from "@/lib/integrations/oauth";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { provider: providerParam } = await context.params;
  const provider = parseIntegrationProviderParam(providerParam);

  if (!provider) {
    return NextResponse.redirect(new URL("/dashboard/integrations?integration=unknown&status=unsupported", request.url));
  }

  const auth = await getIntegrationAdminAuth();

  if ("response" in auth) {
    return auth.response;
  }

  const billing = await getOrganizationBillingAccess(auth.organizationId);

  if (!canUseIntegrationProvider(billing.planKey, provider, billing.status)) {
    return NextResponse.redirect(new URL(`/dashboard/integrations?integration=${provider}&status=plan_locked`, request.url));
  }

  if (!isIntegrationOAuthConfigured(provider)) {
    return NextResponse.redirect(new URL(`/dashboard/integrations?integration=${provider}&status=setup_pending`, request.url));
  }

  const state = createIntegrationOAuthState({
    organizationId: auth.organizationId,
    userId: auth.userId,
    provider,
    returnTo: new URL("/dashboard/integrations", request.url).toString()
  });
  const authorizationUrl = getProviderAuthorizationUrl({
    provider,
    requestUrl: request.url,
    state
  });

  if (!authorizationUrl) {
    return NextResponse.redirect(new URL(`/dashboard/integrations?integration=${provider}&status=setup_pending`, request.url));
  }

  return NextResponse.redirect(authorizationUrl);
}

async function getOrganizationBillingAccess(organizationId: string): Promise<{ planKey: BillingPlanKey; status: BillingStatus }> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("organization_billing")
    .select("plan_key, status")
    .eq("organization_id", organizationId)
    .maybeSingle();
  const status = data?.status === "trialing" || data?.status === "active" || data?.status === "past_due" || data?.status === "canceled" || data?.status === "incomplete"
    ? data.status
    : "incomplete";

  return {
    planKey: data?.plan_key === "growth" || data?.plan_key === "pro" ? data.plan_key : "starter",
    status
  };
}
