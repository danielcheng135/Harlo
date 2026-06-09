import { createHash } from "crypto";
import { encryptIntegrationCredentials } from "@/lib/integrations/credentials";
import { getFreshIntegrationCredentials, normalizeSelectedEventTypes } from "@/lib/integrations/event-types";
import {
  appendGoogleSheetsRow,
  buildGoogleSheetsLeadHeaders,
  getGoogleSheetsErrorMessage,
  getGoogleSpreadsheetUrl,
  mergeGoogleSheetsLeadFields,
  normalizeGoogleSheetsLeadFields,
  normalizeGoogleSpreadsheetId
} from "@/lib/integrations/google-sheets";
import { getMailchimpErrorMessage, getMailchimpMarketingApiBase } from "@/lib/integrations/mailchimp";
import { refreshProviderTokenIfNeeded, type OAuthTokenSet } from "@/lib/integrations/providers";
import type {
  IntegrationActionPayload,
  IntegrationActionResult,
  IntegrationActionType,
  IntegrationProviderKey,
  IntegrationTriggerType
} from "@/lib/integrations/types";
import type { createSupabaseServiceClient } from "@/lib/supabase/server";

type SupabaseServiceClient = ReturnType<typeof createSupabaseServiceClient>;

const DEFAULT_JOBBER_GRAPHQL_VERSION = "2025-04-16";
const CALCOM_API_VERSION = "2024-06-14";

export type EnabledIntegrationAction = {
  id: string;
  integrationId: string;
  provider: IntegrationProviderKey;
  actionType: IntegrationActionType;
  triggerType: IntegrationTriggerType;
  requiredFields: string[];
  successMessage: string | null;
  fallbackMessage: string | null;
  config: Record<string, unknown>;
  credentials: OAuthTokenSet;
};

type RunIntegrationActionInput = {
  supabase: SupabaseServiceClient;
  action: EnabledIntegrationAction;
  payload: IntegrationActionPayload;
  requestUrl?: string;
  actionLimit: number;
};

type ActionRow = {
  id: string;
  integration_id: string;
  trigger_type: string;
  action_type: string;
  required_fields: string[] | null;
  success_message: string | null;
  fallback_message: string | null;
  config: Record<string, unknown> | null;
};

type IntegrationRow = {
  id: string;
  provider: string;
  credentials_encrypted: string | null;
};

export async function getEnabledIntegrationActionsForBot({
  supabase,
  organizationId,
  botId,
  requestUrl
}: {
  supabase: SupabaseServiceClient;
  organizationId: string;
  botId: string;
  requestUrl?: string;
}): Promise<EnabledIntegrationAction[]> {
  const { data: actions, error: actionError } = await supabase
    .from("bot_integration_actions")
    .select("id, integration_id, trigger_type, action_type, required_fields, success_message, fallback_message, config")
    .eq("organization_id", organizationId)
    .eq("bot_id", botId)
    .eq("enabled", true);

  if (actionError || !actions?.length) {
    if (actionError) {
      console.error("Could not load integration actions", actionError);
    }

    return [];
  }

  const actionRows = actions as ActionRow[];
  const integrationIds = Array.from(new Set(actionRows.map((action) => action.integration_id)));
  const { data: integrations, error: integrationError } = await supabase
    .from("integrations")
    .select("id, provider, credentials_encrypted")
    .eq("organization_id", organizationId)
    .eq("status", "connected")
    .in("id", integrationIds);

  if (integrationError || !integrations?.length) {
    if (integrationError) {
      console.error("Could not load connected integrations", integrationError);
    }

    return [];
  }

  const integrationsById = new Map((integrations as IntegrationRow[]).map((integration) => [integration.id, integration]));
  const enabledActions: EnabledIntegrationAction[] = [];

  for (const action of actionRows) {
    const integration = integrationsById.get(action.integration_id);

    if (!integration || !isIntegrationProvider(integration.provider) || !isIntegrationActionType(action.action_type)) {
      continue;
    }

    if (!integration.credentials_encrypted) {
      continue;
    }

    try {
      enabledActions.push({
        id: action.id,
        integrationId: action.integration_id,
        provider: integration.provider,
        actionType: action.action_type,
        triggerType: isIntegrationTriggerType(action.trigger_type) ? action.trigger_type : "human_follow_up_requested",
        requiredFields: Array.isArray(action.required_fields) ? action.required_fields : [],
        successMessage: action.success_message,
        fallbackMessage: action.fallback_message,
        config: action.config ?? {},
        credentials: await getFreshIntegrationCredentials({
          supabase,
          integrationId: integration.id,
          provider: integration.provider,
          encryptedCredentials: integration.credentials_encrypted,
          requestUrl
        })
      });
    } catch (error) {
      console.error(`Could not decrypt ${integration.provider} integration credentials`, error);
    }
  }

  return enabledActions;
}

export async function getConnectedCalendlyBookingAction({
  supabase,
  organizationId,
  requestUrl
}: {
  supabase: SupabaseServiceClient;
  organizationId: string;
  requestUrl?: string;
}): Promise<EnabledIntegrationAction | null> {
  const { data: integration, error } = await supabase
    .from("integrations")
    .select("id, provider, credentials_encrypted")
    .eq("organization_id", organizationId)
    .eq("provider", "calendly")
    .eq("status", "connected")
    .maybeSingle();

  if (error || !integration?.credentials_encrypted) {
    if (error) {
      console.error("Could not load connected Calendly integration", error);
    }

    return null;
  }

  try {
    return {
      id: `calendly-fallback-${integration.id}`,
      integrationId: integration.id,
      provider: "calendly",
      actionType: "show_booking_link",
      triggerType: "booking_requested",
      requiredFields: [],
      successMessage: null,
      fallbackMessage: null,
      config: {
        provider: "calendly",
        calendlySchedulingMode: "popup"
      },
      credentials: await getFreshIntegrationCredentials({
        supabase,
        integrationId: integration.id,
        provider: "calendly",
        encryptedCredentials: integration.credentials_encrypted,
        requestUrl
      })
    };
  } catch (decryptError) {
    console.error("Could not decrypt Calendly integration credentials", decryptError);
    return null;
  }
}

export async function getConnectedCalcomBookingAction({
  supabase,
  organizationId,
  requestUrl
}: {
  supabase: SupabaseServiceClient;
  organizationId: string;
  requestUrl?: string;
}): Promise<EnabledIntegrationAction | null> {
  const { data: integration, error } = await supabase
    .from("integrations")
    .select("id, provider, credentials_encrypted")
    .eq("organization_id", organizationId)
    .eq("provider", "calcom")
    .eq("status", "connected")
    .maybeSingle();

  if (error || !integration?.credentials_encrypted) {
    if (error) {
      console.error("Could not load connected Cal.com integration", error);
    }

    return null;
  }

  try {
    return {
      id: `calcom-fallback-${integration.id}`,
      integrationId: integration.id,
      provider: "calcom",
      actionType: "show_booking_link",
      triggerType: "booking_requested",
      requiredFields: [],
      successMessage: null,
      fallbackMessage: null,
      config: {
        provider: "calcom",
        calcomSchedulingMode: "popup"
      },
      credentials: await getFreshIntegrationCredentials({
        supabase,
        integrationId: integration.id,
        provider: "calcom",
        encryptedCredentials: integration.credentials_encrypted,
        requestUrl
      })
    };
  } catch (decryptError) {
    console.error("Could not decrypt Cal.com integration credentials", decryptError);
    return null;
  }
}

