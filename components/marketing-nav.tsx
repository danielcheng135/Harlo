"use client";

import type { Route } from "next";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-3 z-40 mx-auto max-w-6xl px-3 sm:top-4 sm:px-4">
      <div
        className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0 border border-white/80 bg-[#f7faf8]/90 px-3 py-2 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-harlo-line/70 backdrop-blur-xl transition-[border-radius] duration-200 ease-out md:h-16 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-3 md:rounded-full md:px-4 md:py-0 ${
          isOpen ? "rounded-2xl" : "rounded-[2rem]"
        }`}
      >
        <Link href="/" className="inline-flex h-12 min-w-0 shrink-0 items-center self-center" aria-label="Harlo home">
          <BrandLogo />
        </Link>
        <nav
          aria-label="Primary navigation"
          className="order-2 col-span-1 mx-auto hidden min-w-0 max-w-full items-center gap-1 rounded-full border border-harlo-line/70 bg-white/70 p-1 text-sm font-semibold text-harlo-muted shadow-sm md:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href as Route}
              className="shrink-0 rounded-full px-3.5 py-2 transition hover:bg-harlo-mist hover:text-harlo-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href={ctaHref as Route}
          className={`order-3 hidden h-11 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-harlo-teal focus:ring-offset-2 md:inline-flex ${ctaVariant === "dark"
            ? "bg-harlo-ink text-white hover:bg-harlo-navy"
            : "border border-harlo-teal/45 bg-white/80 text-harlo-ink hover:bg-white hover:text-harlo-teal"
            }`}
        >
          {ctaLabel}
        </Link>
        <button
          type="button"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="order-2 inline-grid h-12 w-12 place-items-center self-center rounded-full border border-harlo-teal/35 bg-white/85 text-harlo-ink shadow-sm transition hover:bg-white hover:text-harlo-teal focus:outline-none focus:ring-2 focus:ring-harlo-teal focus:ring-offset-2 md:hidden"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div
          className={`order-4 col-span-2 grid overflow-hidden transition-[grid-template-rows,opacity,padding-top] duration-[250ms] ease-out md:hidden ${
            isOpen ? "grid-rows-[1fr] pt-2 opacity-100" : "grid-rows-[0fr] pt-0 opacity-0"
          }`}
        >
          <div
            className={`min-h-0 overflow-hidden transition-transform duration-300 ease-out ${isOpen ? "translate-y-0" : "-translate-y-2"
              }`}
          >
            <div className="grid gap-2 rounded-2xl border border-harlo-line/70 bg-white/85 p-2 shadow-sm">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href as Route}
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-harlo-muted transition hover:bg-harlo-mist hover:text-harlo-ink"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={ctaHref as Route}
                onClick={() => setIsOpen(false)}
                className={`mt-1 inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-harlo-teal focus:ring-offset-2 ${ctaVariant === "dark"
                  ? "bg-harlo-ink text-white hover:bg-harlo-navy"
                  : "border border-harlo-teal/45 bg-white text-harlo-ink hover:text-harlo-teal"
                  }`}
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
