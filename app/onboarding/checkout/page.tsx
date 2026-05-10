import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { CheckoutRecovery } from "@/components/onboarding/checkout-recovery";
import { isBillingInterval, isBillingPlanKey } from "@/lib/billing/stripe";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import type { BillingInterval, BillingPlanKey } from "@/lib/billing/plans";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

type CheckoutPageProps = {
  searchParams?: Promise<{
    checkout?: string;
  }>;
};

export default async function OnboardingCheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent("/onboarding/checkout")}`);
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const service = createSupabaseServiceClient();
  const [{ data: organization }, { data: billing }] = await Promise.all([
    service
      .from("organizations")
      .select("name")
      .eq("id", membership.organization_id)
      .single(),
    service
      .from("organization_billing")
      .select("plan_key, billing_interval, status")
      .eq("organization_id", membership.organization_id)
      .maybeSingle()
  ]);

  if (billing?.status === "active" || billing?.status === "trialing") {
    redirect("/dashboard?welcome=1");
  }

  const planKey = isBillingPlanKey(billing?.plan_key) ? billing.plan_key : "starter";
  const interval = isBillingInterval(billing?.billing_interval) ? billing.billing_interval : "monthly";

  return (
    <main className="min-h-screen bg-harlo-canvas text-harlo-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <BrandLogo />
      </header>
      <CheckoutRecovery
        organizationName={organization?.name ?? "your workspace"}
        initialPlanKey={planKey as BillingPlanKey}
        initialInterval={interval as BillingInterval}
        checkoutState={params?.checkout}
      />
    </main>
  );
}
