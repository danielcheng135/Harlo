import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
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
          .select("status")
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

      if (organization && bot && (isInternalWorkspace || billing?.status === "active" || billing?.status === "trialing")) {
        redirect("/dashboard?welcome=1");
      }

      if (organization && bot) {
        redirect("/onboarding/checkout");
      }
    }
  }

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
          Secure workspace setup
        </span>
      </header>

      <section className="relative mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6 sm:pb-12 sm:pt-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold uppercase text-white/75">
              <Sparkles size={14} className="text-harlo-blue" />
              Workspace setup
            </span>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.04] sm:text-5xl lg:text-6xl">
              Build your first AI agent in minutes.
            </h1>
          </div>
          <div className="lg:pb-1">
            <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Share your website, choose how Harlo should help, and review the setup before your workspace is created.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-400">
              {["Website knowledge added", "Fully editable later", "No code required yet"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-harlo-blue" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Suspense
            fallback={
              <div className="flex min-h-[620px] items-center justify-center rounded-lg border border-white/10 bg-white text-sm font-semibold text-harlo-muted shadow-[0_32px_100px_rgba(0,0,0,0.28)]">
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
        <p className="mt-5 text-center text-xs leading-5 text-white/45">
          By continuing, you agree to Harlo&apos;s{" "}
          <Link href="/terms" className="text-white/70 underline underline-offset-4 hover:text-white">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-white/70 underline underline-offset-4 hover:text-white">Privacy Policy</Link>.
        </p>
      </section>
    </main>
  );
}

function getBusinessName(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  const value = (metadata as { business_name?: unknown; businessName?: unknown }).business_name
    ?? (metadata as { business_name?: unknown; businessName?: unknown }).businessName;

  return typeof value === "string" ? value : "";
}