export async function getConnectedJobberLeadAction({
  supabase,
  organizationId,
  requestUrl
}: {
  supabase: SupabaseServiceClient;
  organizationId: string;
  requestUrl?: string;
}): Promise<EnabledIntegrationAction | null> {
  const { data: integration, error } = await supabase
    .from("integrations")
    .select("id, provider, credentials_encrypted")
    .eq("organization_id", organizationId)
    .eq("provider", "jobber")
    .eq("status", "connected")
    .maybeSingle();

  if (error || !integration?.credentials_encrypted) {
    if (error) {
      console.error("Could not load connected Jobber integration", error);
    }

    return null;
  }

  try {
    return {
      id: `jobber-fallback-${integration.id}`,
      integrationId: integration.id,
      provider: "jobber",
      actionType: "submit_service_request",
      triggerType: "lead_captured",
      requiredFields: [],
      successMessage: null,
      fallbackMessage: null,
      config: {
        provider: "jobber"
      },
      credentials: await getFreshIntegrationCredentials({
        supabase,
        integrationId: integration.id,
        provider: "jobber",
        encryptedCredentials: integration.credentials_encrypted,
        requestUrl
      })
    };
  } catch (decryptError) {
    console.error("Could not decrypt Jobber integration credentials", decryptError);
    return null;
  }
}

export async function getConnectedHubSpotContactAction({
  supabase,
  organizationId,
  requestUrl
}: {
  supabase: SupabaseServiceClient;
  organizationId: string;
  requestUrl?: string;
}): Promise<EnabledIntegrationAction | null> {
  const { data: integration, error } = await supabase
    .from("integrations")
    .select("id, provider, credentials_encrypted")
    .eq("organization_id", organizationId)
    .eq("provider", "hubspot")
    .eq("status", "connected")
    .maybeSingle();

  if (error || !integration?.credentials_encrypted) {
    if (error) {
      console.error("Could not load connected HubSpot integration", error);
    }

    return null;
  }

  try {
    return {
      id: `hubspot-fallback-${integration.id}`,
      integrationId: integration.id,
      provider: "hubspot",
      actionType: "create_crm_contact",
      triggerType: "lead_captured",
      requiredFields: ["email"],
      successMessage: null,
      fallbackMessage: null,
      config: {
        provider: "hubspot"
      },
      credentials: await getFreshIntegrationCredentials({
        supabase,
        integrationId: integration.id,
        provider: "hubspot",
        encryptedCredentials: integration.credentials_encrypted,
        requestUrl
      })
    };
  } catch (decryptError) {
    console.error("Could not decrypt HubSpot integration credentials", decryptError);
    return null;
  }
}

export async function getConnectedMailchimpContactAction({
  supabase,
  organizationId,
  requestUrl
}: {
  supabase: SupabaseServiceClient;
  organizationId: string;
  requestUrl?: string;
}): Promise<EnabledIntegrationAction | null> {
  const defaultAudienceId = process.env.MAILCHIMP_DEFAULT_AUDIENCE_ID?.trim();

  if (!defaultAudienceId) {
    return null;
  }

  const { data: integration, error } = await supabase
    .from("integrations")
    .select("id, provider, credentials_encrypted")
    .eq("organization_id", organizationId)
    .eq("provider", "mailchimp")
    .eq("status", "connected")
    .maybeSingle();

  if (error || !integration?.credentials_encrypted) {
    if (error) {
      console.error("Could not load connected Mailchimp integration", error);
    }

    return null;
  }

  try {
    return {
      id: `mailchimp-fallback-${integration.id}`,
      integrationId: integration.id,
      provider: "mailchimp",
      actionType: "create_crm_contact",
      triggerType: "lead_captured",
      requiredFields: ["email"],
      successMessage: null,
      fallbackMessage: null,
      config: {
        provider: "mailchimp",
        mailchimpAudienceId: defaultAudienceId
      },
      credentials: await getFreshIntegrationCredentials({
        supabase,
        integrationId: integration.id,
        provider: "mailchimp",
        encryptedCredentials: integration.credentials_encrypted,
        requestUrl
      })
    };
  } catch (decryptError) {
    console.error("Could not decrypt Mailchimp integration credentials", decryptError);
    return null;
  }
}

async function persistRefreshedCredentials({
  supabase,
  integrationId,
  credentials
}: {
  supabase: SupabaseServiceClient;
  integrationId: string;
  credentials: OAuthTokenSet;
}) {
  const { error } = await supabase
    .from("integrations")
    .update({
      credentials_encrypted: encryptIntegrationCredentials(credentials),
      config: {
        provider_account_id: credentials.providerAccountId,
        provider_account_name: credentials.providerAccountName,
        scope: credentials.scope,
        token_type: credentials.tokenType,
        expires_at: credentials.expiresAt
      },
      updated_at: new Date().toISOString()
    })
    .eq("id", integrationId);

  if (error) {
    console.error("Could not persist refreshed integration credentials", error);
  }
}

export async function runIntegrationAction({
  supabase,
  action,
  payload,
  requestUrl,
  actionLimit
}: RunIntegrationActionInput): Promise<IntegrationActionResult> {
  const startedAt = Date.now();
  const inputSummary = buildIntegrationInputSummary(payload);
  const reservation = await reserveIntegrationRun({
    supabase,
    action,
    payload,
    inputSummary,
    actionLimit
  });

  if (reservation.error) {
    const result: IntegrationActionResult = {
      ok: false,
      status: "failed",
      message: action.fallbackMessage ?? "This connected action could not be started.",
      externalRecordId: null,
      externalUrl: null,
      error: "Harlo could not verify the action limit."
    };
    await logIntegrationRun({
      supabase,
      action,
      payload,
      result,
      durationMs: Date.now() - startedAt,
      reason: "limit_check_failed"
    });
    return result;
  }

  if (!reservation.runId) {
    const result: IntegrationActionResult = {
      ok: false,
      status: "skipped",
      message: `This conversation has reached the plan limit of ${actionLimit} connected ${actionLimit === 1 ? "action" : "actions"}.`,
      externalRecordId: null,
      externalUrl: null,
      error: null,
      metadata: {
        reason: "plan_action_limit",
        actionLimit
      }
    };
    await logIntegrationRun({
      supabase,
      action,
      payload,
      result,
      durationMs: Date.now() - startedAt,
      reason: "plan_action_limit"
    });
    return result;
  }

  let result: IntegrationActionResult;

  try {
    result = await runIntegrationActionOnce(action, payload);
  } catch (error) {
    if (requestUrl && isExpiredAccessTokenError(error)) {
      try {
        action = await refreshActionCredentialsAfterExpiredToken({
          supabase,
          action,
          requestUrl
        });
        result = await runIntegrationActionOnce(action, payload);
      } catch (retryError) {
        result = buildFailedIntegrationResult(action, retryError);
      }
    } else {
      result = buildFailedIntegrationResult(action, error);
    }
  }

  await completeIntegrationRun({
    supabase,
    runId: reservation.runId,
    result,
    durationMs: Date.now() - startedAt
  });
  await updateIntegrationStatus({ supabase, action, result });

  return result;
}

