import { NextRequest, NextResponse } from "next/server";
import { getIntegrationAdminAuth } from "@/lib/integrations/auth";
import { getFreshIntegrationCredentials } from "@/lib/integrations/event-types";
import {
  buildGoogleSheetsLeadHeaders,
  createGoogleSheetsLeadSpreadsheet,
  mergeGoogleSheetsLeadFields
} from "@/lib/integrations/google-sheets";
import { parseIntegrationProviderParam } from "@/lib/integrations/oauth";
import { normalizeLeadFields } from "@/lib/lead-fields";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { provider: providerParam } = await context.params;
  const provider = parseIntegrationProviderParam(providerParam);

  if (provider !== "google_sheets") {
    return NextResponse.json({ ok: false, error: "Unsupported spreadsheet provider." }, { status: 400 });
  }

  const auth = await getIntegrationAdminAuth();

  if ("response" in auth) {
    return auth.response;
  }

  const service = createSupabaseServiceClient();
  const { data: integration } = await service
    .from("integrations")
    .select("id, credentials_encrypted, status")
    .eq("organization_id", auth.organizationId)
    .eq("provider", provider)
    .maybeSingle();

  if (!integration?.id || integration.status !== "connected" || !integration.credentials_encrypted) {
    return NextResponse.json({ ok: false, error: "Connect Google Sheets before creating a spreadsheet." }, { status: 409 });
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const sheetName = getString(body.sheetName) ?? "Leads";
  const selectedBotIds = Array.isArray(body.botIds)
    ? body.botIds.filter((value): value is string => typeof value === "string" && value.length > 0)
    : [];
  const [{ data: organization }, { data: bots }] = await Promise.all([
    service
      .from("organizations")
      .select("name")
      .eq("id", auth.organizationId)
      .maybeSingle(),
    service
      .from("bots")
      .select("id, lead_capture_fields")
      .eq("organization_id", auth.organizationId)
      .eq("status", "active")
      .in("id", selectedBotIds.length > 0 ? selectedBotIds : ["00000000-0000-0000-0000-000000000000"])
  ]);
  const leadFields = mergeGoogleSheetsLeadFields(
    ((bots ?? []) as Array<{ lead_capture_fields: unknown }>).flatMap((bot) => normalizeLeadFields(bot.lead_capture_fields)
      .filter((field) => field.enabled)
      .map((field) => ({
        key: field.key,
        label: field.label
      })))
  );
  const credentials = await getFreshIntegrationCredentials({
    supabase: service,
    integrationId: integration.id,
    provider,
    encryptedCredentials: integration.credentials_encrypted,
    requestUrl: request.url
  });
  const spreadsheet = await createGoogleSheetsLeadSpreadsheet({
    accessToken: credentials.accessToken,
    title: `${organization?.name ?? "Harlo"} Leads`,
    sheetName,
    headers: buildGoogleSheetsLeadHeaders(leadFields)
  });

  return NextResponse.json({
    ok: true,
    spreadsheet
  });
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
