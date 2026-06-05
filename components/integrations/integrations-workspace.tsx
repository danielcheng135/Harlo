"use client";

import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, ExternalLink, Info, Link, Loader2, Lock, Settings2, Unlink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { ToastViewport, useToast } from "@/components/ui/toast";
import type { IntegrationConfiguredAction, IntegrationOverview, IntegrationProviderOverview } from "@/lib/harlo/data";
import type { IntegrationActionType, IntegrationProviderKey, IntegrationTriggerType } from "@/lib/integrations/types";

type IntegrationsWorkspaceProps = {
  initialTab: "all" | "connected" | "disconnected";
  integrationStatus: string | null;
  statusProvider: IntegrationProviderKey | null;
  overview: IntegrationOverview;
};

type DisplayProvider = IntegrationProviderOverview & {
  visiblePlan: "Growth" | "Pro";
  locked: boolean;
};

type BookingEventTypeOption = {
  id: string;
  name: string;
  url: string;
  durationLabel: string | null;
};

type EventTypeState = {
  loading: boolean;
  error: string | null;
  options: BookingEventTypeOption[];
};

type MailchimpAudienceOption = {
  id: string;
  name: string;
  memberCount: number | null;
};

type AudienceState = {
  loading: boolean;
  error: string | null;
  options: MailchimpAudienceOption[];
};

const logoUrls: Record<IntegrationProviderKey, string> = {
  calendly: "https://www.google.com/s2/favicons?domain=calendly.com&sz=128",
  calcom: "https://www.google.com/s2/favicons?domain=cal.com&sz=128",
  jobber: "https://www.google.com/s2/favicons?domain=getjobber.com&sz=128",
  slack: "https://www.google.com/s2/favicons?domain=slack.com&sz=128",
  hubspot: "https://www.google.com/s2/favicons?domain=hubspot.com&sz=128",
  mailchimp: "https://www.google.com/s2/favicons?domain=mailchimp.com&sz=128",
  google_sheets: "/google-sheets-logo.svg"
};

const actionLabels: Record<IntegrationActionType, string> = {
  show_booking_link: "Show booking link",
  submit_service_request: "Submit service request",
  send_webhook: "Send webhook",
  send_notification: "Send notification",
  create_crm_contact: "Create CRM contact"
};

function getActionLabel(provider: IntegrationProviderKey, actionType: IntegrationActionType) {
  if (provider === "calcom" && actionType === "show_booking_link") {
    return "Show Cal.com Scheduler";
  }

  if (provider === "jobber" && actionType === "submit_service_request") {
    return "Create Jobber Client";
  }

  if (provider === "slack" && actionType === "send_notification") {
    return "Lead Capture Notification";
  }

  if (provider === "mailchimp" && actionType === "create_crm_contact") {
    return "Add Lead to Audience";
  }

  if (provider === "google_sheets" && actionType === "create_crm_contact") {
    return "Append Lead Row";
  }

  return actionLabels[actionType];
}

