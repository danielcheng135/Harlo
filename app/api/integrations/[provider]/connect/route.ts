import { NextRequest, NextResponse } from "next/server";
import { canUseIntegrationProvider, type BillingPlanKey } from "@/lib/billing/plans";
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

  const planKey = await getOrganizationPlanKey(auth.organizationId);

  if (!canUseIntegrationProvider(planKey, provider)) {
    return NextResponse.redirect(new URL(`/dashboard/integrations?integration=${provider}&status=plan_locked`, request.url));
  }

  if (!isIntegrationOAuthConfigured(provider)) {
    return NextResponse.redirect(new URL(`/dashboard/integrations?integration=${provider}&status=setup_pending`, request.url));
  }

  const state = createIntegrationOAuthState({
    organizationId: auth.organizationId,
    userId: auth.userId,
    provider,
    returnTo: "/dashboard/integrations"
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

async function getOrganizationPlanKey(organizationId: string): Promise<BillingPlanKey> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("organization_billing")
    .select("plan_key")
    .eq("organization_id", organizationId)
    .maybeSingle();

  return data?.plan_key === "growth" || data?.plan_key === "pro" ? data.plan_key : "starter";
}
