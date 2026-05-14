import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
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
          .select("name, website_url")
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

      if (organization && bot && (billing?.status === "active" || billing?.status === "trialing")) {
        redirect("/dashboard?welcome=1");
      }

      if (organization && bot) {
        redirect("/onboarding/checkout");
      }
    }
  }

  return (
    <main className="min-h-screen bg-harlo-canvas">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <BrandLogo />
      </header>
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-harlo-teal">Workspace setup</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink">
            Create your Harlo assistant.
          </h1>
          <p className="mt-4 max-w-2xl text-harlo-muted">
            Add a few details, then Harlo will discover your site brand, create the workspace, add your website as a knowledge source, and prepare card-required checkout.
          </p>
        </div>
        <div className="mt-8 rounded-2xl border border-harlo-line bg-white p-4 shadow-soft sm:p-6">
          <Suspense
            fallback={
              <div className="flex min-h-[480px] items-center justify-center rounded-2xl bg-harlo-soft text-sm font-semibold text-harlo-muted">
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
