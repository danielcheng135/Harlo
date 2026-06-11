export type BillingPlanKey = "starter" | "growth" | "pro";
export type BillingInterval = "monthly" | "annual";
export type BillingStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";
export type AddOnKey = "auto_recharge_credits" | "extra_agent" | "extra_seat" | "remove_branding";
export type IntegrationCatalogKey =
  | "calendly"
  | "calcom"
  | "jobber"
  | "slack"
  | "hubspot"
  | "mailchimp"
  | "google_sheets";

export type BillingPlan = {
  key: BillingPlanKey;
  name: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  monthlyCredits: number;
  includedAgents: number;
  seats: number;
  description: string;
  features: string[];
};

export type BillingAddOn = {
  key: AddOnKey;
  name: string;
  price: number;
  unit: string;
  description: string;
};

export type IntegrationEntitlements = {
  enabled: boolean;
  providers: IntegrationCatalogKey[];
  connectedAccountsPerProvider: number;
  actionsPerVisitorFlow: number;
  advancedFieldMapping: boolean;
  conditionalRouting: boolean;
  retryControls: boolean;
  logLevel: "none" | "basic" | "advanced";
};

export type BillingPlanComparisonRow = {
  label: string;
  detail: string;
  values: Record<BillingPlanKey, string>;
};

export const TRIAL_CONFIG = {
  days: 14,
  credits: 50,
  convertsToPlan: "starter" satisfies BillingPlanKey
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    key: "starter",
    name: "Starter",
    monthlyPrice: 39,
    annualMonthlyPrice: 31,
    monthlyCredits: 500,
    includedAgents: 1,
    seats: 1,
    description: "For small businesses adding one chatbot to their website.",
    features: ["500 message credits/month", "1 agent", "1 seat", "Lead capture", "Basic analytics", "Website widget and inbox"]
  },
  {
    key: "growth",
    name: "Growth",
    monthlyPrice: 149,
    annualMonthlyPrice: 119,
    monthlyCredits: 4000,
    includedAgents: 1,
    seats: 3,
    description: "For businesses getting steady website traffic and connecting follow-up actions.",
    features: ["4,000 message credits/month", "1 agent", "3 seats", "Auto-retrain knowledge", "Advanced analytics", "1 connected action per conversation", "All 7 integration providers"]
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: 499,
    annualMonthlyPrice: 399,
    monthlyCredits: 15000,
    includedAgents: 1,
    seats: 5,
    description: "For high-traffic businesses with heavier support, lead capture, and integration needs.",
    features: ["15,000 message credits/month", "1 agent", "5 seats", "Priority support", "Up to 3 connected actions per conversation", "All 7 integration providers"]
  }
];

export const BILLING_ADD_ONS: BillingAddOn[] = [
  {
    key: "auto_recharge_credits",
    name: "Auto-recharge 1,000 credits",
    price: 29,
    unit: "per recharge",
    description: "Automatically add 1,000 credits when the account runs low."
  },
  {
    key: "extra_agent",
    name: "Extra agent",
    price: 19,
    unit: "per month",
    description: "Add another chatbot with its own setup, knowledge, and widget."
  },
  {
    key: "extra_seat",
    name: "Extra seat",
    price: 10,
    unit: "per user/month",
    description: "Add another dashboard user to help manage Harlo."
  },
  {
    key: "remove_branding",
    name: "Remove Harlo branding",
    price: 49,
    unit: "per month",
    description: "Hide Harlo attribution from the customer-facing widget."
  }
];

export const INTEGRATION_ENTITLEMENTS: Record<BillingPlanKey, IntegrationEntitlements> = {
  starter: {
    enabled: false,
    providers: [],
    connectedAccountsPerProvider: 0,
    actionsPerVisitorFlow: 0,
    advancedFieldMapping: false,
    conditionalRouting: false,
    retryControls: false,
    logLevel: "none"
  },
  growth: {
    enabled: true,
    providers: ["calendly", "calcom", "jobber", "slack", "hubspot", "mailchimp", "google_sheets"],
    connectedAccountsPerProvider: 1,
    actionsPerVisitorFlow: 1,
    advancedFieldMapping: false,
    conditionalRouting: false,
    retryControls: false,
    logLevel: "basic"
  },
  pro: {
    enabled: true,
    providers: ["calendly", "calcom", "jobber", "slack", "hubspot", "mailchimp", "google_sheets"],
    connectedAccountsPerProvider: 3,
    actionsPerVisitorFlow: 3,
    advancedFieldMapping: true,
    conditionalRouting: true,
    retryControls: true,
    logLevel: "advanced"
  }
};

export const BILLING_PLAN_COMPARISON_ROWS: BillingPlanComparisonRow[] = [
  {
    label: "Message credits",
    detail: "Included assistant replies each billing period.",
    values: { starter: "500", growth: "4,000", pro: "15,000" }
  },
  {
    label: "Included agents",
    detail: "Separate assistants for sites, brands, or workflows.",
    values: { starter: "1", growth: "1", pro: "1" }
  },
  {
    label: "Included seats",
    detail: "Team members who can manage Harlo.",
    values: { starter: "1", growth: "3", pro: "5" }
  },
  {
    label: "Knowledge updates",
    detail: "How Harlo keeps approved answers current.",
    values: { starter: "Manual", growth: "Auto-retrain", pro: "Auto-retrain" }
  },
  {
    label: "Support",
    detail: "Help level included with the workspace.",
    values: { starter: "Standard", growth: "Standard", pro: "Priority" }
  },
  {
    label: "Lead capture",
    detail: "Capture intent, contact details, and conversation context.",
    values: { starter: "Included", growth: "Included", pro: "Included" }
  },
  {
    label: "Analytics",
    detail: "Conversation trends, top intents, and knowledge gaps.",
    values: { starter: "Basic", growth: "Advanced", pro: "Advanced" }
  },
  {
    label: "Integration providers",
    detail: "Calendly, Cal.com, Jobber, Slack, HubSpot, Mailchimp, and Google Sheets.",
    values: { starter: "Not included", growth: "All 7", pro: "All 7" }
  },
  {
    label: "Connected actions",
    detail: "Maximum provider actions Harlo can run during one visitor conversation.",
    values: { starter: "Not included", growth: "1 per conversation", pro: "Up to 3 per conversation" }
  }
];

export function getBillingPlan(planKey: string | null | undefined) {
  return BILLING_PLANS.find((plan) => plan.key === planKey) ?? BILLING_PLANS[0];
}

export function getIntegrationEntitlements(planKey: BillingPlanKey) {
  return INTEGRATION_ENTITLEMENTS[planKey];
}

export function canUseIntegrationProvider(planKey: BillingPlanKey, provider: IntegrationCatalogKey) {
  return getIntegrationEntitlements(planKey).providers.includes(provider);
}

export function hasHigherTier(planKey: BillingPlanKey) {
  return BILLING_PLANS.findIndex((plan) => plan.key === planKey) < BILLING_PLANS.length - 1;
}

export function getPlanCreditLimit(planKey: BillingPlanKey, status: BillingStatus) {
  if (status === "trialing") {
    return TRIAL_CONFIG.credits;
  }

  return getBillingPlan(planKey).monthlyCredits;
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function getNextPlan(planKey: BillingPlanKey) {
  const index = BILLING_PLANS.findIndex((plan) => plan.key === planKey);
  return index >= 0 ? BILLING_PLANS[index + 1] ?? null : null;
}
