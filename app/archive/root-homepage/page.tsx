import type { Metadata } from "next";
import { RootHomepage } from "@/components/landing/root-homepage";
import { homeJsonLd } from "@/lib/seo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: {
    absolute: "Archived Harlo Homepage"
  },
  description: "Archived copy of the previous Harlo homepage.",
  alternates: {
    canonical: "/archive/root-homepage"
  },
  robots: {
    index: false,
    follow: false
  }
};

export default async function ArchivedRootHomepagePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeJsonLd())
        }}
      />
      <RootHomepage isAuthenticated={Boolean(user)} />
    </>
  );
}
