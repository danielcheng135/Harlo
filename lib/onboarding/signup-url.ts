import type { Route } from "next";
import type { BillingInterval, BillingPlanKey } from "@/lib/billing/plans";

export function getSignupHref(planKey: BillingPlanKey = "starter", interval: BillingInterval = "monthly"): Route {
  const next = `/onboarding?plan=${planKey}&interval=${interval}`;
  return `/auth/sign-up?next=${encodeURIComponent(next)}` as Route;
}

export function getOnboardingPath(planKey: BillingPlanKey = "starter", interval: BillingInterval = "monthly"): Route {
  return `/onboarding?plan=${planKey}&interval=${interval}` as Route;
}
