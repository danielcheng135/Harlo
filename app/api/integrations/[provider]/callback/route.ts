import { NextRequest, NextResponse } from "next/server";
import { encryptIntegrationCredentials } from "@/lib/integrations/credentials";
import { getIntegrationAdminAuth } from "@/lib/integrations/auth";
import { exchangeProviderCode } from "@/lib/integrations/providers";
import { parseIntegrationProviderParam } from "@/lib/integrations/oauth";
import { verifyIntegrationOAuthState } from "@/lib/integrations/state";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { provider: providerParam } = await context.params;
  const provider = parseIntegrationProviderParam(providerParam);
  const returnUrl = new URL("/dashboard/integrations", request.url);

  if (!provider) {
    returnUrl.searchParams.set("status", "unsupported");
    return NextResponse.redirect(returnUrl);
  }

  const searchParams = request.nextUrl.searchParams;
  const providerError = searchParams.get("error");

  if (providerError) {
    returnUrl.searchParams.set("integration", provider);
    returnUrl.searchParams.set("status", "oauth_denied");
    returnUrl.searchParams.set("reason", providerError.slice(0, 80));
    return NextResponse.redirect(returnUrl);
  }

  const state = verifyIntegrationOAuthState(searchParams.get("state"));
  const code = searchParams.get("code");

  if (!state || state.provider !== provider || !code) {
    returnUrl.searchParams.set("integration", provider);
    returnUrl.searchParams.set("status", "invalid_state");
    return NextResponse.redirect(returnUrl);
  }

  const auth = await getIntegrationAdminAuth();

  if ("response" in auth) {
    return auth.response;
  }

  if (auth.userId !== state.userId || auth.organizationId !== state.organizationId) {
    returnUrl.searchParams.set("integration", provider);
    returnUrl.searchParams.set("status", "workspace_mismatch");
    return NextResponse.redirect(returnUrl);
  }

  try {
    const tokenSet = await exchangeProviderCode({
      provider,
      requestUrl: request.url,
      code
    });
    const service = createSupabaseServiceClient();
    const now = new Date().toISOString();
    const { error } = await service.from("integrations").upsert({
      organization_id: auth.organizationId,
      provider,
      status: "connected",
      display_name: tokenSet.providerAccountName,
      credentials_encrypted: encryptIntegrationCredentials(tokenSet),
      config: {
        provider_account_id: tokenSet.providerAccountId,
        provider_account_name: tokenSet.providerAccountName,
        scope: tokenSet.scope,
        token_type: tokenSet.tokenType,
        expires_at: tokenSet.expiresAt
      },
      connected_by: auth.userId,
      connected_at: now,
      last_success_at: now,
      last_error: null,
      updated_at: now
    }, {
      onConflict: "organization_id,provider"
    });

    if (error) {
      throw error;
    }

    const redirectTo = new URL(state.returnTo, request.url);
    redirectTo.searchParams.set("integration", provider);
    redirectTo.searchParams.set("status", "connected");

    return NextResponse.redirect(redirectTo);
  } catch (error) {
    console.error(`Could not connect ${provider}`, error);
    returnUrl.searchParams.set("integration", provider);
    returnUrl.searchParams.set("status", "connect_failed");
    returnUrl.searchParams.set("reason", error instanceof Error ? error.message.slice(0, 120) : "unknown");

    return NextResponse.redirect(returnUrl);
  }
}
