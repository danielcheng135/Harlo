import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsNav } from "@/components/docs/docs-nav";
import { WidgetInstallPlatformPageContent } from "@/components/docs/widget-install-platform-page";
import { MarketingFooter } from "@/components/marketing-footer";
import { getWidgetInstallDocBySlug, widgetInstallDocs } from "@/lib/docs";
import { siteConfig } from "@/lib/seo";

type WidgetInstallPlatformPageProps = {
  params: Promise<{
    platform: string;
  }>;
};

export function generateStaticParams() {
  return widgetInstallDocs.map((doc) => ({ platform: doc.slug }));
}

export async function generateMetadata({ params }: WidgetInstallPlatformPageProps): Promise<Metadata> {
  const { platform } = await params;
  const doc = getWidgetInstallDocBySlug(platform);

  if (!doc) {
    return {};
  }

  const title = `Install Harlo on ${doc.name} | Harlo Docs`;

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
      images: [{ url: siteConfig.ogImage, width: 1200, height: 760, alt: `Install Harlo on ${doc.name}` }],
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

export default async function WidgetInstallPlatformPage({ params }: WidgetInstallPlatformPageProps) {
  const { platform } = await params;
  const doc = getWidgetInstallDocBySlug(platform);

  if (!doc) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white text-harlo-ink">
      <DocsNav />
      <WidgetInstallPlatformPageContent doc={doc} />
      <MarketingFooter />
    </main>
  );
}