export function IntegrationsWorkspace({
  initialTab,
  integrationStatus,
  statusProvider,
  overview
}: IntegrationsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"all" | "connected" | "disconnected">(initialTab);
  const [expandedProvider, setExpandedProvider] = useState<IntegrationProviderKey | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<IntegrationProviderKey | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState<IntegrationProviderKey | null>(null);
  const [savingProvider, setSavingProvider] = useState<IntegrationProviderKey | null>(null);
  const [eventTypesByProvider, setEventTypesByProvider] = useState<Partial<Record<IntegrationProviderKey, EventTypeState>>>({});
  const [audiencesByProvider, setAudiencesByProvider] = useState<Partial<Record<IntegrationProviderKey, AudienceState>>>({});
  const { toast, showToast, dismissToast } = useToast();
  const [providers, setProviders] = useState<DisplayProvider[]>(() => overview.providers.map(toDisplayProvider));
  const connectedCount = providers.filter((provider) => provider.status === "connected").length;
  const disconnectedCount = providers.filter((provider) => provider.status !== "connected").length;
  const visibleProviders = activeTab === "connected"
    ? providers.filter((provider) => provider.status === "connected")
    : activeTab === "disconnected"
      ? providers.filter((provider) => provider.status !== "connected")
      : providers;

  useEffect(() => {
    setProviders(overview.providers.map(toDisplayProvider));
  }, [overview.providers]);

  useEffect(() => {
    if (!integrationStatus) {
      return;
    }

    const provider = statusProvider ? providers.find((item) => item.key === statusProvider) ?? null : null;
    const message = getStatusMessage(integrationStatus, provider?.name ?? "Integration");
    showToast(message.tone === "success" ? "success" : "error", `${message.title} ${message.body}`);
  }, [integrationStatus, statusProvider]);

  useEffect(() => {
    if (!expandedProvider || !isBookingProvider(expandedProvider)) {
      return;
    }

    const provider = providers.find((item) => item.key === expandedProvider);

    if (!provider || provider.status !== "connected" || eventTypesByProvider[expandedProvider]) {
      return;
    }

    setEventTypesByProvider((current) => ({
      ...current,
      [expandedProvider]: {
        loading: true,
        error: null,
        options: []
      }
    }));

    fetch(`/api/integrations/${expandedProvider}/event-types`, {
      headers: {
        accept: "application/json",
        "x-requested-with": "fetch"
      }
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as {
          ok?: boolean;
          error?: string;
          eventTypes?: BookingEventTypeOption[];
        } | null;

        if (!response.ok || payload?.ok !== true) {
          throw new Error(payload?.error ?? "Event types could not be loaded.");
        }

        setEventTypesByProvider((current) => ({
          ...current,
          [expandedProvider]: {
            loading: false,
            error: null,
            options: normalizeEventTypeOptions(payload.eventTypes)
          }
        }));
      })
      .catch((error) => {
        setEventTypesByProvider((current) => ({
          ...current,
          [expandedProvider]: {
            loading: false,
            error: error instanceof Error ? error.message : "Event types could not be loaded.",
            options: []
          }
        }));
      });
  }, [expandedProvider, providers, eventTypesByProvider]);

  useEffect(() => {
    if (expandedProvider !== "mailchimp") {
      return;
    }

    const provider = providers.find((item) => item.key === expandedProvider);

    if (!provider || provider.status !== "connected" || audiencesByProvider[expandedProvider]) {
      return;
    }

    setAudiencesByProvider((current) => ({
      ...current,
      mailchimp: {
        loading: true,
        error: null,
        options: []
      }
    }));

    fetch("/api/integrations/mailchimp/audiences", {
      headers: {
        accept: "application/json",
        "x-requested-with": "fetch"
      }
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as {
          ok?: boolean;
          error?: string;
          audiences?: MailchimpAudienceOption[];
        } | null;

        if (!response.ok || payload?.ok !== true) {
          throw new Error(payload?.error ?? "Mailchimp audiences could not be loaded.");
        }

        setAudiencesByProvider((current) => ({
          ...current,
          mailchimp: {
            loading: false,
            error: null,
            options: normalizeAudienceOptions(payload.audiences)
          }
        }));
      })
      .catch((error) => {
        setAudiencesByProvider((current) => ({
          ...current,
          mailchimp: {
            loading: false,
            error: error instanceof Error ? error.message : "Mailchimp audiences could not be loaded.",
            options: []
          }
        }));
      });
  }, [expandedProvider, providers, audiencesByProvider]);

  async function handleDisconnect(provider: DisplayProvider) {
    setDisconnectingProvider(provider.key);

    try {
      const response = await fetch(`/api/integrations/${provider.key}/disconnect`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "x-requested-with": "fetch"
        }
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error ?? "Integration could not be disconnected.");
      }

      setExpandedProvider((current) => current === provider.key ? null : current);
      setProviders((current) => current.map((item) => item.key === provider.key ? {
        ...item,
        status: "disconnected",
        lastError: null,
        configuredActions: []
      } : item));
      showToast("success", `${provider.name} disconnected. Credentials were removed from Harlo.`);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Integration could not be disconnected.");
    } finally {
      setDisconnectingProvider(null);
    }
  }

  async function handleSaveConfiguration(provider: DisplayProvider, form: HTMLFormElement) {
    try {
      const formData = new FormData(form);
      const validationError = validateIntegrationConfiguration(provider, formData);

      if (validationError) {
        showToast("error", validationError);
        return;
      }

      setSavingProvider(provider.key);
      const response = await fetch(`/api/integrations/${provider.key}/configure`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "x-requested-with": "fetch"
        },
        body: formData
      });
      const payload = await response.json().catch(() => null) as {
        ok?: boolean;
        error?: string;
      } | null;

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error ?? "Configuration could not be saved.");
      }

      const nextActions = getConfiguredActionsFromForm(provider, formData);
      setProviders((current) => current.map((item) => item.key === provider.key ? {
        ...item,
        configuredActions: nextActions
      } : item));
      showToast("success", `${provider.name} configuration saved.`);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Configuration could not be saved.");
    } finally {
      setSavingProvider(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <ToastViewport toast={toast} onDismiss={dismissToast} />
      {!overview.migrationReady ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p>Integration tables are not available yet. Apply the latest Supabase migration before connecting providers.</p>
          </div>
        </div>
      ) : null}

      <div className="border-b border-harlo-line pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-harlo-ink">Integrations</h1>
          <div className="mt-7 flex items-center gap-7 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`-mb-[17px] border-b-2 pb-4 ${activeTab === "all" ? "border-harlo-teal text-harlo-teal" : "border-transparent text-harlo-muted hover:text-harlo-ink"}`}
            >
              All integrations
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("connected")}
              className={`-mb-[17px] inline-flex items-center gap-2 border-b-2 pb-4 ${activeTab === "connected" ? "border-harlo-teal text-harlo-teal" : "border-transparent text-harlo-muted hover:text-harlo-ink"}`}
            >
              Connected
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-slate-100 px-2 text-xs text-slate-600">
                {connectedCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("disconnected")}
              className={`-mb-[17px] inline-flex items-center gap-2 border-b-2 pb-4 ${activeTab === "disconnected" ? "border-harlo-teal text-harlo-teal" : "border-transparent text-harlo-muted hover:text-harlo-ink"}`}
            >
              Disconnected
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-slate-100 px-2 text-xs text-slate-600">
                {disconnectedCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {visibleProviders.length > 0 ? visibleProviders.map((provider) => (
          <ProviderRow
            key={provider.key}
            expanded={expandedProvider === provider.key}
            loadingConnect={connectingProvider === provider.key}
            loadingDisconnect={disconnectingProvider === provider.key}
            loadingSave={savingProvider === provider.key}
            onConnectStart={() => setConnectingProvider(provider.key)}
            onDisconnect={() => handleDisconnect(provider)}
            onSaveConfiguration={(form) => handleSaveConfiguration(provider, form)}
            onToggleConfigure={() => setExpandedProvider((current) => current === provider.key ? null : provider.key)}
            overview={overview}
            provider={provider}
            eventTypeState={eventTypesByProvider[provider.key] ?? null}
            audienceState={audiencesByProvider[provider.key] ?? null}
          />
        )) : (
          <div className="rounded-lg border border-dashed border-harlo-line bg-white px-4 py-10 text-center">
            <p className="text-sm font-semibold text-harlo-ink">{activeTab === "connected" ? "No connected integrations yet." : "No disconnected integrations."}</p>
            <p className="mt-2 text-sm text-harlo-muted">
              {activeTab === "connected" ? "Connect a provider from All integrations to make it available in the widget." : "Everything in this workspace is connected."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderRow({
  expanded,
  loadingConnect,
  loadingDisconnect,
  loadingSave,
  onConnectStart,
  onDisconnect,
  onSaveConfiguration,
  onToggleConfigure,
  overview,
  provider,
  eventTypeState,
  audienceState
}: {
  expanded: boolean;
  loadingConnect: boolean;
  loadingDisconnect: boolean;
  loadingSave: boolean;
  onConnectStart: () => void;
  onDisconnect: () => void;
  onSaveConfiguration: (form: HTMLFormElement) => void;
  onToggleConfigure: () => void;
  overview: IntegrationOverview;
  provider: DisplayProvider;
  eventTypeState: EventTypeState | null;
  audienceState: AudienceState | null;
}) {
  const isConnected = provider.status === "connected";
  const showConnect = !provider.locked && !isConnected;
  const setupPending = showConnect && !provider.oauthConfigured;

  return (
    <div className={`relative rounded-lg border bg-white shadow-sm transition ${expanded ? "border-harlo-teal/40 shadow-harlo-teal/10" : "border-harlo-line"}`}>
      <div className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(220px,1.2fr)_100px_minmax(150px,0.8fr)_minmax(120px,0.7fr)_8rem] lg:items-center lg:px-5">
        <div className="flex min-w-0 items-start justify-between gap-4 lg:contents">
          <div className="flex min-w-0 items-center gap-4 lg:col-span-1 lg:gap-5">
            <Logo provider={provider} />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-harlo-ink">{provider.name}</p>
              <StatusPill provider={provider} />
            </div>
          </div>

          <div className="grid w-[5.5rem] shrink-0 grid-cols-2 gap-2 justify-self-end lg:col-span-1 lg:col-start-5 lg:row-start-1 lg:ml-auto lg:mr-10">
            {provider.locked ? (
              <IconButton label="Configure" disabled>
                <Settings2 size={17} />
              </IconButton>
            ) : (
              <>
                <IconButton label={expanded ? "Close configuration" : "Configure"} disabled={!isConnected} onClick={onToggleConfigure}>
                  <Settings2 size={17} />
                </IconButton>
                {isConnected ? (
                  <IconButton label="Disconnect" loading={loadingDisconnect} onClick={onDisconnect} tone="danger">
                    <Unlink size={17} />
                  </IconButton>
                ) : setupPending ? (
                  <IconButton label="Setup pending" disabled>
                    <Link size={17} />
                  </IconButton>
                ) : showConnect ? (
                  <IconLink href={`/api/integrations/${provider.key}/connect`} label="Connect" loading={loadingConnect} onClick={onConnectStart}>
                    <Link size={17} />
                  </IconLink>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:contents">
          <InfoCell label="Plan">
            <span className="inline-flex rounded-full border border-harlo-teal/10 bg-harlo-mist px-2.5 py-1 text-xs font-semibold text-harlo-teal">
              {provider.visiblePlan}
            </span>
          </InfoCell>

          <InfoCell label="Last sync">
            {provider.lastSuccessAt ? (
              <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-harlo-ink lg:whitespace-nowrap">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span className="min-w-0 break-words">{formatDateTime(provider.lastSuccessAt)}</span>
              </span>
            ) : (
              <span className="text-sm font-medium text-harlo-muted">-</span>
            )}
          </InfoCell>

          <InfoCell label="Last error">
            {provider.lastError ? (
              <span className="inline-flex min-w-0 max-w-full items-center gap-2 text-sm font-medium text-harlo-ink" title={provider.lastError}>
                <AlertTriangle size={15} className="shrink-0 text-rose-500" />
                <span className="block min-w-0 max-w-full truncate">{provider.lastError}</span>
              </span>
            ) : (
              <span className="text-sm font-medium text-harlo-ink">-</span>
            )}
          </InfoCell>
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        aria-hidden={!expanded}
      >
        <div className="min-h-0 overflow-hidden rounded-b-lg">
          <div className={`transition-opacity duration-200 ${expanded ? "opacity-100 delay-100" : "opacity-0"}`}>
            <ConfigurePanel
              eventTypeState={eventTypeState}
              audienceState={audienceState}
              expanded={expanded}
              loadingSave={loadingSave}
              onSave={onSaveConfiguration}
              provider={provider}
              overview={overview}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigurePanel({
  eventTypeState,
  audienceState,
  expanded,
  loadingSave,
  onSave,
  provider,
  overview
}: {
  eventTypeState: EventTypeState | null;
  audienceState: AudienceState | null;
  expanded: boolean;
  loadingSave: boolean;
  onSave: (form: HTMLFormElement) => void;
  provider: DisplayProvider;
  overview: IntegrationOverview;
}) {
  const enabledBotIds = new Set(provider.configuredActions.filter((action) => action.enabled).map((action) => action.botId));
  const hasConfiguredAgents = provider.configuredActions.some((action) => action.enabled);
  const primaryAction = provider.actionTypes[0];
  const firstAction = provider.configuredActions.find((action) => action.successMessage || action.fallbackMessage || action.config) ?? provider.configuredActions[0];
  const slackChannelId = getStringConfig(firstAction?.config, "slackChannelId");
  const mailchimpAudienceId = getStringConfig(firstAction?.config, "mailchimpAudienceId");
  const mailchimpAudienceName = getStringConfig(firstAction?.config, "mailchimpAudienceName");
  const googleSpreadsheetId = getStringConfig(firstAction?.config, "spreadsheetId");
  const googleSheetName = getStringConfig(firstAction?.config, "sheetName");
  const selectedEventTypes = normalizeEventTypeOptions(firstAction?.config?.selectedEventTypes);
  const selectedEventTypeIds = new Set(selectedEventTypes.map((eventType) => eventType.id));
  const hasSavedEventTypes = selectedEventTypeIds.size > 0;
  const eventTypeOptions = eventTypeState?.options ?? [];
  const shouldShowEventTypes = isBookingProvider(provider.key);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(() => new Set(selectedEventTypeIds));
  const selectedEventTypeKey = selectedEventTypes.map((eventType) => eventType.id).join("|");
  const eventTypeOptionKey = eventTypeOptions.map((eventType) => eventType.id).join("|");
  const canConfigure = provider.status === "connected" && provider.integrationId;
  const slackMissingChannel = provider.key === "slack" && !slackChannelId;
  const mailchimpMissingAudience = provider.key === "mailchimp" && !mailchimpAudienceId;
  const googleSheetsMissingTarget = provider.key === "google_sheets" && (!googleSpreadsheetId || !googleSheetName);
  const selectedEventCount = selectedEventIds.size;

  useEffect(() => {
    if (!shouldShowEventTypes || eventTypeOptions.length === 0) {
      setSelectedEventIds(new Set(selectedEventTypeIds));
      return;
    }

    setSelectedEventIds(new Set(hasSavedEventTypes ? selectedEventTypeIds : eventTypeOptions.map((eventType) => eventType.id)));
  }, [shouldShowEventTypes, hasSavedEventTypes, selectedEventTypeKey, eventTypeOptionKey]);

  function toggleEventType(eventTypeId: string, checked: boolean) {
    setSelectedEventIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(eventTypeId);
      } else {
        next.delete(eventTypeId);
      }

      return next;
    });
  }

  return (
    <div className="border-t border-harlo-line bg-white px-4 py-4 sm:px-5">
      <form
        action={`/api/integrations/${provider.key}/configure`}
        method="post"
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(event.currentTarget);
        }}
      >
        <input type="hidden" name="actionType" value={primaryAction ?? ""} />
        {shouldShowEventTypes ? (
          <input type="hidden" name="eventTypesSnapshot" value={JSON.stringify(eventTypeOptions)} />
        ) : null}
        <div className="flex flex-col gap-4 rounded-lg border border-harlo-line bg-slate-50/70 px-4 py-3 md:flex-row md:items-center">
          <div className="flex items-center gap-3 md:pr-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-harlo-teal shadow-sm ring-1 ring-harlo-line">
              <Settings2 size={17} />
            </span>
            <ConfigMetaItem label="Status" value={provider.status === "connected" ? "Connected" : "Not connected"} tone={provider.status === "connected" ? "success" : "default"} />
          </div>
          <div className="hidden h-8 w-px bg-harlo-line md:block" />
          <ConfigMetaItem label="Account" value={provider.displayName ?? "Connected account"} />
          <div className="hidden h-8 w-px bg-harlo-line md:block" />
          <ConfigMetaItem label="Action" value={primaryAction ? getActionLabel(provider.key, primaryAction) : "No action available"} />
        </div>

        <fieldset className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <legend className="text-sm font-semibold text-harlo-ink">Widget agents</legend>
              <p className="mt-1 text-sm leading-6 text-harlo-muted">Choose which widget agents can use this integration.</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {overview.bots.map((bot) => (
              <label key={bot.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-harlo-line bg-white px-3 py-3 text-sm font-medium text-harlo-ink shadow-sm transition hover:border-harlo-teal/60">
                <Checkbox
                  name="botIds"
                  value={bot.id}
                  defaultChecked={hasConfiguredAgents ? enabledBotIds.has(bot.id) : true}
                  disabled={!canConfigure || !expanded}
                />
                <span className="truncate">{bot.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block rounded-lg border border-harlo-line bg-white p-4 text-sm font-semibold text-harlo-ink shadow-sm">
            <span>Success message</span>
            <textarea
              name="successMessage"
              defaultValue={firstAction?.successMessage ?? getDefaultSuccessMessage(provider.key)}
              disabled={!canConfigure || !expanded}
              maxLength={300}
              className="mt-3 min-h-28 w-full resize-none rounded-lg border-0 bg-transparent p-0 text-sm font-medium leading-6 text-harlo-ink outline-none placeholder:text-harlo-muted disabled:text-harlo-muted"
            />
          </label>
          <label className="block rounded-lg border border-harlo-line bg-white p-4 text-sm font-semibold text-harlo-ink shadow-sm">
            <span>Fallback message</span>
            <textarea
              name="fallbackMessage"
              defaultValue={firstAction?.fallbackMessage ?? "I could not complete that automatically, but I can collect your details for the team."}
              disabled={!canConfigure || !expanded}
              maxLength={300}
              className="mt-3 min-h-28 w-full resize-none rounded-lg border-0 bg-transparent p-0 text-sm font-medium leading-6 text-harlo-ink outline-none placeholder:text-harlo-muted disabled:text-harlo-muted"
            />
          </label>
        </div>

        {provider.key === "slack" ? (
          <label className="block text-sm font-semibold text-harlo-ink">
            <span className="flex items-center gap-2">
              Slack channel ID
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">Required</span>
              <InfoTooltip text="Invite the Slack app to this channel before testing. In Slack, type /invite @Harlo in the channel." />
            </span>
            <input
              name="slackChannelId"
              defaultValue={slackChannelId ?? ""}
              disabled={!canConfigure || !expanded}
              placeholder="C0123456789"
              aria-invalid={slackMissingChannel}
              required
              className={`mt-2 h-11 w-full rounded-lg border px-3 text-sm font-medium text-harlo-ink outline-none transition focus:ring-2 disabled:bg-slate-50 disabled:text-harlo-muted ${
                slackMissingChannel
                  ? "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-100"
                  : "border-harlo-line focus:border-harlo-teal focus:ring-harlo-teal/20"
              }`}
            />
            {slackMissingChannel ? (
              <span className="mt-2 flex items-center gap-2 text-xs font-semibold leading-5 text-rose-700">
                <AlertTriangle size={13} />
                Add a channel ID before saving Slack notifications.
              </span>
            ) : null}
            <span className="mt-2 block text-xs font-medium leading-5 text-harlo-muted">Example: C0123456789 or G0123456789 for a private channel.</span>
          </label>
        ) : null}

        {provider.key === "mailchimp" ? (
          <label className="block text-sm font-semibold text-harlo-ink">
            <span className="flex items-center gap-2">
              Mailchimp audience
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">Required</span>
              <InfoTooltip text="Captured leads with an email address will be added or updated in this audience and tagged as Harlo Lead." />
            </span>
            {audienceState?.loading ? (
              <span className="mt-2 flex h-11 items-center gap-2 rounded-lg border border-harlo-line bg-slate-50 px-3 text-sm font-semibold text-harlo-muted">
                <Loader2 size={16} className="animate-spin" />
                Loading audiences
              </span>
            ) : audienceState?.options.length ? (
              <Select
                name="mailchimpAudienceId"
                defaultValue={mailchimpAudienceId ?? ""}
                disabled={!canConfigure || !expanded}
                required
                invalid={mailchimpMissingAudience}
                placeholder="Select an audience"
                className="mt-2"
                options={audienceState.options.map((audience) => ({
                  value: audience.id,
                  label: audience.name,
                  description: audience.memberCount == null ? null : `${audience.memberCount.toLocaleString()} contacts`
                }))}
              />
            ) : (
              <input
                name="mailchimpAudienceId"
                defaultValue={mailchimpAudienceId ?? ""}
                disabled={!canConfigure || !expanded}
                placeholder="Audience ID"
                required
                aria-invalid={mailchimpMissingAudience}
                className={`mt-2 h-11 w-full rounded-lg border px-3 text-sm font-medium text-harlo-ink outline-none transition focus:ring-2 disabled:bg-slate-50 disabled:text-harlo-muted ${
                  mailchimpMissingAudience
                    ? "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-100"
                    : "border-harlo-line focus:border-harlo-teal focus:ring-harlo-teal/20"
                }`}
              />
            )}
            {mailchimpAudienceName ? <input type="hidden" name="mailchimpAudienceName" value={mailchimpAudienceName} /> : null}
            {audienceState?.error ? (
              <span className="mt-2 flex items-center gap-2 text-xs font-semibold leading-5 text-rose-700">
                <AlertTriangle size={13} />
                {audienceState.error}
              </span>
            ) : mailchimpMissingAudience ? (
              <span className="mt-2 flex items-center gap-2 text-xs font-semibold leading-5 text-rose-700">
                <AlertTriangle size={13} />
                Select the audience where Harlo should add captured leads.
              </span>
            ) : null}
            <span className="mt-2 block text-xs font-medium leading-5 text-harlo-muted">Mailchimp will receive the lead email, first name, last name, Harlo Lead tag, and a note with the captured context.</span>
          </label>
        ) : null}

        {provider.key === "google_sheets" ? (
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.6fr)]">
            <label className="block text-sm font-semibold text-harlo-ink">
              <span className="flex items-center gap-2">
                Spreadsheet ID or URL
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">Required</span>
                <InfoTooltip text="Paste the full Google Sheets URL or just the ID between /d/ and /edit." />
              </span>
              <input
                name="spreadsheetId"
                defaultValue={googleSpreadsheetId ?? ""}
                disabled={!canConfigure || !expanded}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                aria-invalid={googleSheetsMissingTarget}
                required
                className={`mt-2 h-11 w-full rounded-lg border px-3 text-sm font-medium text-harlo-ink outline-none transition focus:ring-2 disabled:bg-slate-50 disabled:text-harlo-muted ${
                  googleSheetsMissingTarget
                    ? "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-100"
                    : "border-harlo-line focus:border-harlo-teal focus:ring-harlo-teal/20"
                }`}
              />
              {googleSheetsMissingTarget ? (
                <span className="mt-2 flex items-center gap-2 text-xs font-semibold leading-5 text-rose-700">
                  <AlertTriangle size={13} />
                  Add a spreadsheet and tab before saving Google Sheets.
                </span>
              ) : null}
              <span className="mt-2 block text-xs font-medium leading-5 text-harlo-muted">Share the sheet with the connected Google account so Harlo can create the tab and append rows.</span>
            </label>

            <label className="block text-sm font-semibold text-harlo-ink">
              Sheet tab name
              <input
                name="sheetName"
                defaultValue={googleSheetName ?? "Leads"}
                disabled={!canConfigure || !expanded}
                placeholder="Leads"
                required
                className="mt-2 h-11 w-full rounded-lg border border-harlo-line px-3 text-sm font-medium text-harlo-ink outline-none transition focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/20 disabled:bg-slate-50 disabled:text-harlo-muted"
              />
              <span className="mt-2 block text-xs font-medium leading-5 text-harlo-muted">Harlo creates this tab if needed and adds columns for each selected agent's lead capture fields.</span>
            </label>
          </div>
        ) : null}

        {shouldShowEventTypes ? (
          <fieldset className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <legend className="text-sm font-semibold text-harlo-ink">Meeting types</legend>
                <p className="mt-1 text-sm leading-6 text-harlo-muted">
                  Selected meetings appear as booking choices in the widget. Visitors choose the one that matches what they need.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-harlo-teal/15 bg-harlo-mist px-3 py-1 text-xs font-bold text-harlo-teal">
                <CalendarDays size={13} />
                {selectedEventCount} selected
              </span>
            </div>
            <div className="rounded-xl border border-harlo-line bg-white p-3 shadow-sm">
              {eventTypeState?.loading ? (
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-6 text-sm font-semibold text-harlo-muted">
                  <Loader2 size={16} className="animate-spin" />
                  Loading event types
                </div>
              ) : eventTypeState?.error ? (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-semibold leading-5 text-rose-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>{eventTypeState.error}</span>
                </div>
              ) : eventTypeOptions.length > 0 ? (
                <div className="space-y-3">
                  {eventTypeOptions.map((eventType) => {
                    const checked = selectedEventIds.has(eventType.id);

                    return (
                    <label
                      key={eventType.id}
                      className={`group relative flex min-w-0 cursor-pointer items-center gap-4 overflow-hidden rounded-xl border px-4 py-4 text-sm font-medium shadow-sm transition ${
                        checked
                          ? "border-harlo-teal/35 bg-harlo-mist/55 ring-2 ring-harlo-teal/10"
                          : "border-harlo-line bg-white hover:border-harlo-teal/50 hover:bg-slate-50"
                      }`}
                    >
                      {checked ? <span className="absolute inset-y-0 left-0 w-1 bg-harlo-teal" /> : null}
                      <Checkbox
                        name="eventTypeIds"
                        value={eventType.id}
                        checked={checked}
                        onChange={(event) => toggleEventType(eventType.id, event.currentTarget.checked)}
                        disabled={!canConfigure || !expanded}
                      />
                      <span className="grid h-14 w-14 shrink-0 place-items-center self-stretch">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logoUrls[provider.key]}
                          alt=""
                          className="h-9 w-9 object-contain"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-harlo-ink">{eventType.name}</span>
                        <span className="mt-1 flex min-w-0 items-center gap-2 text-xs font-semibold text-harlo-muted">
                          <span className="min-w-0 truncate">{eventType.url}</span>
                          <ExternalLink size={13} className="shrink-0" />
                        </span>
                      </span>
                      {eventType.durationLabel ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-harlo-muted ring-1 ring-harlo-line">
                          <Clock3 size={12} />
                          {eventType.durationLabel}
                        </span>
                      ) : null}
                    </label>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 px-3 py-4 text-sm font-semibold text-harlo-muted">
                  No active event types were found in {provider.name}.
                </div>
              )}
            </div>
          </fieldset>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-harlo-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          {canConfigure ? (
            <span aria-hidden="true" />
          ) : (
            <p className="text-sm text-harlo-muted">Connect this integration before configuring widget actions.</p>
          )}
          <button type="submit" disabled={!canConfigure || !expanded || loadingSave} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-harlo-teal px-4 text-sm font-semibold text-white transition hover:bg-harlo-navy disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
            {loadingSave ? <Loader2 size={16} className="animate-spin" /> : null}
            {loadingSave ? "Saving" : "Save configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfigMetaItem({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "success";
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-harlo-muted">{label}</p>
      <p className={`mt-1 flex min-w-0 items-center gap-2 truncate text-sm font-semibold ${tone === "success" ? "text-emerald-700" : "text-harlo-ink"}`}>
        {tone === "success" ? <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" /> : null}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-grid h-5 w-5 place-items-center">
      <Info size={14} className="text-harlo-muted" aria-hidden="true" />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-64 -translate-x-1/2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold leading-5 text-white shadow-lg group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  );
}

function getStatusMessage(status: string, providerName: string) {
  const messages: Record<string, { tone: "success" | "warning"; title: string; body: string }> = {
    connected: {
      tone: "success",
      title: `${providerName} connected.`,
      body: "You can configure widget actions for this provider now."
    },
    configured: {
      tone: "success",
      title: `${providerName} configuration saved.`,
      body: "The selected widget agents can use this integration."
    },
    disconnected: {
      tone: "success",
      title: `${providerName} disconnected.`,
      body: "Credentials were removed from Harlo."
    },
    oauth_denied: {
      tone: "warning",
      title: "Connection canceled.",
      body: `${providerName} did not authorize the connection.`
    },
    invalid_state: {
      tone: "warning",
      title: "OAuth session expired.",
      body: "Start the connection again from this page."
    },
    workspace_mismatch: {
      tone: "warning",
      title: "Workspace mismatch.",
      body: "The OAuth callback did not match the workspace that started it."
    },
    connect_failed: {
      tone: "warning",
      title: `${providerName} could not connect.`,
      body: "Check the OAuth app settings and try again."
    },
    disconnect_failed: {
      tone: "warning",
      title: `${providerName} could not disconnect.`,
      body: "Refresh and try again."
    },
    configure_failed: {
      tone: "warning",
      title: "Configuration was not saved.",
      body: "Refresh and try again."
    },
    not_connected: {
      tone: "warning",
      title: `${providerName} is not connected.`,
      body: "Connect it before configuring actions."
    },
    plan_locked: {
      tone: "warning",
      title: `${providerName} is not included in this plan.`,
      body: "Upgrade the workspace plan to connect it."
    },
    setup_pending: {
      tone: "warning",
      title: `${providerName} needs setup.`,
      body: "Add the OAuth client credentials before connecting."
    },
    unsupported: {
      tone: "warning",
      title: "Unsupported integration.",
      body: "This provider is not available yet."
    }
  };

  return messages[status] ?? {
    tone: "warning",
    title: "Integration needs attention.",
    body: "Refresh and try again."
  };
}

function getConfiguredActionsFromForm(provider: DisplayProvider, formData: FormData): IntegrationConfiguredAction[] {
  const actionType = formData.get("actionType");
  const normalizedActionType = typeof actionType === "string" && isIntegrationActionType(actionType)
    ? actionType
    : provider.actionTypes[0];

  if (!normalizedActionType) {
    return [];
  }

  const successMessage = normalizeFormMessage(formData.get("successMessage"));
  const fallbackMessage = normalizeFormMessage(formData.get("fallbackMessage"));

  return formData
    .getAll("botIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((botId) => ({
      id: `${provider.key}-${botId}-${normalizedActionType}`,
      botId,
      actionType: normalizedActionType,
      triggerType: getClientDefaultTriggerType(provider.key, normalizedActionType),
      enabled: true,
      successMessage,
      fallbackMessage,
      config: getClientActionConfig(provider, formData)
    }));
}

function normalizeFormMessage(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function validateIntegrationConfiguration(provider: DisplayProvider, formData: FormData) {
  if (provider.key === "slack" && !normalizeFormMessage(formData.get("slackChannelId"))) {
    return "Slack channel ID is required before saving Slack notifications.";
  }

  if (provider.key === "mailchimp" && !normalizeFormMessage(formData.get("mailchimpAudienceId"))) {
    return "Select a Mailchimp audience before saving this integration.";
  }

  if (provider.key === "google_sheets") {
    if (!normalizeFormMessage(formData.get("spreadsheetId"))) {
      return "Add a Google Sheets spreadsheet ID before saving.";
    }

    if (!normalizeFormMessage(formData.get("sheetName"))) {
      return "Add a Google Sheets tab name before saving.";
    }
  }

  if (isBookingProvider(provider.key) && getSelectedEventTypesFromForm(formData).length === 0) {
    return `Select at least one ${provider.name} event type.`;
  }

  return null;
}

function getClientActionConfig(provider: DisplayProvider, formData?: FormData) {
  if (isBookingProvider(provider.key)) {
    return {
      provider: provider.key,
      schedulingMode: "popup",
      selectedEventTypes: formData ? getSelectedEventTypesFromForm(formData) : []
    };
  }

  if (provider.key === "slack") {
    return {
      provider: provider.key,
      slackChannelId: normalizeFormMessage(formData?.get("slackChannelId") ?? null)
    };
  }

  if (provider.key === "mailchimp") {
    return {
      provider: provider.key,
      mailchimpAudienceId: normalizeFormMessage(formData?.get("mailchimpAudienceId") ?? null),
      mailchimpAudienceName: normalizeFormMessage(formData?.get("mailchimpAudienceName") ?? null)
    };
  }

  if (provider.key === "google_sheets") {
    return {
      provider: provider.key,
      spreadsheetId: normalizeSpreadsheetId(formData?.get("spreadsheetId") ?? null),
      sheetName: normalizeFormMessage(formData?.get("sheetName") ?? null) ?? "Leads"
    };
  }

  return {
    provider: provider.key
  };
}

function normalizeSpreadsheetId(value: FormDataEntryValue | null) {
  const text = normalizeFormMessage(value);

  if (!text) {
    return null;
  }

  const match = text.match(/\/spreadsheets\/d\/([^/?#]+)/);

  return match?.[1] ?? text;
}

function getStringConfig(config: Record<string, unknown> | undefined, key: string) {
  const value = config?.[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getSelectedEventTypesFromForm(formData: FormData) {
  const selectedIds = new Set(
    formData
      .getAll("eventTypeIds")
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  );
  const rawSnapshot = formData.get("eventTypesSnapshot");
  const snapshot = typeof rawSnapshot === "string" ? parseJsonArray(rawSnapshot) : [];

  return normalizeEventTypeOptions(snapshot).filter((eventType) => selectedIds.has(eventType.id));
}

function parseJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeEventTypeOptions(value: unknown): BookingEventTypeOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = getCleanString(record.id);
      const name = getCleanString(record.name);
      const url = getCleanString(record.url);
      const durationLabel = getCleanString(record.durationLabel);

      return id && name && url ? { id, name, url, durationLabel } : null;
    })
    .filter((item): item is BookingEventTypeOption => Boolean(item));
}

function normalizeAudienceOptions(value: unknown): MailchimpAudienceOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = getCleanString(record.id);
      const name = getCleanString(record.name);
      const memberCount = typeof record.memberCount === "number" ? record.memberCount : null;

      return id && name ? { id, name, memberCount } : null;
    })
    .filter((item): item is MailchimpAudienceOption => Boolean(item));
}

function getCleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isBookingProvider(provider: IntegrationProviderKey) {
  return provider === "calendly" || provider === "calcom";
}

function isIntegrationActionType(value: string): value is IntegrationActionType {
  return value === "show_booking_link" ||
    value === "submit_service_request" ||
    value === "send_webhook" ||
    value === "send_notification" ||
    value === "create_crm_contact";
}

function getClientDefaultTriggerType(
  provider: IntegrationProviderKey,
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

function getDefaultSuccessMessage(provider: IntegrationProviderKey) {
  if (provider === "calendly") {
    return "Here is a booking link so you can choose a time that works.";
  }

  if (provider === "calcom") {
    return "Here is a scheduler so you can choose a time that works.";
  }

  if (provider === "slack") {
    return "I sent this to the team so they can follow up.";
  }

  if (provider === "mailchimp") {
    return "I added your details so the team can follow up.";
  }

  if (provider === "google_sheets") {
    return "I saved your details so the team can follow up.";
  }

  if (provider === "hubspot") {
    return "I saved your details so the team can follow up with context.";
  }

  if (provider === "jobber") {
    return "I sent this request to the team so they can follow up.";
  }

  return "I sent this to the connected workflow.";
}

function Logo({ provider }: { provider: DisplayProvider }) {
  const locked = provider.locked;

  return (
    <span className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg ${locked ? "bg-slate-100" : "bg-white"}`}>
      {locked ? (
        <Lock size={21} className="text-slate-400" />
      ) : (
        <span
          className="block h-11 w-11 rounded-lg bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${logoUrls[provider.key]})` }}
          aria-label={`${provider.name} logo`}
          role="img"
        />
      )}
    </span>
  );
}

function StatusPill({ provider }: { provider: DisplayProvider }) {
  if (provider.locked) {
    return (
      <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
        Locked
      </span>
    );
  }

  if (provider.status === "connected") {
    return (
      <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        Connected
      </span>
    );
  }

  return (
    <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
      Disconnected
    </span>
  );
}

function InfoCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-md bg-slate-50/70 px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-2 min-w-0">{children}</div>
    </div>
  );
}

function IconButton({
  label,
  children,
  disabled,
  loading,
  onClick,
  type = "button",
  tone = "default"
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  tone?: "default" | "danger";
}) {
  const className = tone === "danger"
    ? "border-rose-200 bg-rose-50/40 text-rose-500 hover:bg-rose-50"
    : "border-harlo-line bg-white text-harlo-ink hover:border-harlo-teal hover:text-harlo-teal";

  return (
    <span className="group relative inline-grid h-10 w-10 shrink-0 place-items-center">
      <button
        type={type}
        onClick={onClick}
        className={`grid h-10 w-10 place-items-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
        aria-label={label}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
      >
        {loading ? <Loader2 size={17} className="animate-spin" /> : children}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white shadow-lg group-hover:block group-focus-within:block"
      >
        {label}
      </span>
    </span>
  );
}

function IconLink({
  href,
  label,
  children,
  loading,
  onClick
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
}) {
  return (
    <span className="group relative inline-grid h-10 w-10 shrink-0 place-items-center">
      <a
        href={href}
        onClick={onClick}
        className="grid h-10 w-10 place-items-center rounded-lg border border-harlo-line bg-white text-harlo-ink transition hover:border-harlo-teal hover:text-harlo-teal focus:outline-none focus:ring-2 focus:ring-harlo-teal focus:ring-offset-2"
        aria-label={label}
        aria-busy={loading || undefined}
      >
        {loading ? <Loader2 size={17} className="animate-spin" /> : children}
      </a>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white shadow-lg group-hover:block group-focus-within:block"
      >
        {label}
      </span>
    </span>
  );
}

function toDisplayProvider(provider: IntegrationProviderOverview): DisplayProvider {
  const locked = !provider.planAllowed;

  return {
    ...provider,
    visiblePlan: provider.requiredPlan,
    locked
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
