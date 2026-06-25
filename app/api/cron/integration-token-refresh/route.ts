import { NextRequest, NextResponse } from "next/server";
import { getFreshIntegrationCredentials } from "@/lib/integrations/event-types";
import { isIntegrationProviderKey } from "@/lib/integrations/registry";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type IntegrationTokenRow = {
  id: string;
  provider: string;
  credentials_encrypted: string | null;
};

type RefreshResult = {
  integrationId: string;
  provider: string;
  status: "refreshed" | "failed" | "skipped";
  reason?: string;
};

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("id, provider, credentials_encrypted")
    .eq("status", "connected")
    .not("credentials_encrypted", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const integrations = (data ?? []) as IntegrationTokenRow[];
  const results: RefreshResult[] = [];

  for (const integration of integrations) {
    if (!isIntegrationProviderKey(integration.provider) || !integration.credentials_encrypted) {
      results.push({
        integrationId: integration.id,
        provider: integration.provider,
        status: "skipped",
        reason: "unsupported_or_missing_credentials"
      });
      continue;
    }

    try {
      await getFreshIntegrationCredentials({
        supabase,
        integrationId: integration.id,
        provider: integration.provider,
        encryptedCredentials: integration.credentials_encrypted,
        requestUrl: request.url,
        forceRefresh: true
      });

      results.push({
        integrationId: integration.id,
        provider: integration.provider,
        status: "refreshed"
      });
    } catch (refreshError) {
      const reason = refreshError instanceof Error ? refreshError.message : "unknown_error";

      console.warn("Integration token refresh failed", {
        integrationId: integration.id,
        provider: integration.provider,
        error: reason
      });

      results.push({
        integrationId: integration.id,
        provider: integration.provider,
        status: "failed",
        reason
      });
    }
  }

  return NextResponse.json({
    checked: integrations.length,
    refreshed: results.filter((result) => result.status === "refreshed").length,
    failed: results.filter((result) => result.status === "failed").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    results
  });
}