async function runIntegrationActionOnce(
  action: EnabledIntegrationAction,
  payload: IntegrationActionPayload
): Promise<IntegrationActionResult> {
  if (action.provider === "calendly" && action.actionType === "show_booking_link") {
    return runCalendlyBookingAction(action, payload);
  }

  if (action.provider === "calcom" && action.actionType === "show_booking_link") {
    return runCalcomBookingAction(action, payload);
  }

  if (action.provider === "hubspot" && action.actionType === "create_crm_contact") {
    return runHubSpotContactAction(action, payload);
  }

  if (action.provider === "mailchimp" && action.actionType === "create_crm_contact") {
    return runMailchimpContactAction(action, payload);
  }

  if (action.provider === "google_sheets" && action.actionType === "create_crm_contact") {
    return runGoogleSheetsAppendAction(action, payload);
  }

  if (action.provider === "jobber" && action.actionType === "submit_service_request") {
    return runJobberLeadAction(action, payload);
  }

  if (action.provider === "slack" && action.actionType === "send_notification") {
    return runSlackNotificationAction(action, payload);
  }

  return {
    ok: false,
    status: "skipped",
    message: action.fallbackMessage ?? `${action.provider} ${action.actionType} is not implemented yet.`,
    externalRecordId: null,
    externalUrl: null,
    error: null
  };
}

async function refreshActionCredentialsAfterExpiredToken({
  supabase,
  action,
  requestUrl
}: {
  supabase: SupabaseServiceClient;
  action: EnabledIntegrationAction;
  requestUrl: string;
}) {
  const credentials = await refreshProviderTokenIfNeeded({
    provider: action.provider,
    requestUrl,
    tokenSet: {
      ...action.credentials,
      expiresAt: new Date(0).toISOString()
    }
  });

  await persistRefreshedCredentials({
    supabase,
    integrationId: action.integrationId,
    credentials
  });

  return {
    ...action,
    credentials
  };
}

function buildFailedIntegrationResult(action: EnabledIntegrationAction, error: unknown): IntegrationActionResult {
  return {
    ok: false,
    status: "failed",
    message: action.fallbackMessage ?? "The integration action could not be completed.",
    externalRecordId: null,
    externalUrl: null,
    error: error instanceof Error ? error.message : "Unknown integration error."
  };
}

function isExpiredAccessTokenError(error: unknown) {
  return error instanceof Error && /access token expired|token expired|expired/i.test(error.message);
}

async function runCalendlyBookingAction(
  action: EnabledIntegrationAction,
  _payload: IntegrationActionPayload
): Promise<IntegrationActionResult> {
  const configuredUrl = getString(action.config.bookingUrl) ?? getString(action.config.schedulingUrl);
  const selectedEventTypes = normalizeSelectedEventTypes(action.config.selectedEventTypes);

  if (selectedEventTypes.length > 0) {
    const primaryEventType = selectedEventTypes[0];

    return {
      ok: true,
      status: "success",
      message: action.successMessage ?? "You can book a time here:",
      externalUrl: primaryEventType.url,
      externalRecordId: primaryEventType.id,
      error: null,
      metadata: {
        bookingOptions: selectedEventTypes
      }
    };
  }

  if (configuredUrl) {
    return {
      ok: true,
      status: "success",
      message: action.successMessage ?? "You can book a time here:",
      externalUrl: configuredUrl,
      externalRecordId: null,
      error: null,
      metadata: {}
    };
  }

  const firstEventType = await getCalendlyPrimaryEventType(action.credentials.accessToken);
  const eventTypeUri = getString(firstEventType?.uri);
  const schedulingUrl = getString(firstEventType?.scheduling_url);

  if (!schedulingUrl || !eventTypeUri) {
    return {
      ok: false,
      status: "skipped",
      message: action.fallbackMessage ?? "Calendly is connected, but no active booking link was found.",
      externalRecordId: null,
      externalUrl: null,
      error: "No active Calendly event type found."
    };
  }

  return {
    ok: true,
    status: "success",
    message: action.successMessage ?? "You can book a time here:",
    externalRecordId: eventTypeUri,
    externalUrl: schedulingUrl,
    error: null,
    metadata: {
      eventTypeUri
    }
  };
}

async function runCalcomBookingAction(
  action: EnabledIntegrationAction,
  _payload: IntegrationActionPayload
): Promise<IntegrationActionResult> {
  const configuredUrl = getString(action.config.bookingUrl) ??
    getString(action.config.schedulingUrl) ??
    getString(action.config.calcomBookingUrl);
  const selectedEventTypes = normalizeSelectedEventTypes(action.config.selectedEventTypes);

  if (selectedEventTypes.length > 0) {
    const primaryEventType = selectedEventTypes[0];

    return {
      ok: true,
      status: "success",
      message: action.successMessage ?? "You can book a time here:",
      externalUrl: primaryEventType.url,
      externalRecordId: primaryEventType.id,
      error: null,
      metadata: {
        bookingOptions: selectedEventTypes
      }
    };
  }

  if (configuredUrl) {
    return {
      ok: true,
      status: "success",
      message: action.successMessage ?? "You can book a time here:",
      externalUrl: configuredUrl,
      externalRecordId: null,
      error: null,
      metadata: {}
    };
  }

  const firstEventType = await getCalcomPrimaryEventType(action.credentials.accessToken);
  const rawEventTypeId = firstEventType?.id;
  const eventTypeId = typeof rawEventTypeId === "number" || typeof rawEventTypeId === "string"
    ? String(rawEventTypeId)
    : null;
  const bookingUrl = getString(firstEventType?.bookingUrl);

  if (!bookingUrl || !eventTypeId) {
    return {
      ok: false,
      status: "skipped",
      message: action.fallbackMessage ?? "Cal.com is connected, but no active booking link was found.",
      externalRecordId: null,
      externalUrl: null,
      error: "No Cal.com event type with a booking URL was found."
    };
  }

  return {
    ok: true,
    status: "success",
    message: action.successMessage ?? "You can book a time here:",
    externalRecordId: eventTypeId,
    externalUrl: bookingUrl,
    error: null,
    metadata: {
      eventTypeId
    }
  };
}

async function getCalendlyPrimaryEventType(accessToken: string) {
  const userResponse = await fetch("https://api.calendly.com/users/me", {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/json"
    }
  });
  const userPayload = await parseProviderResponse(userResponse, "Calendly user lookup failed.");
  const userUri = getString((userPayload.resource as Record<string, unknown> | undefined)?.uri);

  if (!userUri) {
    throw new Error("Calendly did not return a user URI.");
  }

  const eventTypesUrl = new URL("https://api.calendly.com/event_types");
  eventTypesUrl.searchParams.set("user", userUri);
  eventTypesUrl.searchParams.set("active", "true");
  eventTypesUrl.searchParams.set("count", "1");

  const eventTypesResponse = await fetch(eventTypesUrl, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/json"
    }
  });
  const eventTypesPayload = await parseProviderResponse(eventTypesResponse, "Calendly event type lookup failed.");
  const collection = Array.isArray(eventTypesPayload.collection) ? eventTypesPayload.collection : [];

  return collection[0] as Record<string, unknown> | undefined;
}

