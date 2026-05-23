import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsWorkspace } from "@/components/docs/docs-workspace";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingNav } from "@/components/marketing-nav";
import { docs, getDocBySlug } from "@/lib/docs";
import { getSignupHref } from "@/lib/onboarding/signup-url";
import { siteConfig } from "@/lib/seo";

type DocsSectionPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return docs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: DocsSectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocBySlug(slug);

  if (!doc) {
    return {};
  }

  const title = `${doc.label} Documentation | Harlo`;

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
      images: [{ url: siteConfig.ogImage, width: 1200, height: 760, alt: `${doc.label} documentation for Harlo` }],
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

export default async function DocsSectionPage({ params }: DocsSectionPageProps) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7faf8] text-harlo-ink">
      <MarketingNav
        links={[
          { label: "Docs", href: "/docs" },
          { label: "Pricing", href: "/#pricing" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Sign in", href: "/auth/sign-in" }
        ]}
        ctaLabel="Start free trial"
        ctaHref={getSignupHref()}
        ctaVariant="dark"
      />
      <DocsWorkspace initialDocId={doc.id} />
      <MarketingFooter />
    </main>
  );
}
