import { decryptIntegrationCredentials, encryptIntegrationCredentials } from "@/lib/integrations/credentials";
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

async function getFreshIntegrationCredentials({
  supabase,
  integrationId,
  provider,
  encryptedCredentials,
  requestUrl
}: {
  supabase: SupabaseServiceClient;
  integrationId: string;
  provider: IntegrationProviderKey;
  encryptedCredentials: string;
  requestUrl?: string;
}) {
  const credentials = decryptIntegrationCredentials<OAuthTokenSet>(encryptedCredentials);

  if (!requestUrl) {
    return credentials;
  }

  const refreshedCredentials = await refreshProviderTokenIfNeeded({
    provider,
    requestUrl,
    tokenSet: credentials
  });

  if (
    refreshedCredentials.accessToken !== credentials.accessToken ||
    refreshedCredentials.refreshToken !== credentials.refreshToken ||
    refreshedCredentials.expiresAt !== credentials.expiresAt
  ) {
    await persistRefreshedCredentials({
      supabase,
      integrationId,
      credentials: refreshedCredentials
    });
  }

  return refreshedCredentials;
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
  requestUrl
}: RunIntegrationActionInput): Promise<IntegrationActionResult> {
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

  await logIntegrationRun({ supabase, action, payload, result });
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

  if (action.provider === "hubspot" && action.actionType === "create_crm_contact") {
    return runHubSpotContactAction(action, payload);
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

async function parseProviderResponse(response: Response, fallbackMessage: string) {
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || typeof payload !== "object") {
    const message = getProviderResponseMessage(payload) ?? fallbackMessage;
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
  result
}: RunIntegrationActionInput & { result: IntegrationActionResult }) {
  const { error } = await supabase.from("integration_action_runs").insert({
    organization_id: payload.organizationId,
    bot_id: payload.botId,
    conversation_id: payload.conversationId ?? null,
    lead_id: payload.leadId ?? null,
    integration_id: action.integrationId,
    provider: action.provider,
    action_type: action.actionType,
    status: result.status,
    external_record_id: result.externalRecordId ?? null,
    external_url: result.externalUrl ?? null,
    input_summary: {
      visitorMessage: payload.visitorMessage.slice(0, 500),
      lead: {
        hasName: Boolean(payload.lead.name),
        hasEmail: Boolean(payload.lead.email),
        hasPhone: Boolean(payload.lead.phone)
      },
      sourcePageUrl: payload.sourcePageUrl ?? null
    },
    error_message: result.error ?? null
  });

  if (error) {
    console.error("Could not log integration action run", error);
  }
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

  return getString(record.message) ?? getString(record.error_description) ?? getString(record.error);
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
    value === "whatsapp" ||
    value === "instagram" ||
    value === "messenger";
}

function isIntegrationTriggerType(value: string): value is IntegrationTriggerType {
  return value === "booking_requested" ||
    value === "service_request_completed" ||
    value === "lead_captured" ||
    value === "human_follow_up_requested" ||
    value === "integration_failed";
}