async function getCalcomPrimaryEventType(accessToken: string) {
  const eventTypesUrl = new URL("https://api.cal.com/v2/event-types");
  eventTypesUrl.searchParams.set("sortCreatedAt", "asc");

  const eventTypesResponse = await fetch(eventTypesUrl, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/json",
      "cal-api-version": CALCOM_API_VERSION
    }
  });
  const eventTypesPayload = await parseProviderResponse(eventTypesResponse, "Cal.com event type lookup failed.");
  const collection = Array.isArray(eventTypesPayload.data) ? eventTypesPayload.data : [];

  return collection.find((eventType) => {
    if (!eventType || typeof eventType !== "object") {
      return false;
    }

    return typeof (eventType as Record<string, unknown>).bookingUrl === "string";
  }) as Record<string, unknown> | undefined;
}

async function runHubSpotContactAction(
  action: EnabledIntegrationAction,
  payload: IntegrationActionPayload
): Promise<IntegrationActionResult> {
  const email = cleanString(payload.lead.email);

  if (!email) {
    return {
      ok: false,
      status: "skipped",
      message: action.fallbackMessage ?? "HubSpot contact creation was skipped because no email was captured.",
      externalRecordId: null,
      externalUrl: null,
      error: "Missing lead email."
    };
  }

  const properties = buildHubSpotContactProperties(payload);
  const existingContactId = await findHubSpotContactByEmail(action.credentials.accessToken, email);
  const response = existingContactId
    ? await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(existingContactId)}`, {
      method: "PATCH",
      headers: getHubSpotHeaders(action.credentials.accessToken),
      body: JSON.stringify({ properties })
    })
    : await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: getHubSpotHeaders(action.credentials.accessToken),
      body: JSON.stringify({ properties })
    });
  const contactPayload = await parseProviderResponse(response, "HubSpot contact upsert failed.");
  const contactId = getString(contactPayload.id) ?? existingContactId;
  const portalId = action.credentials.providerAccountId;
  const note = contactId
    ? await tryCreateHubSpotContactNote(action.credentials.accessToken, contactId, payload)
    : { id: null, error: null };

  return {
    ok: true,
    status: "success",
    message: action.successMessage ?? "The contact was sent to HubSpot.",
    externalRecordId: contactId,
    externalUrl: contactId && portalId ? `https://app.hubspot.com/contacts/${portalId}/contact/${contactId}` : null,
    error: null,
    metadata: {
      noteId: note.id,
      noteError: note.error
    }
  };
}

async function runMailchimpContactAction(
  action: EnabledIntegrationAction,
  payload: IntegrationActionPayload
): Promise<IntegrationActionResult> {
  const email = cleanString(payload.lead.email);

  if (!email) {
    return {
      ok: false,
      status: "skipped",
      message: action.fallbackMessage ?? "Mailchimp sync was skipped because no email was captured.",
      externalRecordId: null,
      externalUrl: null,
      error: "Missing lead email."
    };
  }

  const audienceId = getString(action.config.mailchimpAudienceId) ??
    getString(action.config.audienceId) ??
    process.env.MAILCHIMP_DEFAULT_AUDIENCE_ID?.trim();

  if (!audienceId) {
    return {
      ok: false,
      status: "skipped",
      message: action.fallbackMessage ?? "Mailchimp is connected, but no audience is selected.",
      externalRecordId: null,
      externalUrl: null,
      error: "Missing Mailchimp audience ID."
    };
  }

  const apiBase = getMailchimpMarketingApiBase(action.credentials);

  if (!apiBase) {
    throw new Error("Mailchimp did not return an API data center. Reconnect Mailchimp and try again.");
  }

  const subscriberHash = createHash("md5").update(email.toLowerCase()).digest("hex");
  const memberPayload = await upsertMailchimpMember({
    accessToken: action.credentials.accessToken,
    apiBase,
    audienceId,
    subscriberHash,
    email,
    payload
  });
  const memberId = getString(memberPayload.id) ?? subscriberHash;
  const note = await tryCreateMailchimpContactNote({
    accessToken: action.credentials.accessToken,
    apiBase,
    audienceId,
    subscriberHash,
    payload
  });

  return {
    ok: true,
    status: "success",
    message: action.successMessage ?? "The lead was added to Mailchimp.",
    externalRecordId: memberId,
    externalUrl: null,
    error: null,
    metadata: {
      audienceId,
      subscriberHash,
      noteId: note.id,
      noteError: note.error
    }
  };
}

async function runGoogleSheetsAppendAction(
  action: EnabledIntegrationAction,
  payload: IntegrationActionPayload
): Promise<IntegrationActionResult> {
  const spreadsheetId = normalizeGoogleSpreadsheetId(action.config.spreadsheetId);
  const sheetName = getString(action.config.sheetName) ?? "Leads";
  const leadFields = getGoogleSheetsLeadFields(action.config, payload);
  const headers = buildGoogleSheetsLeadHeaders(leadFields);

  if (!spreadsheetId) {
    return {
      ok: false,
      status: "skipped",
      message: action.fallbackMessage ?? "Google Sheets is connected, but no spreadsheet is selected.",
      externalRecordId: null,
      externalUrl: null,
      error: "Missing Google Sheets spreadsheet ID."
    };
  }

  const appendPayload = await appendGoogleSheetsRow({
    accessToken: action.credentials.accessToken,
    spreadsheetId,
    sheetName,
    headers,
    row: buildGoogleSheetsLeadRow(payload, leadFields)
  });
  const updates = appendPayload.updates && typeof appendPayload.updates === "object"
    ? appendPayload.updates as Record<string, unknown>
    : {};
  const updatedRange = getString(updates.updatedRange);

  return {
    ok: true,
    status: "success",
    message: action.successMessage ?? "The lead was added to Google Sheets.",
    externalRecordId: updatedRange,
    externalUrl: getGoogleSpreadsheetUrl(spreadsheetId),
    error: null,
    metadata: {
      spreadsheetId,
      sheetName,
      updatedRange
    }
  };
}

function getGoogleSheetsLeadFields(
  config: Record<string, unknown>,
  payload: IntegrationActionPayload
) {
  const configuredFields = normalizeGoogleSheetsLeadFields(config.leadFields);
  const fallbackFields = configuredFields.length > 0
    ? []
    : [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" }
    ];

  return mergeGoogleSheetsLeadFields([
    ...configuredFields,
    ...fallbackFields,
    ...getGoogleSheetsMetadataFields(payload.lead.metadata)
  ]);
}

function getGoogleSheetsMetadataFields(metadata: Record<string, unknown> | undefined) {
  if (!metadata) {
    return [];
  }

  return Object.entries(metadata)
    .filter(([key]) => !key.endsWith("_label") && !key.endsWith("_type"))
    .map(([key]) => {
      if (!formatMetadataValue(metadata[key])) {
        return null;
      }

      const label = cleanString(metadata[`${key}_label`] as string | null | undefined) ?? titleizeKey(key);

      return { key, label };
    })
    .filter((field): field is { key: string; label: string } => Boolean(field));
}

