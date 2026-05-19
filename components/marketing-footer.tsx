import Link from "next/link";
import type { Route } from "next";
import { Sparkles } from "lucide-react";
import { getSignupHref } from "@/lib/onboarding/signup-url";
import { siteConfig } from "@/lib/seo";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#workflow" },
      { label: "Pricing", href: "/pricing" },
      { label: "Docs", href: "/docs" },
      { label: "Add-ons", href: "/pricing#add-ons" },
      { label: "Compare", href: "/pricing#compare" },
      { label: "FAQ", href: "/pricing#faq" }
    ]
  },
  {
    title: "Workspace",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Sign in", href: "/auth/sign-in" },
      { label: "Create account", href: getSignupHref() }
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" }
    ]
  }
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-harlo-line bg-harlo-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.3fr_0.9fr_1fr_0.9fr]">
        <div>
          <div className="flex items-center gap-2 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-harlo-teal text-white">
              <Sparkles size={18} />
            </span>
            <span className="text-xl font-semibold tracking-tight">Harlo</span>
          </div>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
            Harlo helps growing teams answer website questions, automate customer support, capture qualified leads, and keep conversations grounded in approved business knowledge.
          </p>
        </div>

        {footerSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-white">{section.title}</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              {section.links.map((link) => (
                <Link key={link.href} href={link.href as Route} className="transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Harlo. All rights reserved.</p>
          <p>{siteConfig.description}</p>
        </div>
      </div>
    </footer>
  );
}
