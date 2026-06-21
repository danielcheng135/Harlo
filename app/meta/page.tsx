import type { Metadata } from "next";
import { MetaAdsLandingPage } from "@/components/landing/meta-ads-landing-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: {
    absolute: "Harlo | Turn Website Visitors Into Leads"
  },
  description: "A focused Harlo landing page for turning paid traffic into conversations, qualified leads, and warmer follow-up.",
  alternates: {
    canonical: "/meta"
  },
  robots: {
    index: false,
    follow: true
  }
};

export default async function MetaAdsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return <MetaAdsLandingPage isAuthenticated={Boolean(user)} />;
}