function buildGoogleSheetsLeadRow(
  payload: IntegrationActionPayload,
  fields: ReturnType<typeof getGoogleSheetsLeadFields>
) {
  const row: Record<string, unknown> = {
    Timestamp: new Date().toISOString(),
    Question: cleanString(payload.lead.question) ?? cleanString(payload.visitorMessage) ?? "",
    "Source Page": cleanString(payload.sourcePageUrl) ?? ""
  };
  const fieldHeaders = getGoogleSheetsFieldHeaders(fields);

  fields.forEach((field, index) => {
    const header = fieldHeaders[index];

    if (!header) {
      return;
    }

    row[header] = getGoogleSheetsLeadFieldValue(payload, field.key);
  });

  return row;
}

function getGoogleSheetsFieldHeaders(fields: ReturnType<typeof getGoogleSheetsLeadFields>) {
  const seen = new Map<string, number>();

  return fields.map((field) => {
    const count = seen.get(field.label) ?? 0;
    seen.set(field.label, count + 1);

    return count === 0 ? field.label : `${field.label} ${count + 1}`;
  });
}

function getGoogleSheetsLeadFieldValue(payload: IntegrationActionPayload, key: string) {
  if (key === "name") {
    return cleanString(payload.lead.name) ?? "";
  }

  if (key === "email") {
    return cleanString(payload.lead.email) ?? "";
  }

  if (key === "phone") {
    return cleanString(payload.lead.phone) ?? "";
  }

  if (key === "question") {
    return cleanString(payload.lead.question) ?? cleanString(payload.visitorMessage) ?? "";
  }

  return formatMetadataValue(payload.lead.metadata?.[key]) ?? "";
}

async function upsertMailchimpMember({
  accessToken,
  apiBase,
  audienceId,
  subscriberHash,
  email,
  payload
}: {
  accessToken: string;
  apiBase: string;
  audienceId: string;
  subscriberHash: string;
  email: string;
  payload: IntegrationActionPayload;
}) {
  const memberUrl = `${apiBase}/lists/${encodeURIComponent(audienceId)}/members/${subscriberHash}`;

  try {
    const leadMergeFieldValues = getMailchimpLeadMergeFieldValues(payload);
    const supportedMergeFields = await ensureMailchimpLeadMergeFields({
      accessToken,
      apiBase,
      audienceId,
      mergeFieldValues: leadMergeFieldValues
    });
    const response = await fetch(memberUrl, {
      method: "PUT",
      headers: getMailchimpHeaders(accessToken),
      body: JSON.stringify(buildMailchimpMemberPayload(email, payload, supportedMergeFields, leadMergeFieldValues))
    });

    return await parseMailchimpProviderResponse(response, "Mailchimp contact upsert failed.");
  } catch (error) {
    if (!isMailchimpMergeFieldError(error)) {
      throw error;
    }

    const response = await fetch(memberUrl, {
      method: "PUT",
      headers: getMailchimpHeaders(accessToken),
      body: JSON.stringify(buildMailchimpMemberPayload(email, payload, new Set()))
    });

    return parseMailchimpProviderResponse(response, "Mailchimp contact upsert failed.");
  }
}

async function getMailchimpMergeFieldTags({
  accessToken,
  apiBase,
  audienceId
}: {
  accessToken: string;
  apiBase: string;
  audienceId: string;
}) {
  const url = new URL(`${apiBase}/lists/${encodeURIComponent(audienceId)}/merge-fields`);
  url.searchParams.set("count", "100");
  url.searchParams.set("fields", "merge_fields.tag");
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/json"
    }
  });
  const payload = await parseMailchimpProviderResponse(response, "Mailchimp merge fields could not be loaded.");
  const fields = Array.isArray(payload.merge_fields) ? payload.merge_fields : [];

  return new Set(fields
    .map((field) => {
      if (!field || typeof field !== "object") {
        return null;
      }

      return getString((field as Record<string, unknown>).tag)?.toUpperCase() ?? null;
    })
    .filter((tag): tag is string => Boolean(tag)));
}

async function ensureMailchimpLeadMergeFields({
  accessToken,
  apiBase,
  audienceId,
  mergeFieldValues
}: {
  accessToken: string;
  apiBase: string;
  audienceId: string;
  mergeFieldValues: Record<string, string>;
}) {
  const supportedMergeFields = await getMailchimpMergeFieldTags({ accessToken, apiBase, audienceId });

  if (mergeFieldValues.PHONE && !supportedMergeFields.has("PHONE")) {
    const created = await tryCreateMailchimpMergeField({
      accessToken,
      apiBase,
      audienceId,
      tag: "PHONE",
      name: "Phone",
      type: "phone"
    });

    if (created) {
      supportedMergeFields.add("PHONE");
    }
  }

  if (mergeFieldValues.COMPANY && !supportedMergeFields.has("COMPANY")) {
    const created = await tryCreateMailchimpMergeField({
      accessToken,
      apiBase,
      audienceId,
      tag: "COMPANY",
      name: "Company",
      type: "text"
    });

    if (created) {
      supportedMergeFields.add("COMPANY");
    }
  }

  return supportedMergeFields;
}

async function tryCreateMailchimpMergeField({
  accessToken,
  apiBase,
  audienceId,
  tag,
  name,
  type
}: {
  accessToken: string;
  apiBase: string;
  audienceId: string;
  tag: string;
  name: string;
  type: "text" | "phone";
}) {
  const response = await fetch(`${apiBase}/lists/${encodeURIComponent(audienceId)}/merge-fields`, {
    method: "POST",
    headers: getMailchimpHeaders(accessToken),
    body: JSON.stringify({
      tag,
      name,
      type,
      required: false,
      public: false
    })
  });

  if (response.status === 400 || response.status === 409) {
    return false;
  }

  await parseMailchimpProviderResponse(response, `Mailchimp ${name.toLowerCase()} merge field could not be created.`);

  return true;
}

function buildMailchimpMemberPayload(
  email: string,
  payload: IntegrationActionPayload,
  supportedMergeFields: Set<string>,
  leadMergeFieldValues = getMailchimpLeadMergeFieldValues(payload)
) {
  const nameParts = splitName(payload.lead.name);
  const mergeFields: Record<string, string> = {};

  if (supportedMergeFields.has("FNAME") && nameParts.firstName) {
    mergeFields.FNAME = nameParts.firstName;
  }

  if (supportedMergeFields.has("LNAME") && nameParts.lastName) {
    mergeFields.LNAME = nameParts.lastName;
  }

  if (supportedMergeFields.has("PHONE") && leadMergeFieldValues.PHONE) {
    mergeFields.PHONE = leadMergeFieldValues.PHONE;
  }

  if (supportedMergeFields.has("COMPANY") && leadMergeFieldValues.COMPANY) {
    mergeFields.COMPANY = leadMergeFieldValues.COMPANY;
  }

  return omitNullish({
    email_address: email,
    status_if_new: "subscribed",
    merge_fields: Object.keys(mergeFields).length > 0 ? mergeFields : undefined,
    tags: ["Harlo Lead"]
  });
}

function isMailchimpMergeFieldError(error: unknown) {
  return error instanceof Error && /merge fields? (?:were )?invalid|merge_fields/i.test(error.message);
}

function getMailchimpLeadMergeFieldValues(payload: IntegrationActionPayload) {
  return omitNullish({
    PHONE: cleanString(payload.lead.phone) ?? getLeadMetadataString(payload.lead.metadata, ["phone", "phone_number", "mobile", "tel"]),
    COMPANY: getLeadMetadataString(payload.lead.metadata, ["company", "company_name", "business", "organization"])
  }) as Record<string, string>;
}

