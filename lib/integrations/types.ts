export type IntegrationProviderKey =
  | "calendly"
  | "calcom"
  | "jobber"
  | "slack"
  | "hubspot"
  | "mailchimp"
  | "whatsapp"
  | "instagram"
  | "messenger";

export type IntegrationStatus = "connected" | "disconnected" | "error";

export type IntegrationActionType =
  | "show_booking_link"
  | "submit_service_request"
  | "send_webhook"
  | "send_notification"
  | "create_crm_contact";

export type IntegrationTriggerType =
  | "booking_requested"
  | "service_request_completed"
  | "lead_captured"
  | "human_follow_up_requested"
  | "integration_failed";

export type IntegrationRunStatus = "pending" | "success" | "failed" | "skipped";

export type IntegrationActionPayload = {
  organizationId: string;
  botId: string;
  conversationId?: string | null;
  leadId?: string | null;
  visitorMessage: string;
  lead: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    question?: string | null;
    metadata?: Record<string, unknown>;
  };
  conversationSummary?: string | null;
  sourcePageUrl?: string | null;
};

export type IntegrationActionResult = {
  ok: boolean;
  status: IntegrationRunStatus;
  externalRecordId?: string | null;
  externalUrl?: string | null;
  message?: string | null;
  error?: string | null;
  metadata?: Record<string, unknown>;
};

export type IntegrationProvider = {
  key: IntegrationProviderKey;
  name: string;
  description: string;
  actionTypes: IntegrationActionType[];
  growthEnabled: boolean;
  proEnabled: boolean;
};
