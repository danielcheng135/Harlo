import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { PricingLandingSections } from "@/components/landing/pricing-landing-sections";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingNav } from "@/components/marketing-nav";
import { BILLING_PLANS, TRIAL_CONFIG, formatPrice } from "@/lib/billing/plans";
import { createPageMetadata, seoLandingPages } from "@/lib/seo";

const page = seoLandingPages.aiChatbotPricing;

export const metadata: Metadata = createPageMetadata(page);

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f7faf8] text-harlo-ink">
      <MarketingNav
        links={[
          { label: "Features", href: "/#features" },
          { label: "Workflow", href: "/#workflow" },
          { label: "Compare", href: "/pricing#compare" },
          { label: "FAQ", href: "/pricing#faq" }
        ]}
        ctaLabel="Start free trial"
        ctaHref="/auth/sign-up"
        ctaVariant="dark"
      />

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-8 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-3xl">
          <SectionBadge>Pricing</SectionBadge>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-tight text-harlo-ink sm:text-5xl md:text-7xl">
            Plans for website answers and qualified leads.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-harlo-muted sm:text-xl sm:leading-9">
            Start with a focused AI agent for your website, then scale message credits, seats, support, and add-ons as conversations grow.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/sign-up"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-harlo-ink px-6 text-base font-semibold text-white shadow-sm transition hover:bg-harlo-navy"
            >
              Start free trial <ArrowRight size={18} />
            </Link>
            <Link
              href="#compare"
              className="inline-flex h-12 items-center justify-center rounded-full border border-harlo-line bg-white px-6 text-base font-semibold text-harlo-ink shadow-sm transition hover:border-harlo-teal hover:text-harlo-teal"
            >
              Compare plans
            </Link>
          </div>
        </div>
        <PricingHeroVisual />
      </section>

      <PricingLandingSections ctaHeadline="Choose the Harlo plan that keeps every website conversation useful." />
      <MarketingFooter />
    </main>
  );
}

function SectionBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-harlo-line bg-white px-3 py-1.5 text-sm font-semibold text-harlo-teal shadow-sm">
      <span className="h-2 w-2 rounded-full bg-harlo-blue" />
      {children}
    </span>
  );
}

function PricingHeroVisual() {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-2xl border border-harlo-line bg-white p-3 shadow-soft sm:p-5">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.045)_1px,transparent_1px),linear-gradient(rgba(17,24,39,0.045)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="relative rounded-xl bg-gradient-to-br from-harlo-mist via-white to-cyan-50 p-4 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-harlo-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-harlo-teal text-white">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="font-semibold text-harlo-ink">Plan fit</p>
              <p className="text-sm text-harlo-muted">Credits, seats, and support in one view</p>
            </div>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-harlo-teal shadow-sm">
            {TRIAL_CONFIG.credits} trial credits
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {BILLING_PLANS.map((plan) => (
            <div key={plan.key} className={`rounded-xl border bg-white p-4 shadow-sm ${plan.key === "growth" ? "border-harlo-teal" : "border-harlo-line"}`}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-harlo-ink">{plan.name}</p>
                {plan.key === "growth" ? <span className="rounded-full bg-harlo-mist px-2 py-1 text-[10px] font-bold text-harlo-teal">Popular</span> : null}
              </div>
              <p className="mt-4 text-4xl font-semibold tracking-tight text-harlo-ink">{formatPrice(plan.monthlyPrice)}</p>
              <p className="mt-1 text-xs font-semibold text-harlo-muted">per month</p>
              <div className="mt-5 h-2 rounded-full bg-harlo-mist">
                <div className={`h-full rounded-full ${plan.key === "growth" ? "w-4/5 bg-harlo-teal" : plan.key === "pro" ? "w-full bg-rose-400" : "w-2/5 bg-amber-400"}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 rounded-xl border border-harlo-line bg-white/90 p-4 shadow-sm sm:grid-cols-3">
          {["Message credits reset monthly", "Annual billing saves 20%", "Add capacity anytime"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm font-semibold text-harlo-muted">
              <CheckCircle2 size={16} className="text-harlo-teal" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
