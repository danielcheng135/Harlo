import { NextRequest, NextResponse } from "next/server";
import { getIntegrationAdminAuth } from "@/lib/integrations/auth";
import { getFreshIntegrationCredentials } from "@/lib/integrations/event-types";
import { parseIntegrationProviderParam } from "@/lib/integrations/oauth";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { provider: providerParam } = await context.params;
  const provider = parseIntegrationProviderParam(providerParam);

  if (provider !== "google_sheets") {
    return NextResponse.json({ ok: false, error: "Unsupported picker provider." }, { status: 400 });
  }

  const auth = await getIntegrationAdminAuth();

  if ("response" in auth) {
    return auth.response;
  }

  const developerKey = process.env.GOOGLE_PICKER_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY;
  const appId = process.env.GOOGLE_PICKER_APP_ID ?? process.env.NEXT_PUBLIC_GOOGLE_PICKER_APP_ID;

  if (!developerKey || !appId) {
    return NextResponse.json({
      ok: false,
      error: "Google Picker is not configured. Add GOOGLE_PICKER_API_KEY and GOOGLE_PICKER_APP_ID."
    }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const { data: integration } = await service
    .from("integrations")
    .select("id, credentials_encrypted, status")
    .eq("organization_id", auth.organizationId)
    .eq("provider", provider)
    .maybeSingle();

  if (!integration?.id || integration.status !== "connected" || !integration.credentials_encrypted) {
    return NextResponse.json({ ok: false, error: "Connect Google Sheets before choosing a spreadsheet." }, { status: 409 });
  }

  const credentials = await getFreshIntegrationCredentials({
    supabase: service,
    integrationId: integration.id,
    provider,
    encryptedCredentials: integration.credentials_encrypted,
    requestUrl: request.url
  });

  return NextResponse.json({
    ok: true,
    accessToken: credentials.accessToken,
    developerKey,
    appId
  });
}
