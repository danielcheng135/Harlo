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
    <footer className="bg-white px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_repeat(3,0.7fr)]">
        <div>
          <div className="flex items-center gap-2 text-harlo-ink">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg">
              <img src="/icon.png" alt="Harlo logo" className="h-full w-full object-contain" />
            </span>
            <span className="text-xl font-semibold tracking-tight">Harlo</span>
          </div>
          <p className="mt-5 max-w-md text-sm leading-6 text-harlo-muted">
            Harlo helps growing teams answer website questions, automate customer support, capture qualified leads, and keep conversations grounded in approved business knowledge.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <Link
              href="mailto:support@harloai.co"
              aria-label="Email Harlo support"
              className="grid h-9 w-9 place-items-center rounded-full border border-harlo-line text-harlo-muted transition hover:border-harlo-teal hover:text-harlo-teal"
            >
              <Mail size={16} />
            </Link>
            <div>
              <p className="text-sm font-semibold text-harlo-ink">Customer Support</p>
              <Link href="mailto:support@harloai.co" className="text-sm font-medium text-harlo-muted transition hover:text-harlo-teal">
                support@harloai.co
              </Link>
            </div>
          </div>
          <p className="mt-6 text-xs font-medium text-harlo-muted">© {currentYear} Harlo AI LLC. All rights reserved.</p>
        </div>

        {footerSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-harlo-ink">{section.title}</h2>
            <div className="mt-4 grid gap-3 text-sm text-harlo-muted">
              {section.links.map((link) => (
                <Link key={link.href} href={link.href as Route} className="transition hover:text-harlo-teal">
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
