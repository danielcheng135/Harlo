export type BillingPlanKey = "starter" | "growth" | "pro";
export type BillingInterval = "monthly" | "annual";
export type BillingStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";
export type AddOnKey = "auto_recharge_credits" | "extra_agent" | "extra_seat" | "remove_branding";

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
    features: ["500 message credits/month", "1 agent", "1 seat", "Lead capture", "Basic analytics"]
  },
  {
    key: "growth",
    name: "Growth",
    monthlyPrice: 129,
    annualMonthlyPrice: 103,
    monthlyCredits: 4000,
    includedAgents: 1,
    seats: 3,
    description: "For businesses getting steady website traffic and wanting more automation.",
    features: ["4,000 message credits/month", "1 agent", "3 seats", "Auto-retrain knowledge", "Advanced analytics"]
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: 399,
    annualMonthlyPrice: 319,
    monthlyCredits: 15000,
    includedAgents: 1,
    seats: 5,
    description: "For high-traffic businesses with heavier support and lead capture needs.",
    features: ["15,000 message credits/month", "1 agent", "5 seats", "Priority support", "More actions per agent"]
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

export function getBillingPlan(planKey: string | null | undefined) {
  return BILLING_PLANS.find((plan) => plan.key === planKey) ?? BILLING_PLANS[0];
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
