import { NextRequest, NextResponse } from "next/server";
import { getIntegrationAdminAuth } from "@/lib/integrations/auth";
import { getFreshIntegrationCredentials } from "@/lib/integrations/event-types";
import { listMailchimpAudiences } from "@/lib/integrations/mailchimp";
import { parseIntegrationProviderParam } from "@/lib/integrations/oauth";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { provider: providerParam } = await context.params;
  const provider = parseIntegrationProviderParam(providerParam);

  if (provider !== "mailchimp") {
    return NextResponse.json({ ok: false, error: "Audience selection is only available for Mailchimp." }, { status: 400 });
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
    return NextResponse.json({ ok: false, error: "Connect Mailchimp before loading audiences." }, { status: 409 });
  }

  try {
    const credentials = await getFreshIntegrationCredentials({
      supabase: service,
      integrationId: integration.id,
      provider,
      encryptedCredentials: integration.credentials_encrypted,
      requestUrl: request.url
    });
    const audiences = await listMailchimpAudiences(credentials);

    return NextResponse.json({ ok: true, provider, audiences });
  } catch (audienceError) {
    console.error("Could not load Mailchimp audiences", audienceError);

    return NextResponse.json({
      ok: false,
      error: audienceError instanceof Error ? audienceError.message : "Mailchimp audiences could not be loaded."
    }, { status: 502 });
  }
}
