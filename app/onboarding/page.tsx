import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getEffectiveBillingStatus, type BillingStatus } from "@/lib/billing/plans";
import { isInternalAdminEmail, isInternalWorkspaceMetadata, withInternalWorkspaceMetadata } from "@/lib/internal-admin";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  let initialBusinessName = getBusinessName(user?.user_metadata);
  let initialWebsiteUrl = "";
  let initialAssistantName = "";

  if (user) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membership) {
      const service = createSupabaseServiceClient();
      const [{ data: organization }, { data: bot }, { data: billing }] = await Promise.all([
        service
          .from("organizations")
          .select("name, website_url, metadata")
          .eq("id", membership.organization_id)
          .maybeSingle(),
        service
          .from("bots")
          .select("name")
          .eq("organization_id", membership.organization_id)
          .eq("status", "active")
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        service
          .from("organization_billing")
          .select("status, trial_end, stripe_subscription_id")
          .eq("organization_id", membership.organization_id)
          .maybeSingle()
      ]);

      initialBusinessName = organization?.name ?? initialBusinessName;
      initialWebsiteUrl = organization?.website_url ?? "";
      initialAssistantName = bot?.name ?? "";
      const isInternalWorkspace = isInternalAdminEmail(user.email) || isInternalWorkspaceMetadata(organization?.metadata);

      if (organization && isInternalWorkspace && !isInternalWorkspaceMetadata(organization.metadata)) {
        await Promise.all([
          service
            .from("organizations")
            .update({
              metadata: withInternalWorkspaceMetadata(organization.metadata),
              updated_at: new Date().toISOString()
            })
            .eq("id", membership.organization_id),
          service
            .from("organization_billing")
            .upsert({
              organization_id: membership.organization_id,
              plan_key: "pro",
              billing_interval: "monthly",
              status: "active",
              updated_at: new Date().toISOString()
            }, { onConflict: "organization_id" })
        ]);
      }

      const billingStatus = normalizeBillingStatus(billing?.status);
      const effectiveBillingStatus = getEffectiveBillingStatus({
        status: billingStatus,
        trialEnd: typeof billing?.trial_end === "string" ? billing.trial_end : null,
        stripeSubscriptionId: typeof billing?.stripe_subscription_id === "string" ? billing.stripe_subscription_id : null
      });

      if (organization && bot && (isInternalWorkspace || effectiveBillingStatus === "active" || effectiveBillingStatus === "trialing")) {
        redirect("/dashboard?welcome=1&setup_intro=1");
      }

      if (organization && bot) {
        redirect("/onboarding/checkout");
      }
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#222222]">
      <section className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] bg-harlo-blue px-4 py-4 text-white sm:rounded-[24px] sm:px-6 sm:py-5 lg:px-7 lg:py-5 xl:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_33%,rgba(255,255,255,0.14),transparent_23%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_36%)]" />
          <header className="relative z-10 flex items-center justify-between gap-3">
            <Link href="/" aria-label="Return to Harlo home" className="rounded-lg px-1 py-1 transition hover:bg-white/10">
              <BrandLogo tone="light" />
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-harlo-blue shadow-sm sm:text-xs">
              <LockKeyhole size={14} className="text-harlo-blue" />
              Secure setup
            </span>
          </header>

          <div className="relative z-10 grid flex-1 gap-5 py-8 lg:grid-cols-[minmax(260px,0.42fr)_minmax(0,1fr)] lg:items-center lg:py-5 xl:grid-cols-[minmax(320px,0.44fr)_minmax(0,1fr)]">
            <div className="min-w-0 lg:pr-1 xl:pr-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-white/85">
                <Sparkles size={14} className="text-white" />
                Workspace setup
              </span>
              <h1 className="mt-4 max-w-2xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-6xl xl:text-7xl">
                Build your first{" "}
                <span className="inline-block rounded-[13px] bg-white px-[0.12em] pb-[0.04em] text-harlo-blue sm:rounded-[16px]">AI agent.</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm font-semibold leading-6 text-white/86 xl:text-base xl:leading-7">
                Add your business, website, and agent preferences. Harlo starts a no-card trial when setup is complete.
              </p>
              <div className="mt-5 grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-white/78">
                {["Website knowledge added", "Editable later", "No card required"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-white" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <Suspense
              fallback={
                <div className="flex min-h-[520px] items-center justify-center rounded-[18px] border border-white/20 bg-white text-sm font-bold text-harlo-muted shadow-[0_5px_0_rgba(6,99,117,0.55)]">
                  Preparing setup...
                </div>
              }
            >
              <OnboardingForm
                initialAssistantName={initialAssistantName}
                initialBusinessName={initialBusinessName}
                initialWebsiteUrl={initialWebsiteUrl}
              />
            </Suspense>
          </div>
        </div>
        <p className="mt-2 text-center text-xs font-medium leading-5 text-slate-500">
          By continuing, you agree to Harlo&apos;s{" "}
          <Link href="/terms" className="font-bold text-harlo-blue underline underline-offset-4 hover:text-harlo-teal">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="font-bold text-harlo-blue underline underline-offset-4 hover:text-harlo-teal">Privacy Policy</Link>.
        </p>
      </section>
    </main>
  );
}

function normalizeBillingStatus(value: unknown): BillingStatus {
  return value === "trialing" || value === "active" || value === "past_due" || value === "canceled" || value === "incomplete"
    ? value
    : "incomplete";
}

function getBusinessName(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  const value = (metadata as { business_name?: unknown; businessName?: unknown }).business_name
    ?? (metadata as { business_name?: unknown; businessName?: unknown }).businessName;

  return typeof value === "string" ? value : "";
}
