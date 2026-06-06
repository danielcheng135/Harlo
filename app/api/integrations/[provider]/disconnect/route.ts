import { NextRequest, NextResponse } from "next/server";
import { getIntegrationAdminAuth } from "@/lib/integrations/auth";
import { getFreshIntegrationCredentials } from "@/lib/integrations/event-types";
import { disconnectJobberApp } from "@/lib/integrations/jobber";
import { parseIntegrationProviderParam } from "@/lib/integrations/oauth";
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
    if (wantsJson(request)) {
      return NextResponse.json({ ok: false, error: "Unsupported integration." }, { status: 400 });
    }

    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const auth = await getIntegrationAdminAuth();

  if ("response" in auth) {
    return auth.response;
  }

  const service = createSupabaseServiceClient();
  const { data: integration, error: integrationError } = await service
    .from("integrations")
    .select("id, credentials_encrypted")
    .eq("organization_id", auth.organizationId)
    .eq("provider", provider)
    .maybeSingle();

  if (integrationError) {
    return respondWithDisconnectError(request, redirectUrl, provider, integrationError.message);
  }

  if (provider === "jobber" && integration?.credentials_encrypted) {
    try {
      const credentials = await getFreshIntegrationCredentials({
        supabase: service,
        integrationId: integration.id,
        provider,
        encryptedCredentials: integration.credentials_encrypted,
        requestUrl: request.url
      });

      await disconnectJobberApp(credentials.accessToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Jobber app disconnect failed.";

      console.error("Could not disconnect Jobber integration", {
        organizationId: auth.organizationId,
        integrationId: integration.id,
        error: message
      });
      return respondWithDisconnectError(request, redirectUrl, provider, message);
    }
  }

  const { error } = await service.from("integrations").upsert({
    organization_id: auth.organizationId,
    provider,
    status: "disconnected",
    credentials_encrypted: null,
    connected_by: null,
    connected_at: null,
    last_error: null,
    updated_at: new Date().toISOString()
  }, {
    onConflict: "organization_id,provider"
  });

  redirectUrl.searchParams.set("integration", provider);
  redirectUrl.searchParams.set("status", error ? "disconnect_failed" : "disconnected");

  if (wantsJson(request)) {
    return NextResponse.json(error ? { ok: false, error: error.message } : { ok: true, provider });
  }

  return NextResponse.redirect(redirectUrl, { status: 303 });
}

function wantsJson(request: NextRequest) {
  return request.headers.get("accept")?.includes("application/json") || request.headers.get("x-requested-with") === "fetch";
}

function respondWithDisconnectError(
  request: NextRequest,
  redirectUrl: URL,
  provider: string,
  message: string
) {
  redirectUrl.searchParams.set("integration", provider);
  redirectUrl.searchParams.set("status", "disconnect_failed");
  redirectUrl.searchParams.set("reason", message.slice(0, 160));

  if (wantsJson(request)) {
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
