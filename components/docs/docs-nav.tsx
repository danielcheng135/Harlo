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
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 text-[#031020] backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-7 lg:px-9">
        <div className="flex h-[54px] items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 transition hover:bg-slate-100" aria-label="Harlo home">
              <span className="grid h-5 w-5 place-items-center overflow-hidden rounded-[4px]">
                <Image src="/icon.png" alt="" width={20} height={20} className="h-full w-full object-contain" />
              </span>
              <span className="text-xl font-bold tracking-[-0.03em]">Harlo</span>
            </Link>
            <span className="hidden h-6 w-px bg-slate-200 sm:block" />
            <Link href="/docs" className="hidden items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] font-light text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 sm:flex">
              <BookOpen size={16} />
              Documentation
            </Link>
          </div>

          <nav aria-label="Documentation navigation" className="hidden items-center gap-1 text-[13px] font-light text-slate-500 lg:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href as Route} className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-700">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/auth/sign-in" className="rounded-md px-3 py-2 text-[13px] font-light text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
              Sign in
            </Link>
            <Link
              href={getSignupHref()}
              className="inline-flex h-9 items-center justify-center rounded-[12px] bg-harlo-blue px-4 text-[13px] font-bold text-white shadow-[0_4px_0_#066375] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-harlo-blue/30"
            >
              Start free trial
            </Link>
          </div>

          <button
            type="button"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-[#031020] transition hover:bg-slate-100 lg:hidden"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 lg:hidden ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="min-h-0">
            <div className="grid gap-1 border-t border-slate-200 py-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href as Route}
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-[#031020]"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
                <Link href="/auth/sign-in" onClick={() => setIsOpen(false)} className="inline-flex h-11 items-center justify-center rounded-[12px] border border-slate-200 text-sm font-semibold text-[#031020]">
                  Sign in
                </Link>
                <Link href={getSignupHref()} onClick={() => setIsOpen(false)} className="inline-flex h-11 items-center justify-center rounded-[12px] bg-harlo-blue text-sm font-bold text-white shadow-[0_4px_0_#066375]">
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
