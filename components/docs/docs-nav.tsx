"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { getSignupHref } from "@/lib/onboarding/signup-url";

const links = [
  { label: "Guides", href: "/docs" },
  { label: "Integrations", href: "/docs/integrations" },
  { label: "Support", href: "/support" },
  { label: "Pricing", href: "/#pricing" }
];

export function DocsNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07111a]/95 text-white backdrop-blur-xl">
      <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Harlo home">
              <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg">
                <Image src="/icon.png" alt="" width={36} height={36} className="h-full w-full object-contain" />
              </span>
              <span className="text-xl font-semibold">Harlo</span>
            </Link>
            <span className="hidden h-6 w-px bg-white/15 sm:block" />
            <Link href="/docs" className="hidden items-center gap-2 text-sm font-semibold text-white/72 transition hover:text-white sm:flex">
              <BookOpen size={16} />
              Documentation
            </Link>
          </div>

          <nav aria-label="Documentation navigation" className="hidden items-center gap-1 text-sm font-semibold text-white/70 lg:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href as Route} className="rounded-lg px-3.5 py-2 transition hover:bg-white/10 hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/auth/sign-in" className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white/72 transition hover:bg-white/10 hover:text-white">
              Sign in
            </Link>
            <Link
              href={getSignupHref()}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-harlo-blue px-4 text-sm font-semibold text-white transition hover:bg-harlo-teal focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              Start free trial
            </Link>
          </div>

          <button
            type="button"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 lg:hidden ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="min-h-0">
            <div className="grid gap-1 border-t border-white/10 py-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href as Route}
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                <Link href="/auth/sign-in" onClick={() => setIsOpen(false)} className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 text-sm font-semibold text-white">
                  Sign in
                </Link>
                <Link href={getSignupHref()} onClick={() => setIsOpen(false)} className="inline-flex h-11 items-center justify-center rounded-lg bg-harlo-blue text-sm font-semibold text-white">
                  Start free trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
