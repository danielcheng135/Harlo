import type { IntegrationProvider, IntegrationProviderKey } from "@/lib/integrations/types";

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  {
    key: "calendly",
    name: "Calendly",
    description: "Show booking actions from the widget when visitors ask to schedule.",
    actionTypes: ["show_booking_link"],
    growthEnabled: true,
    proEnabled: true
  },
  {
    key: "housecallpro",
    name: "Housecall Pro",
    description: "Send qualified service requests into Housecall Pro after Harlo captures the lead.",
    actionTypes: ["submit_service_request"],
    growthEnabled: true,
    proEnabled: true
  },
  {
    key: "jobber",
    name: "Jobber",
    description: "Create client or service request handoffs for quote and job workflows.",
    actionTypes: ["submit_service_request"],
    growthEnabled: true,
    proEnabled: true
  },
  {
    key: "zapier",
    name: "Zapier",
    description: "Send webhook events to the long tail of tools before native integrations exist.",
    actionTypes: ["send_webhook"],
    growthEnabled: true,
    proEnabled: true
  },
  {
    key: "slack",
    name: "Slack",
    description: "Notify teams when a lead, booking request, or integration failure needs attention.",
    actionTypes: ["send_notification"],
    growthEnabled: true,
    proEnabled: true
  },
  {
    key: "hubspot",
    name: "HubSpot",
    description: "Create or update CRM contacts, deals, and transcript notes.",
    actionTypes: ["create_crm_contact"],
    growthEnabled: false,
    proEnabled: true
  }
];

export function getIntegrationProvider(providerKey: string | null | undefined) {
  return INTEGRATION_PROVIDERS.find((provider) => provider.key === providerKey);
}

export function isIntegrationProviderKey(value: string | null | undefined): value is IntegrationProviderKey {
  return INTEGRATION_PROVIDERS.some((provider) => provider.key === value);
}
