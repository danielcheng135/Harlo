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
    key: "calcom",
    name: "Cal.com",
    description: "Show Cal.com scheduling actions from the widget when visitors ask to book.",
    actionTypes: ["show_booking_link"],
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
    key: "slack",
    name: "Slack",
    description: "Notify teams when a lead, booking request, or integration failure needs attention.",
    actionTypes: ["send_notification"],
    growthEnabled: true,
    proEnabled: true
  },
  {
    key: "mailchimp",
    name: "Mailchimp",
    description: "Add captured leads to audiences, tags, and marketing follow-up lists.",
    actionTypes: ["create_crm_contact"],
    growthEnabled: true,
    proEnabled: true
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    description: "Route lead follow-up and handoff messages through WhatsApp Business.",
    actionTypes: ["send_notification"],
    growthEnabled: false,
    proEnabled: true
  },
  {
    key: "instagram",
    name: "Instagram",
    description: "Connect Instagram DM handoffs for businesses that manage leads in social inboxes.",
    actionTypes: ["send_notification"],
    growthEnabled: false,
    proEnabled: true
  },
  {
    key: "messenger",
    name: "Messenger",
    description: "Connect Facebook Messenger handoffs for Page-based customer conversations.",
    actionTypes: ["send_notification"],
    growthEnabled: false,
    proEnabled: true
  },
  {
    key: "hubspot",
    name: "HubSpot",
    description: "Create or update CRM contacts, deals, and transcript notes.",
    actionTypes: ["create_crm_contact"],
    growthEnabled: true,
    proEnabled: true
  }
];

export function getIntegrationProvider(providerKey: string | null | undefined) {
  return INTEGRATION_PROVIDERS.find((provider) => provider.key === providerKey);
}

export function isIntegrationProviderKey(value: string | null | undefined): value is IntegrationProviderKey {
  return INTEGRATION_PROVIDERS.some((provider) => provider.key === value);
}
