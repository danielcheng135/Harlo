import { NextRequest, NextResponse } from "next/server";
import { getIntegrationAdminAuth } from "@/lib/integrations/auth";
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