function getLeadMetadataString(metadata: Record<string, unknown> | undefined, keys: string[]) {
  if (!metadata) {
    return null;
  }

  for (const key of keys) {
    const value = formatMetadataValue(metadata[key]);

    if (value) {
      return value;
    }
  }

  return null;
}

async function createMailchimpContactNote({
  accessToken,
  apiBase,
  audienceId,
  subscriberHash,
  payload
}: {
  accessToken: string;
  apiBase: string;
  audienceId: string;
  subscriberHash: string;
  payload: IntegrationActionPayload;
}) {
  const note = buildMailchimpLeadNote(payload);

  if (!note) {
    return null;
  }

  const response = await fetch(`${apiBase}/lists/${encodeURIComponent(audienceId)}/members/${subscriberHash}/notes`, {
    method: "POST",
    headers: getMailchimpHeaders(accessToken),
    body: JSON.stringify({ note })
  });
  const notePayload = await parseMailchimpProviderResponse(response, "Mailchimp note creation failed.");

  return getString(notePayload.id);
}

async function tryCreateMailchimpContactNote({
  accessToken,
  apiBase,
  audienceId,
  subscriberHash,
  payload
}: {
  accessToken: string;
  apiBase: string;
  audienceId: string;
  subscriberHash: string;
  payload: IntegrationActionPayload;
}) {
  try {
    return {
      id: await createMailchimpContactNote({ accessToken, apiBase, audienceId, subscriberHash, payload }),
      error: null
    };
  } catch (error) {
    return {
      id: null,
      error: error instanceof Error ? error.message : "Mailchimp note creation failed."
    };
  }
}

function buildMailchimpLeadNote(payload: IntegrationActionPayload) {
  const lines = [
    "Captured by Harlo.",
    formatNoteLine("Name", cleanString(payload.lead.name)),
    formatNoteLine("Phone", cleanString(payload.lead.phone)),
    formatNoteLine("Question", cleanString(payload.lead.question) ?? cleanString(payload.visitorMessage)),
    formatNoteLine("Source page", cleanString(payload.sourcePageUrl)),
    ...getLeadMetadataNoteLines(payload.lead.metadata)
  ].filter((line): line is string => Boolean(line));

  return cleanString(lines.join("\n"));
}

async function findHubSpotContactByEmail(accessToken: string, email: string) {
  const response = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
    method: "POST",
    headers: getHubSpotHeaders(accessToken),
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "email",
              operator: "EQ",
              value: email
            }
          ]
        }
      ],
      properties: ["email"],
      limit: 1
    })
  });
  const payload = await parseProviderResponse(response, "HubSpot contact search failed.");
  const results = Array.isArray(payload.results) ? payload.results : [];
  const firstResult = results[0] as Record<string, unknown> | undefined;

  return getString(firstResult?.id);
}

function buildHubSpotContactProperties(payload: IntegrationActionPayload) {
  const nameParts = splitName(payload.lead.name);
  const properties: Record<string, string> = {
    email: cleanString(payload.lead.email) ?? ""
  };
  const phone = cleanString(payload.lead.phone);

  if (nameParts.firstName) {
    properties.firstname = nameParts.firstName;
  }

  if (nameParts.lastName) {
    properties.lastname = nameParts.lastName;
  }

  if (phone) {
    properties.phone = phone;
  }

  return properties;
}

async function createHubSpotContactNote(accessToken: string, contactId: string, payload: IntegrationActionPayload) {
  const noteBody = buildHubSpotLeadNote(payload);

  if (!noteBody) {
    return null;
  }

  const response = await fetch("https://api.hubapi.com/crm/v3/objects/notes", {
    method: "POST",
    headers: getHubSpotHeaders(accessToken),
    body: JSON.stringify({
      properties: {
        hs_note_body: noteBody,
        hs_timestamp: new Date().toISOString()
      },
      associations: [
        {
          to: {
            id: contactId
          },
          types: [
            {
              associationCategory: "HUBSPOT_DEFINED",
              associationTypeId: 202
            }
          ]
        }
      ]
    })
  });
  const notePayload = await parseProviderResponse(response, "HubSpot note creation failed.");

  return getString(notePayload.id);
}

async function tryCreateHubSpotContactNote(accessToken: string, contactId: string, payload: IntegrationActionPayload) {
  try {
    return {
      id: await createHubSpotContactNote(accessToken, contactId, payload),
      error: null
    };
  } catch (error) {
    return {
      id: null,
      error: error instanceof Error ? error.message : "HubSpot note creation failed."
    };
  }
}

function buildHubSpotLeadNote(payload: IntegrationActionPayload) {
  const lines = [
    "Captured by Harlo.",
    formatNoteLine("Question", cleanString(payload.lead.question) ?? cleanString(payload.visitorMessage)),
    formatNoteLine("Source page", cleanString(payload.sourcePageUrl)),
    ...getLeadMetadataNoteLines(payload.lead.metadata)
  ].filter((line): line is string => Boolean(line));

  return cleanString(lines.join("\n"));
}

async function runJobberLeadAction(
  action: EnabledIntegrationAction,
  payload: IntegrationActionPayload
): Promise<IntegrationActionResult> {
  const client = await createJobberClientLead(action, payload);

  return {
    ok: true,
    status: "success",
    message: action.successMessage ?? "The lead was sent to Jobber.",
    externalRecordId: client.id,
    externalUrl: client.jobberWebUri,
    error: null,
    metadata: {
      clientId: client.id,
      clientName: client.name
    }
  };
}

type JobberClient = {
  id: string | null;
  name: string | null;
  jobberWebUri: string | null;
};

