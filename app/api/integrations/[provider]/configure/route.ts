import { NextRequest, NextResponse } from "next/server";
import { canUseIntegrationProvider, type BillingPlanKey } from "@/lib/billing/plans";
import { getIntegrationAdminAuth } from "@/lib/integrations/auth";
import { getFreshIntegrationCredentials, normalizeSelectedEventTypes } from "@/lib/integrations/event-types";
import {
  buildGoogleSheetsLeadHeaders,
  ensureGoogleSheetsLeadSheet,
  mergeGoogleSheetsLeadFields,
  normalizeGoogleSpreadsheetId,
  type GoogleSheetsLeadFieldColumn
} from "@/lib/integrations/google-sheets";
import { parseIntegrationProviderParam } from "@/lib/integrations/oauth";
import { getIntegrationProvider } from "@/lib/integrations/registry";
import type { IntegrationActionType, IntegrationTriggerType } from "@/lib/integrations/types";
import { normalizeLeadFields } from "@/lib/lead-fields";
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
  const { data: integration } = await service
    .from("integrations")
    .select("id, status, credentials_encrypted, config")
    .eq("organization_id", auth.organizationId)
    .eq("provider", provider)
    .maybeSingle();

  const actionType = normalizeActionType(formData.get("actionType"), providerDefinition?.actionTypes ?? []);
  const selectedBotIds = formData
    .getAll("botIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const successMessage = normalizeMessage(formData.get("successMessage"));
  const fallbackMessage = normalizeMessage(formData.get("fallbackMessage"));
  const actionConfig = getActionConfig(provider, formData);
  const validationError = validateActionConfig(provider, actionConfig);

  if (!actionType) {
    redirectUrl.searchParams.set("status", "configure_failed");
    if (wantsJson(request)) {
      return NextResponse.json({ ok: false, error: "This provider has no configurable action." }, { status: 400 });
    }

    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  if (validationError) {
    redirectUrl.searchParams.set("status", "configure_failed");
    if (wantsJson(request)) {
      return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
    }

    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  if (!integration?.id || integration.status !== "connected") {
    redirectUrl.searchParams.set("status", "not_connected");
    if (wantsJson(request)) {
      return NextResponse.json({ ok: false, error: "Connect this integration before configuring actions." }, { status: 409 });
    }

    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const { data: bots } = await service
    .from("bots")
    .select("id, lead_capture_fields")
    .eq("organization_id", auth.organizationId)
    .eq("status", "active")
    .in("id", selectedBotIds.length > 0 ? selectedBotIds : ["00000000-0000-0000-0000-000000000000"]);
  const botRows = (bots ?? []) as Array<{ id: string; lead_capture_fields: unknown }>;
  const validBotIds = new Set(botRows.map((bot) => bot.id));
  const googleSheetsLeadFieldsByBotId = new Map(
    botRows.map((bot) => [bot.id, getGoogleSheetsLeadFieldsForBot(bot.lead_capture_fields)])
  );
  const googleSheetsLeadFields = mergeGoogleSheetsLeadFields(
    botRows.flatMap((bot) => googleSheetsLeadFieldsByBotId.get(bot.id) ?? [])
  );
  const providerConfigurationError = await prepareProviderTargetConfiguration({
    provider,
    service,
    integration: {
      id: integration.id,
      credentialsEncrypted: integration.credentials_encrypted
    },
    requestUrl: request.url,
    actionConfig,
    leadFields: googleSheetsLeadFields
  });

  if (providerConfigurationError) {
    redirectUrl.searchParams.set("status", "configure_failed");
    if (wantsJson(request)) {
      return NextResponse.json({ ok: false, error: providerConfigurationError }, { status: 400 });
    }

    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const rows = selectedBotIds
    .filter((botId) => validBotIds.has(botId))
    .map((botId) => ({
      organization_id: auth.organizationId,
      bot_id: botId,
      integration_id: integration.id,
      trigger_type: getDefaultTriggerType(provider, actionType),
      action_type: actionType,
      enabled: true,
      required_fields: getRequiredFields(provider, actionType),
      field_mapping: {},
      success_message: successMessage,
      fallback_message: fallbackMessage,
      config: getBotActionConfig(provider, actionConfig, googleSheetsLeadFieldsByBotId.get(botId)),
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
        fallbackMessage: row.fallback_message,
        config: row.config
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

function getBooleanFormValue(formData: FormData, key: string, defaultValue: boolean) {
  const values = formData.getAll(key);

  if (values.some((value) => value === "true" || value === "on")) {
    return true;
  }

  if (values.some((value) => value === "false" || value === "off")) {
    return false;
  }

  return defaultValue;
}

function getActionConfig(provider: NonNullable<ReturnType<typeof parseIntegrationProviderParam>>, formData: FormData) {
  if (provider === "calendly" || provider === "calcom") {
    return {
      provider,
      schedulingMode: "popup",
      selectedEventTypes: getSelectedEventTypesFromForm(formData)
    };
  }

  if (provider === "slack") {
    return {
      provider,
      slackChannelId: normalizeMessage(formData.get("slackChannelId"))
    };
  }

  if (provider === "mailchimp") {
    return {
      provider,
      mailchimpAudienceId: normalizeMessage(formData.get("mailchimpAudienceId")),
      mailchimpAudienceName: normalizeMessage(formData.get("mailchimpAudienceName"))
    };
  }

  if (provider === "google_sheets") {
    return {
      provider,
      spreadsheetId: normalizeGoogleSpreadsheetId(formData.get("spreadsheetId")),
      spreadsheetTitle: normalizeMessage(formData.get("spreadsheetTitle")),
      sheetName: normalizeMessage(formData.get("sheetName")) ?? "Leads"
    };
  }

  return {
    provider
  };
}

function validateActionConfig(
  provider: NonNullable<ReturnType<typeof parseIntegrationProviderParam>>,
  config: Record<string, unknown>
) {
  if (provider === "slack" && !normalizeMessage(config.slackChannelId as FormDataEntryValue | null)) {
    return "Slack channel ID is required before saving Slack notifications.";
  }

  if (provider === "mailchimp" && !normalizeMessage(config.mailchimpAudienceId as FormDataEntryValue | null)) {
    return "Select a Mailchimp audience before saving this integration.";
  }

  if (provider === "google_sheets") {
    if (!normalizeMessage(config.spreadsheetId as FormDataEntryValue | null)) {
      return "Google Sheets needs a spreadsheet ID before saving.";
    }

    if (!normalizeMessage(config.sheetName as FormDataEntryValue | null)) {
      return "Google Sheets needs a sheet tab name before saving.";
    }
  }

  if (
    (provider === "calendly" || provider === "calcom") &&
    normalizeSelectedEventTypes(config.selectedEventTypes).length === 0
  ) {
    return `Select at least one ${provider === "calcom" ? "Cal.com" : "Calendly"} event type.`;
  }

  return null;
}

function getRequiredFields(provider: NonNullable<ReturnType<typeof parseIntegrationProviderParam>>, actionType: IntegrationActionType) {
  if (provider === "google_sheets") {
    return [];
  }

  return actionType === "create_crm_contact" ? ["email"] : [];
}

function getBotActionConfig(
  provider: NonNullable<ReturnType<typeof parseIntegrationProviderParam>>,
  actionConfig: Record<string, unknown>,
  leadFields: GoogleSheetsLeadFieldColumn[] | undefined
) {
  if (provider !== "google_sheets") {
    return actionConfig;
  }

  return {
    ...actionConfig,
    leadFields: leadFields ?? []
  };
}

function getGoogleSheetsLeadFieldsForBot(value: unknown) {
  return normalizeLeadFields(value)
    .filter((field) => field.enabled)
    .map((field) => ({
      key: field.key,
      label: field.label
    }));
}

function getSelectedEventTypesFromForm(formData: FormData) {
  const selectedIds = new Set(
    formData
      .getAll("eventTypeIds")
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  );
  const rawSnapshot = formData.get("eventTypesSnapshot");
  const snapshot = typeof rawSnapshot === "string" ? parseJsonArray(rawSnapshot) : [];

  return normalizeSelectedEventTypes(snapshot).filter((eventType) => selectedIds.has(eventType.id));
}

function parseJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getDefaultTriggerType(
  provider: NonNullable<ReturnType<typeof parseIntegrationProviderParam>>,
  actionType: IntegrationActionType
): IntegrationTriggerType {
  if (actionType === "show_booking_link") {
    return "booking_requested";
  }

  if (provider === "jobber" && actionType === "submit_service_request") {
    return "lead_captured";
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

async function prepareProviderTargetConfiguration({
  provider,
  service,
  integration,
  requestUrl,
  actionConfig,
  leadFields
}: {
  provider: NonNullable<ReturnType<typeof parseIntegrationProviderParam>>;
  service: SupabaseServiceClient;
  integration: {
    id: string;
    credentialsEncrypted: string | null;
  };
  requestUrl: string;
  actionConfig: Record<string, unknown>;
  leadFields: GoogleSheetsLeadFieldColumn[];
}) {
  if (provider !== "google_sheets") {
    return null;
  }

  if (!integration.credentialsEncrypted) {
    return "Reconnect Google Sheets before saving this configuration.";
  }

  try {
    const credentials = await getFreshIntegrationCredentials({
      supabase: service,
      integrationId: integration.id,
      provider,
      encryptedCredentials: integration.credentialsEncrypted,
      requestUrl
    });
    await ensureGoogleSheetsLeadSheet({
      accessToken: credentials.accessToken,
      spreadsheetId: normalizeGoogleSpreadsheetId(actionConfig.spreadsheetId),
      sheetName: normalizeMessage(actionConfig.sheetName as FormDataEntryValue | null) ?? "Leads",
      headers: buildGoogleSheetsLeadHeaders(leadFields)
    });

    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Google Sheets could not validate this spreadsheet.";
  }
}
