import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsNav } from "@/components/docs/docs-nav";
import { IntegrationDocPageContent } from "@/components/docs/integration-doc-page";
import { MarketingFooter } from "@/components/marketing-footer";
import { integrationDocs } from "@/lib/docs";
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
    <main className="min-h-screen bg-white text-harlo-ink">
      <DocsNav />
      <IntegrationDocPageContent doc={doc} />
      <MarketingFooter />
    </main>
  );
}
