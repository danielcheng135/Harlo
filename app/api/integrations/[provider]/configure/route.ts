import { NextRequest, NextResponse } from "next/server";
import { canUseIntegrationProvider, type BillingPlanKey } from "@/lib/billing/plans";
import { getIntegrationAdminAuth } from "@/lib/integrations/auth";
import { parseIntegrationProviderParam } from "@/lib/integrations/oauth";
import { getIntegrationProvider } from "@/lib/integrations/registry";
import type { IntegrationActionType, IntegrationTriggerType } from "@/lib/integrations/types";
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

  redirectUrl.searchParams.set("configure", provider);
  redirectUrl.searchParams.set("integration", provider);

  const auth = await getIntegrationAdminAuth();

  if ("response" in auth) {
    return auth.response;
  }

  const service = createSupabaseServiceClient();
  const planKey = await getOrganizationPlanKey(auth.organizationId);

  if (!canUseIntegrationProvider(planKey, provider)) {
    redirectUrl.searchParams.set("status", "plan_locked");
    if (wantsJson(request)) {
      return NextResponse.json({ ok: false, error: "This integration is not included in the current plan." }, { status: 403 });
    }

    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const providerDefinition = getIntegrationProvider(provider);
  const formData = await request.formData();
  const actionType = normalizeActionType(formData.get("actionType"), providerDefinition?.actionTypes ?? []);
  const selectedBotIds = formData
    .getAll("botIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const successMessage = normalizeMessage(formData.get("successMessage"));
  const fallbackMessage = normalizeMessage(formData.get("fallbackMessage"));

  if (!actionType) {
    redirectUrl.searchParams.set("status", "configure_failed");
    if (wantsJson(request)) {
      return NextResponse.json({ ok: false, error: "This provider has no configurable action." }, { status: 400 });
    }

    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const { data: integration } = await service
    .from("integrations")
    .select("id, status")
    .eq("organization_id", auth.organizationId)
    .eq("provider", provider)
    .maybeSingle();

  if (!integration?.id || integration.status !== "connected") {
    redirectUrl.searchParams.set("status", "not_connected");
    if (wantsJson(request)) {
      return NextResponse.json({ ok: false, error: "Connect this integration before configuring actions." }, { status: 409 });
    }

    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const { data: bots } = await service
    .from("bots")
    .select("id")
    .eq("organization_id", auth.organizationId)
    .eq("status", "active")
    .in("id", selectedBotIds.length > 0 ? selectedBotIds : ["00000000-0000-0000-0000-000000000000"]);
  const validBotIds = new Set((bots ?? []).map((bot) => bot.id as string));
  const rows = selectedBotIds
    .filter((botId) => validBotIds.has(botId))
    .map((botId) => ({
      organization_id: auth.organizationId,
      bot_id: botId,
      integration_id: integration.id,
      trigger_type: getDefaultTriggerType(actionType),
      action_type: actionType,
      enabled: true,
      required_fields: [],
      field_mapping: {},
      success_message: successMessage,
      fallback_message: fallbackMessage,
      config: {
        provider
      },
      updated_at: new Date().toISOString()
    }));

  const deleteResult = await service
    .from("bot_integration_actions")
    .delete()
    .eq("organization_id", auth.organizationId)
    .eq("integration_id", integration.id);

  if (deleteResult.error) {
    redirectUrl.searchParams.set("status", "configure_failed");
    if (wantsJson(request)) {
      return NextResponse.json({ ok: false, error: deleteResult.error.message }, { status: 500 });
    }

    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  if (rows.length > 0) {
    const { error } = await service.from("bot_integration_actions").insert(rows);

    if (error) {
      redirectUrl.searchParams.set("status", "configure_failed");
      if (wantsJson(request)) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      return NextResponse.redirect(redirectUrl, { status: 303 });
    }
  }

  redirectUrl.searchParams.set("status", "configured");
  if (wantsJson(request)) {
    return NextResponse.json({
      ok: true,
      provider,
      actions: rows.map((row) => ({
        botId: row.bot_id,
        actionType: row.action_type,
        triggerType: row.trigger_type,
        enabled: row.enabled,
        successMessage: row.success_message,
        fallbackMessage: row.fallback_message
      }))
    });
  }

  return NextResponse.redirect(redirectUrl, { status: 303 });
}

async function getOrganizationPlanKey(organizationId: string): Promise<BillingPlanKey> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("organization_billing")
    .select("plan_key")
    .eq("organization_id", organizationId)
    .maybeSingle();

  return data?.plan_key === "growth" || data?.plan_key === "pro" ? data.plan_key : "starter";
}

function normalizeActionType(value: FormDataEntryValue | null, allowed: IntegrationActionType[]) {
  return typeof value === "string" && allowed.includes(value as IntegrationActionType)
    ? value as IntegrationActionType
    : allowed[0] ?? null;
}

function normalizeMessage(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : null;
}

function getDefaultTriggerType(actionType: IntegrationActionType): IntegrationTriggerType {
  if (actionType === "show_booking_link") {
    return "booking_requested";
  }

  if (actionType === "submit_service_request") {
    return "service_request_completed";
  }

  if (actionType === "send_notification" || actionType === "create_crm_contact" || actionType === "send_webhook") {
    return "lead_captured";
  }

  return "human_follow_up_requested";
}

function wantsJson(request: NextRequest) {
  return request.headers.get("accept")?.includes("application/json") || request.headers.get("x-requested-with") === "fetch";
}
