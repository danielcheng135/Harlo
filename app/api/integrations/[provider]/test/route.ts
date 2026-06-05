import { NextRequest, NextResponse } from "next/server";
import { getIntegrationAdminAuth } from "@/lib/integrations/auth";
import { getFreshIntegrationCredentials } from "@/lib/integrations/event-types";
import { normalizeGoogleSpreadsheetId, validateGoogleSheetsTarget } from "@/lib/integrations/google-sheets";
import { parseIntegrationProviderParam } from "@/lib/integrations/oauth";
import { testProviderConnection, type OAuthTokenSet } from "@/lib/integrations/providers";
import type { IntegrationProviderKey } from "@/lib/integrations/types";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type SupabaseServiceClient = ReturnType<typeof createSupabaseServiceClient>;

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
    const credentials = await getFreshIntegrationCredentials({
      supabase: service,
      integrationId: integration.id,
      provider,
      encryptedCredentials: integration.credentials_encrypted,
      requestUrl: request.url
    });
    ok = await testConfiguredProviderConnection({
      provider,
      credentials,
      service,
      organizationId: auth.organizationId,
      integrationId: integration.id
    });
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

async function testConfiguredProviderConnection({
  provider,
  credentials,
  service,
  organizationId,
  integrationId
}: {
  provider: IntegrationProviderKey;
  credentials: OAuthTokenSet;
  service: SupabaseServiceClient;
  organizationId: string;
  integrationId: string;
}) {
  if (provider !== "google_sheets") {
    return testProviderConnection(provider, credentials);
  }

  const { data: action, error } = await service
    .from("bot_integration_actions")
    .select("config")
    .eq("organization_id", organizationId)
    .eq("integration_id", integrationId)
    .eq("enabled", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const config = action?.config && typeof action.config === "object"
    ? action.config as Record<string, unknown>
    : null;
  const spreadsheetId = normalizeGoogleSpreadsheetId(config?.spreadsheetId);
  const sheetName = getString(config?.sheetName);

  if (!spreadsheetId || !sheetName) {
    return testProviderConnection(provider, credentials);
  }

  await validateGoogleSheetsTarget({
    accessToken: credentials.accessToken,
    spreadsheetId,
    sheetName
  });

  return true;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
