import type { Route } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

type MarketingNavLink = {
  label: string;
  href: string;
};

type MarketingNavProps = {
  links: MarketingNavLink[];
  ctaLabel?: string;
  ctaHref?: string;
  ctaVariant?: "dark" | "outline";
};

export function MarketingNav({
  links,
  ctaLabel = "Open dashboard",
  ctaHref = "/dashboard",
  ctaVariant = "outline"
}: MarketingNavProps) {
  return (
    <header className="sticky top-4 z-40 mx-auto max-w-6xl px-4">
      <div className="flex h-16 items-center justify-between rounded-full border border-white/80 bg-[#f7faf8]/90 px-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-harlo-line/70 backdrop-blur-xl">
        <Link href="/" className="inline-flex shrink-0" aria-label="Harlo home">
          <BrandLogo />
        </Link>
        <nav className="hidden items-center gap-1 rounded-full border border-harlo-line/70 bg-white/70 p-1 text-sm font-semibold text-harlo-muted shadow-sm md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href as Route}
              className="rounded-full px-3.5 py-2 transition hover:bg-harlo-mist hover:text-harlo-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href={ctaHref as Route}
          className={`inline-flex h-11 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-harlo-teal focus:ring-offset-2 ${
            ctaVariant === "dark"
              ? "bg-harlo-ink text-white hover:bg-harlo-navy"
              : "border border-harlo-teal/45 bg-white/80 text-harlo-ink hover:bg-white hover:text-harlo-teal"
          }`}
        >
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}
