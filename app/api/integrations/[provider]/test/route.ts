import { NextRequest, NextResponse } from "next/server";
import { decryptIntegrationCredentials } from "@/lib/integrations/credentials";
import { getIntegrationAdminAuth } from "@/lib/integrations/auth";
import { parseIntegrationProviderParam } from "@/lib/integrations/oauth";
import { testProviderConnection, type OAuthTokenSet } from "@/lib/integrations/providers";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { provider: providerParam } = await context.params;
  const provider = parseIntegrationProviderParam(providerParam);
  const redirectUrl = new URL("/dashboard/integrations", request.url);

  if (!provider) {
    redirectUrl.searchParams.set("status", "unsupported");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const auth = await getIntegrationAdminAuth();

  if ("response" in auth) {
    return auth.response;
  }

  const service = createSupabaseServiceClient();
  const { data: integration } = await service
    .from("integrations")
    .select("id, credentials_encrypted")
    .eq("organization_id", auth.organizationId)
    .eq("provider", provider)
    .maybeSingle();

  if (!integration?.credentials_encrypted) {
    redirectUrl.searchParams.set("integration", provider);
    redirectUrl.searchParams.set("status", "not_connected");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  let ok = false;
  let errorMessage: string | null = null;

  try {
    const credentials = decryptIntegrationCredentials<OAuthTokenSet>(integration.credentials_encrypted);
    ok = await testProviderConnection(provider, credentials);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Connection test failed.";
  }

  const now = new Date().toISOString();
  const updatePayload = ok
    ? {
      status: "connected",
      last_success_at: now,
      last_error: null,
      updated_at: now
    }
    : {
      status: "error",
      last_error: errorMessage ?? "Connection test failed.",
      updated_at: now
    };

  await service.from("integrations").update(updatePayload).eq("id", integration.id);

  redirectUrl.searchParams.set("integration", provider);
  redirectUrl.searchParams.set("status", ok ? "test_passed" : "test_failed");

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
