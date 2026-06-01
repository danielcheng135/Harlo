import { NextRequest, NextResponse } from "next/server";
import { getIntegrationAdminAuth } from "@/lib/integrations/auth";
import { getFreshIntegrationCredentials, listBookingEventTypes } from "@/lib/integrations/event-types";
import { parseIntegrationProviderParam } from "@/lib/integrations/oauth";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { provider: providerParam } = await context.params;
  const provider = parseIntegrationProviderParam(providerParam);

  if (provider !== "calendly" && provider !== "calcom") {
    return NextResponse.json({ ok: false, error: "Event type selection is only available for booking integrations." }, { status: 400 });
  }

  const auth = await getIntegrationAdminAuth();

  if ("response" in auth) {
    return auth.response;
  }

  const service = createSupabaseServiceClient();
  const { data: integration, error } = await service
    .from("integrations")
    .select("id, credentials_encrypted, status")
    .eq("organization_id", auth.organizationId)
    .eq("provider", provider)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!integration?.id || integration.status !== "connected" || !integration.credentials_encrypted) {
    return NextResponse.json({ ok: false, error: "Connect this integration before loading event types." }, { status: 409 });
  }

  try {
    const credentials = await getFreshIntegrationCredentials({
      supabase: service,
      integrationId: integration.id,
      provider,
      encryptedCredentials: integration.credentials_encrypted,
      requestUrl: request.url
    });
    const eventTypes = await listBookingEventTypes({
      provider,
      accessToken: credentials.accessToken
    });

    return NextResponse.json({ ok: true, provider, eventTypes });
  } catch (eventTypeError) {
    console.error(`Could not load ${provider} event types`, eventTypeError);

    return NextResponse.json({
      ok: false,
      error: eventTypeError instanceof Error ? eventTypeError.message : "Event types could not be loaded."
    }, { status: 502 });
  }
}
