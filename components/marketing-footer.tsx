import type { Route } from "next";
import Link from "next/link";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/#hero" },
      { label: "Features", href: "/#product" },
      { label: "Integrations", href: "/#integrations" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Compare", href: "/#compare" }
    ]
  },
  {
    title: "Solutions",
    links: [
      { label: "Customer Support", href: "/customer-support-ai-agent" },
      { label: "Lead Generation", href: "/ai-lead-capture-chatbot" },
      { label: "Small Business", href: "/website-chatbot-for-small-business" },
      { label: "Website Chatbot", href: "/ai-website-chatbot" }
    ]
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "FAQ", href: "/#faq" },
      { label: "Demo", href: "/#cta" },
      { label: "Sign in", href: "/auth/sign-in" }
    ]
  },
  {
    title: "Company",
    links: [
      { label: "Support", href: "/support" },
      { label: "Privacy", href: "/privacy" },
      { label: "Cookies", href: "/cookie-policy" },
      { label: "Terms", href: "/terms" }
    ]
  }
];

export function MarketingFooter({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const currentYear = new Date().getFullYear();
  const isLight = variant === "light";

  return (
    <footer className={`border-t px-4 py-14 sm:px-6 ${isLight ? "border-slate-200 bg-white text-[#111827]" : "border-white/10 bg-[#07111a] text-white"}`}>
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_repeat(4,0.7fr)]">
        <div>
          <div className={`flex items-center gap-2 ${isLight ? "text-[#111827]" : "text-white"}`}>
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg">
              <img src="/icon.png" alt="" className="h-full w-full object-contain" />
            </span>
            <span className="text-xl font-semibold tracking-tight">Harlo</span>
          </div>
          <p className={`mt-5 max-w-xs text-sm leading-6 ${isLight ? "text-slate-600" : "text-slate-300"}`}>
            AI agent for websites. Answer questions, capture leads, and hand off with full context.
          </p>
          <p className={`mt-6 text-xs font-medium ${isLight ? "text-slate-500" : "text-slate-500"}`}>© {currentYear} Harlo AI LLC. All rights reserved.</p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <h2 className={`text-sm font-semibold ${isLight ? "text-[#111827]" : "text-white"}`}>{column.title}</h2>
            <div className={`mt-4 grid gap-3 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {column.links.map((link) => (
                <Link key={link.label} href={link.href as Route} className="transition hover:text-harlo-blue">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