async function createJobberClientLead(action: EnabledIntegrationAction, payload: IntegrationActionPayload): Promise<JobberClient> {
  const clientInput = buildJobberClientInput(payload);
  const leanClientInput = omitNullish({
    firstName: clientInput.firstName,
    lastName: clientInput.lastName,
    emails: clientInput.emails,
    phones: clientInput.phones
  });
  const attempts = [
    { argumentName: "input", input: clientInput },
    { argumentName: "client", input: clientInput },
    { argumentName: "input", input: leanClientInput },
    { argumentName: "client", input: leanClientInput }
  ] as const;
  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      const response = await postJobberGraphQL<{
        clientCreate?: {
          client?: JobberClient | null;
          userErrors?: Array<{ message?: string; path?: Array<string | number> }>;
        };
      }>({
        accessToken: action.credentials.accessToken,
        query: buildJobberClientCreateMutation(attempt.argumentName),
        variables: { [attempt.argumentName]: attempt.input }
      });
      const clientCreate = response.clientCreate;
      const userError = formatJobberUserErrors(clientCreate?.userErrors);

      if (userError) {
        throw new Error(userError);
      }

      const client = clientCreate?.client;

      if (!client?.id) {
        throw new Error("Jobber did not return the created client.");
      }

      return {
        id: client.id,
        name: client.name ?? null,
        jobberWebUri: client.jobberWebUri ?? null
      };
    } catch (error) {
      lastError = error;

      if (!isJobberSchemaError(error)) {
        break;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Jobber client creation failed.");
}

function buildJobberClientCreateMutation(argumentName: "input" | "client") {
  return `
    mutation CreateHarloJobberClient($${argumentName}: ClientCreateInput!) {
      clientCreate(${argumentName}: $${argumentName}) {
        client {
          id
          name
          jobberWebUri
        }
        userErrors {
          message
          path
        }
      }
    }
  `;
}

function buildJobberClientInput(payload: IntegrationActionPayload) {
  const nameParts = splitName(payload.lead.name);
  const email = cleanString(payload.lead.email);
  const phone = cleanString(payload.lead.phone);
  const note = buildJobberLeadNote(payload);

  return omitNullish({
    firstName: nameParts.firstName ?? "Website",
    lastName: nameParts.lastName ?? "Lead",
    isLead: true,
    emails: email ? [{
      description: "MAIN",
      primary: true,
      address: email
    }] : undefined,
    phones: phone ? [{
      description: "MAIN",
      primary: true,
      number: phone
    }] : undefined,
    note: note ?? undefined
  });
}

function buildJobberLeadNote(payload: IntegrationActionPayload) {
  const lines = [
    "Captured by Harlo.",
    formatNoteLine("Question", cleanString(payload.lead.question) ?? cleanString(payload.visitorMessage)),
    formatNoteLine("Source page", cleanString(payload.sourcePageUrl)),
    ...getLeadMetadataNoteLines(payload.lead.metadata)
  ].filter((line): line is string => Boolean(line));

  return cleanString(lines.join("\n"));
}

function getLeadMetadataNoteLines(metadata: Record<string, unknown> | undefined) {
  if (!metadata) {
    return [];
  }

  const duplicateKeys = new Set(["name", "email", "phone", "question"]);

  return Object.entries(metadata)
    .filter(([key]) => !key.endsWith("_label") && !key.endsWith("_type") && !duplicateKeys.has(key))
    .map(([key, value]) => {
      const label = cleanString(metadata[`${key}_label`] as string | null | undefined) ?? titleizeKey(key);
      const formattedValue = formatMetadataValue(value);

      return formatNoteLine(label, formattedValue);
    })
    .filter((line): line is string => Boolean(line));
}

function formatNoteLine(label: string, value: string | null | undefined) {
  return value ? `${label}: ${value}` : null;
}

async function runSlackNotificationAction(
  action: EnabledIntegrationAction,
  payload: IntegrationActionPayload
): Promise<IntegrationActionResult> {
  const channel = getString(action.config.slackChannelId) ?? getString(action.config.channelId);

  if (!channel) {
    return {
      ok: false,
      status: "skipped",
      message: action.fallbackMessage ?? "Slack notification was skipped because no channel is configured.",
      externalRecordId: null,
      externalUrl: null,
      error: "Missing Slack channel ID."
    };
  }

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      authorization: `Bearer ${action.credentials.accessToken}`,
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({
      channel,
      text: buildSlackLeadNotificationText(payload),
      blocks: buildSlackLeadNotificationBlocks(payload)
    })
  });
  const slackPayload = await parseSlackProviderResponse(response, "Slack notification failed.");
  const messageTs = getString(slackPayload.ts);
  const channelId = getString(slackPayload.channel) ?? channel;
  const teamId = action.credentials.providerAccountId;

  return {
    ok: true,
    status: "success",
    message: action.successMessage ?? "The lead was sent to Slack.",
    externalRecordId: messageTs,
    externalUrl: teamId && messageTs
      ? `https://app.slack.com/client/${teamId}/${channelId}/thread/${channelId}-${messageTs.replace(".", "")}`
      : null,
    error: null,
    metadata: {
      channel: channelId,
      ts: messageTs
    }
  };
}

function buildSlackLeadNotificationText(payload: IntegrationActionPayload) {
  const name = cleanString(payload.lead.name) ?? "Website visitor";
  const question = cleanString(payload.lead.question) ?? cleanString(payload.visitorMessage) ?? "No question provided.";

  return `New Harlo lead from ${name}: ${question}`;
}

