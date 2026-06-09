import Link from "next/link";
import type { Route } from "next";
import { Mail } from "lucide-react";
import { getSignupHref } from "@/lib/onboarding/signup-url";
import { siteConfig } from "@/lib/seo";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#workflow" },
      { label: "Integrations", href: "/#integrations" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Support", href: "/support" },
      { label: "Docs", href: "/docs" },
      { label: "Add-ons", href: "/#add-ons" },
      { label: "Compare", href: "/#compare" },
      { label: "FAQ", href: "/#faq" }
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
      { label: "Cookie Policy", href: "/cookie-policy" },
      { label: "Terms of Service", href: "/terms" }
    ]
  }
];

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#07111a] px-4 py-14 text-white sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_repeat(3,0.7fr)]">
        <div>
          <div className="flex items-center gap-2 text-white">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg">
              <img src="/icon.png" alt="Harlo logo" className="h-full w-full object-contain" />
            </span>
            <span className="text-xl font-semibold">Harlo</span>
          </div>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
            Harlo helps growing teams answer website questions, automate customer support, capture qualified leads, and keep conversations grounded in approved business knowledge.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <Link
              href="mailto:support@harloai.co"
              aria-label="Email Harlo support"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-slate-300 transition hover:border-harlo-blue hover:text-harlo-blue"
            >
              <Mail size={16} />
            </Link>
            <div>
              <p className="text-sm font-semibold text-white">Customer Support</p>
              <Link href="mailto:support@harloai.co" className="text-sm font-medium text-slate-400 transition hover:text-harlo-blue">
                support@harloai.co
              </Link>
            </div>
          </div>
          <p className="mt-6 text-xs font-medium text-slate-500">© {currentYear} Harlo AI LLC. All rights reserved.</p>
        </div>

        {footerSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-white">{section.title}</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-400">
              {section.links.map((link) => (
                <Link key={link.href} href={link.href as Route} className="transition hover:text-harlo-blue">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="sr-only">{siteConfig.description}</p>
    </footer>
  );
}
