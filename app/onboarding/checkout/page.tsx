import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { CheckoutRecovery } from "@/components/onboarding/checkout-recovery";
import { getEffectiveBillingStatus, type BillingInterval, type BillingPlanKey, type BillingStatus } from "@/lib/billing/plans";
import { isBillingInterval, isBillingPlanKey } from "@/lib/billing/stripe";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

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
      .select("plan_key, billing_interval, status, trial_end, stripe_subscription_id")
      .eq("organization_id", membership.organization_id)
      .maybeSingle()
  ]);

  if (!organization || !bot) {
    redirect("/onboarding");
  }

  const effectiveBillingStatus = getEffectiveBillingStatus({
    status: normalizeBillingStatus(billing?.status),
    trialEnd: typeof billing?.trial_end === "string" ? billing.trial_end : null,
    stripeSubscriptionId: typeof billing?.stripe_subscription_id === "string" ? billing.stripe_subscription_id : null
  });

  if (effectiveBillingStatus === "active" || effectiveBillingStatus === "trialing") {
    redirect("/dashboard?welcome=1&setup_intro=1");
  }

  const planKey = isBillingPlanKey(billing?.plan_key) ? billing.plan_key : "starter";
  const interval = isBillingInterval(billing?.billing_interval) ? billing.billing_interval : "monthly";

  return (
    <main className="min-h-screen bg-white text-[#222222]">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-5 py-5 sm:px-8 sm:py-6 lg:px-10">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] bg-harlo-blue px-5 py-5 text-white sm:rounded-[24px] sm:px-8 sm:py-6 lg:px-10 xl:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_33%,rgba(255,255,255,0.14),transparent_23%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_36%)]" />
          <header className="relative z-10 flex items-center justify-between gap-3">
            <Link href="/" aria-label="Return to Harlo home" className="rounded-lg px-1 py-1 transition hover:bg-white/10">
              <BrandLogo tone="light" />
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-harlo-blue shadow-sm sm:text-[13px]">
              <LockKeyhole size={14} className="text-harlo-blue" />
              Secure setup
            </span>
          </header>
          <div className="relative z-10 flex flex-1 items-center py-8 lg:py-10">
            <CheckoutRecovery
              organizationName={organization?.name ?? "your workspace"}
              initialPlanKey={planKey as BillingPlanKey}
              initialInterval={interval as BillingInterval}
              checkoutState={params?.checkout}
            />
          </div>
        </div>
        <p className="pt-2 text-center text-xs font-medium leading-5 text-slate-500">
          Payments are securely processed by Stripe.{" "}
          <Link href="/terms" className="font-bold text-harlo-blue underline underline-offset-4 hover:text-harlo-teal">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="font-bold text-harlo-blue underline underline-offset-4 hover:text-harlo-teal">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}

function normalizeBillingStatus(value: unknown): BillingStatus {
  return value === "trialing" || value === "active" || value === "past_due" || value === "canceled" || value === "incomplete"
    ? value
    : "incomplete";
}
