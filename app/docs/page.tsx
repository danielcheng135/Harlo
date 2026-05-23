import type { Metadata } from "next";
import type { Route as NextRoute } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingNav } from "@/components/marketing-nav";
import { docs } from "@/lib/docs";
import { getSignupHref } from "@/lib/onboarding/signup-url";
import { siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Harlo Documentation | Setup and Business Guides",
  description: "Learn how to set up Harlo for your business, install the website widget, manage answers, review conversations, follow up with leads, and invite your team.",
  alternates: {
    canonical: "/docs"
  },
  openGraph: {
    title: "Harlo Documentation | Setup and Business Guides",
    description: "Guides for setting up Harlo, helping website visitors, managing answers, reviewing conversations, and following up with leads.",
    url: "/docs",
    siteName: siteConfig.name,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 760, alt: "Harlo documentation" }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Harlo Documentation | Setup and Business Guides",
    description: "Set up Harlo and learn the core business workflows.",
    images: [siteConfig.ogImage]
  }
};

export default function DocsPage() {
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
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:pt-14">
        <div className="rounded-lg border border-harlo-line bg-white p-5 shadow-sm sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-harlo-line bg-harlo-canvas px-3 py-1.5 text-sm font-semibold text-harlo-teal">
            <BookOpen size={15} />
            Harlo docs
          </span>
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.55fr)] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight text-harlo-ink sm:text-5xl">
                Learn how to set up Harlo for your business.
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-harlo-muted">
                Start with website installation, then learn how to manage answers, review conversations, follow up with leads, measure performance, and invite your team.
              </p>
            </div>
            <Link href="/docs/widget-install" className="inline-flex h-12 w-fit items-center justify-center gap-2 rounded-full bg-harlo-ink px-6 text-sm font-semibold text-white transition hover:bg-harlo-navy">
              Start with widget install
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((doc) => {
            const Icon = doc.icon;

            return (
              <Link key={doc.id} href={doc.path as NextRoute} className="group flex min-h-full flex-col rounded-lg border border-harlo-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-harlo-teal hover:shadow-soft">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-harlo-teal">{doc.eyebrow}</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight text-harlo-ink">{doc.label}</h2>
                  </div>
                </div>
                <p className="mt-4 flex-1 text-sm leading-6 text-harlo-muted">{doc.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-harlo-line pt-4 text-sm font-semibold text-harlo-teal">
                  Read guide
                  <ChevronRight size={16} className="transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
