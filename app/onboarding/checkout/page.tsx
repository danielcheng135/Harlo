import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
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
  const [{ data: organization }, { data: bot }, { data: billing }] = await Promise.all([
    service
      .from("organizations")
      .select("name")
      .eq("id", membership.organization_id)
      .maybeSingle(),
    service
      .from("bots")
      .select("id")
      .eq("organization_id", membership.organization_id)
      .eq("status", "active")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    service
      .from("organization_billing")
      .select("plan_key, billing_interval, status")
      .eq("organization_id", membership.organization_id)
      .maybeSingle()
  ]);

  if (!organization || !bot) {
    redirect("/onboarding");
  }

  if (billing?.status === "active" || billing?.status === "trialing") {
    redirect("/dashboard?welcome=1");
  }

  const planKey = isBillingPlanKey(billing?.plan_key) ? billing.plan_key : "starter";
  const interval = isBillingInterval(billing?.billing_interval) ? billing.billing_interval : "monthly";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(8,127,149,0.36),transparent_32%),linear-gradient(135deg,#07111a_0%,#08131d_54%,#063f4c_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px] opacity-25" />
      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 sm:py-7">
        <Link href="/" aria-label="Return to Harlo home">
          <BrandLogo tone="light" />
        </Link>
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 sm:text-sm">
          <LockKeyhole size={14} className="text-harlo-blue" />
          Secure checkout
        </span>
      </header>
      <CheckoutRecovery
        organizationName={organization?.name ?? "your workspace"}
        initialPlanKey={planKey as BillingPlanKey}
        initialInterval={interval as BillingInterval}
        checkoutState={params?.checkout}
      />
      <p className="relative pb-6 text-center text-xs leading-5 text-white/45">
        Payments are securely processed by Stripe.{" "}
        <Link href="/terms" className="text-white/70 underline underline-offset-4 hover:text-white">Terms</Link>
        {" "}and{" "}
        <Link href="/privacy" className="text-white/70 underline underline-offset-4 hover:text-white">Privacy Policy</Link>.
      </p>
    </main>
  );
}