function buildSlackLeadNotificationBlocks(payload: IntegrationActionPayload) {
  const fields = [
    slackField("Name", cleanString(payload.lead.name) ?? "Website visitor"),
    slackField("Email", cleanString(payload.lead.email) ?? "Not provided"),
    slackField("Phone", cleanString(payload.lead.phone) ?? "Not provided"),
    ...getSlackLeadMetadataFields(payload.lead.metadata)
  ];
  const question = cleanString(payload.lead.question) ?? cleanString(payload.visitorMessage);
  const sourcePage = cleanString(payload.sourcePageUrl);

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "New Harlo lead",
        emoji: true
      }
    },
    ...chunkSlackFields(fields).map((fieldChunk) => ({
      type: "section",
      fields: fieldChunk
    })),
    ...(question
      ? [{
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Question*\n${escapeSlackText(question)}`
        }
      }]
      : []),
    ...(sourcePage
      ? [{
        type: "context",
        elements: [{
          type: "mrkdwn",
          text: `Source: <${escapeSlackLink(sourcePage)}|website page>`
        }]
      }]
      : [])
  ];
}

function slackField(label: string, value: string) {
  return {
    type: "mrkdwn",
    text: `*${escapeSlackText(label)}*\n${escapeSlackText(truncateSlackText(value, 700))}`
  };
}

function getSlackLeadMetadataFields(metadata: Record<string, unknown> | undefined) {
  if (!metadata) {
    return [];
  }

  const duplicateKeys = new Set(["name", "email", "phone", "question"]);

  return Object.entries(metadata)
    .filter(([key]) => !key.endsWith("_label") && !key.endsWith("_type") && !duplicateKeys.has(key))
    .map(([key, value]) => {
      const label = cleanString(metadata[`${key}_label`] as string | null | undefined) ?? titleizeKey(key);
      const formattedValue = formatSlackMetadataValue(value);

      return formattedValue ? slackField(label, formattedValue) : null;
    })
    .filter((field): field is ReturnType<typeof slackField> => Boolean(field));
}

function formatSlackMetadataValue(value: unknown) {
  return formatMetadataValue(value);
}

function formatMetadataValue(value: unknown) {
  if (typeof value === "string") {
    return cleanString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const text = value
      .map((item) => typeof item === "string" || typeof item === "number" || typeof item === "boolean" ? String(item) : null)
      .filter((item): item is string => Boolean(item))
      .join(", ");

    return cleanString(text);
  }

  return null;
}

async function postJobberGraphQL<T>({
  accessToken,
  query,
  variables
}: {
  accessToken: string;
  query: string;
  variables: Record<string, unknown>;
}) {
  const response = await fetch("https://api.getjobber.com/api/graphql", {
    method: "POST",
    headers: getJobberHeaders(accessToken),
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || typeof payload !== "object") {
    const message = getProviderResponseMessage(payload) ?? "Jobber GraphQL request failed.";
    throw new Error(message);
  }

  const record = payload as { data?: T; errors?: Array<{ message?: string }> };

  if (record.errors?.length) {
    throw new Error(record.errors.map((error) => error.message).filter(Boolean).join("; ") || "Jobber GraphQL request failed.");
  }

  if (!record.data) {
    throw new Error("Jobber did not return GraphQL data.");
  }

  return record.data;
}

function getJobberHeaders(accessToken: string) {
  const headers: Record<string, string> = {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
    accept: "application/json"
  };
  const graphqlVersion = process.env.JOBBER_GRAPHQL_VERSION?.trim() || DEFAULT_JOBBER_GRAPHQL_VERSION;

  headers["X-JOBBER-GRAPHQL-VERSION"] = graphqlVersion;

  return headers;
}

function formatJobberUserErrors(errors: Array<{ message?: string; path?: Array<string | number> }> | null | undefined) {
  if (!errors?.length) {
    return null;
  }

  return errors
    .map((error) => {
      const path = error.path?.length ? `${error.path.join(".")}: ` : "";

      return `${path}${error.message ?? "Jobber validation error."}`;
    })
    .join("; ");
}

function isJobberSchemaError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /argument|field|variable|ClientCreateInput|clientCreate|unknown|undefined|required/i.test(error.message);
}

function chunkSlackFields<T>(fields: T[]) {
  const chunks: T[][] = [];

  for (let index = 0; index < fields.length; index += 10) {
    chunks.push(fields.slice(index, index + 10));
  }

  return chunks;
}

function titleizeKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getHubSpotHeaders(accessToken: string) {
  return {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
    accept: "application/json"
  };
}

function getMailchimpHeaders(accessToken: string) {
  return {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
    accept: "application/json"
  };
}

async function parseProviderResponse(response: Response, fallbackMessage: string) {
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || typeof payload !== "object") {
    const message = getProviderResponseMessage(payload) ?? fallbackMessage;
    throw new Error(message);
  }

  return payload as Record<string, unknown>;
}

async function parseMailchimpProviderResponse(response: Response, fallbackMessage: string) {
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || typeof payload !== "object") {
    const message = getMailchimpErrorMessage(payload) ?? fallbackMessage;
    throw new Error(message);
  }

  return payload as Record<string, unknown>;
}

async function parseSlackProviderResponse(response: Response, fallbackMessage: string) {
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || typeof payload !== "object" || payload.ok !== true) {
    const message = getProviderResponseMessage(payload) ?? fallbackMessage;
    throw new Error(message);
  }

  return payload as Record<string, unknown>;
}

async function logIntegrationRun({
  supabase,
  action,
  payload,
  result,
  durationMs,
  reason
}: Omit<RunIntegrationActionInput, "actionLimit"> & {
  result: IntegrationActionResult;
  durationMs: number;
  reason: string;
}) {
  const { error } = await supabase.from("integration_action_runs").insert({
    organization_id: payload.organizationId,
    bot_id: payload.botId,
    conversation_id: payload.conversationId ?? null,
    lead_id: payload.leadId ?? null,
    integration_id: action.integrationId,
    provider: action.provider,
    action_type: action.actionType,
    action_key: action.id,
    trigger_type: action.triggerType,
    status: result.status,
    external_record_id: result.externalRecordId ?? null,
    external_url: result.externalUrl ?? null,
    input_summary: buildIntegrationInputSummary(payload),
    result_message: result.message ?? null,
    result_metadata: result.metadata ?? {},
    error_message: result.error ?? null,
    duration_ms: durationMs,
    completed_at: new Date().toISOString(),
    reason
  });

  if (error) {
    console.error("Could not log integration action run", error);
  }
}

async function reserveIntegrationRun({
  supabase,
  action,
  payload,
  inputSummary,
  actionLimit
}: {
  supabase: SupabaseServiceClient;
  action: EnabledIntegrationAction;
  payload: IntegrationActionPayload;
  inputSummary: Record<string, unknown>;
  actionLimit: number;
}) {
  const { data, error } = await supabase.rpc("reserve_integration_action_run", {
    p_organization_id: payload.organizationId,
    p_bot_id: payload.botId,
    p_conversation_id: payload.conversationId ?? null,
    p_lead_id: payload.leadId ?? null,
    p_integration_id: action.integrationId,
    p_provider: action.provider,
    p_action_type: action.actionType,
    p_action_key: action.id,
    p_trigger_type: action.triggerType,
    p_input_summary: inputSummary,
    p_action_limit: actionLimit
  });

  if (error) {
    console.error("Could not reserve integration action run", error);
    return {
      runId: null,
      error
    };
  }

  return {
    runId: typeof data === "string" ? data : null,
    error: null
  };
}

async function completeIntegrationRun({
  supabase,
  runId,
  result,
  durationMs
}: {
  supabase: SupabaseServiceClient;
  runId: string;
  result: IntegrationActionResult;
  durationMs: number;
}) {
  const { error } = await supabase
    .from("integration_action_runs")
    .update({
      status: result.status,
      external_record_id: result.externalRecordId ?? null,
      external_url: result.externalUrl ?? null,
      result_message: result.message ?? null,
      result_metadata: result.metadata ?? {},
      error_message: result.error ?? null,
      duration_ms: durationMs,
      completed_at: new Date().toISOString()
    })
    .eq("id", runId);

  if (error) {
    console.error("Could not complete integration action run", error);
  }
}

function buildIntegrationInputSummary(payload: IntegrationActionPayload) {
  return {
    visitorMessage: payload.visitorMessage.slice(0, 500),
    lead: {
      hasName: Boolean(payload.lead.name),
      hasEmail: Boolean(payload.lead.email),
      hasPhone: Boolean(payload.lead.phone)
    },
    sourcePageUrl: payload.sourcePageUrl ?? null
  };
}

async function updateIntegrationStatus({
  supabase,
  action,
  result
}: {
  supabase: SupabaseServiceClient;
  action: EnabledIntegrationAction;
  result: IntegrationActionResult;
}) {
  const update = result.ok
    ? {
      last_success_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString()
    }
    : {
      last_error: result.error ?? result.message ?? null,
      updated_at: new Date().toISOString()
    };
  const { error } = await supabase.from("integrations").update(update).eq("id", action.integrationId);

  if (error) {
    console.error("Could not update integration status", error);
  }
}

function splitName(name: string | null | undefined) {
  const cleanName = cleanString(name);

  if (!cleanName) {
    return {
      firstName: null,
      lastName: null
    };
  }

  const parts = cleanName.split(/\s+/);

  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null
  };
}

function omitNullish<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== null && entryValue !== undefined)
  ) as Partial<T>;
}

function cleanString(value: string | null | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getProviderResponseMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  return getGoogleSheetsErrorMessage(payload) ?? getString(record.message) ?? getString(record.error_description) ?? getString(record.error);
}

function escapeSlackText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function truncateSlackText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function escapeSlackLink(value: string) {
  return value.replace(/>/g, "%3E").replace(/\|/g, "%7C");
}

function isIntegrationActionType(value: string): value is IntegrationActionType {
  return value === "show_booking_link" ||
    value === "submit_service_request" ||
    value === "send_webhook" ||
    value === "send_notification" ||
    value === "create_crm_contact";
}

function isIntegrationProvider(value: string): value is IntegrationProviderKey {
  return value === "calendly" ||
    value === "calcom" ||
    value === "jobber" ||
    value === "slack" ||
    value === "hubspot" ||
    value === "mailchimp" ||
    value === "google_sheets";
}

function isIntegrationTriggerType(value: string): value is IntegrationTriggerType {
  return value === "booking_requested" ||
    value === "service_request_completed" ||
    value === "lead_captured" ||
    value === "human_follow_up_requested" ||
    value === "integration_failed";
}
