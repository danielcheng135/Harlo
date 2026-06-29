import type { Metadata } from "next";
import { MetaAdsLandingPage } from "@/components/landing/meta-ads-landing-page";
import { siteConfig } from "@/lib/seo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const title = "Harlo | Turn Website Visitors Into Leads";
const description = "Turn website visitors into conversations, qualified leads, and warmer follow-up with Harlo's AI agent for websites.";

export const metadata: Metadata = {
  title: {
    absolute: title
  },
  description,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: siteConfig.name,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 760, alt: "Harlo AI website chatbot product preview" }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [siteConfig.ogImage]
  }
};

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <MetaAdsLandingPage isAuthenticated={Boolean(user)} />
  );
}
