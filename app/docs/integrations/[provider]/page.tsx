import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntegrationDocPageContent } from "@/components/docs/integration-doc-page";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingNav } from "@/components/marketing-nav";
import { integrationDocs } from "@/lib/docs";
import { getSignupHref } from "@/lib/onboarding/signup-url";
import { siteConfig } from "@/lib/seo";

type IntegrationProviderPageProps = {
  params: Promise<{
    provider: string;
  }>;
};

export function generateStaticParams() {
  return integrationDocs.map((doc) => ({ provider: doc.slug }));
}

export async function generateMetadata({ params }: IntegrationProviderPageProps): Promise<Metadata> {
  const { provider } = await params;
  const doc = integrationDocs.find((integration) => integration.slug === provider);

  if (!doc) {
    return {};
  }

  const title = `${doc.name} Integration Documentation | Harlo`;

  return {
    title,
    description: doc.description,
    alternates: {
      canonical: doc.path
    },
    openGraph: {
      title,
      description: doc.description,
      url: doc.path,
      siteName: siteConfig.name,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 760, alt: `${doc.name} integration documentation for Harlo` }],
      locale: "en_US",
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: doc.description,
      images: [siteConfig.ogImage]
    }
  };
}

export default async function IntegrationProviderPage({ params }: IntegrationProviderPageProps) {
  const { provider } = await params;
  const doc = integrationDocs.find((integration) => integration.slug === provider);

  if (!doc) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7faf8] text-harlo-ink">
      <MarketingNav
        links={[
          { label: "Docs", href: "/docs" },
          { label: "Integrations", href: "/docs/integrations" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Sign in", href: "/auth/sign-in" }
        ]}
        ctaLabel="Start free trial"
        ctaHref={getSignupHref()}
        ctaVariant="dark"
      />
      <IntegrationDocPageContent doc={doc} />
      <MarketingFooter />
    </main>
  );
}
