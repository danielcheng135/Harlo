import type { Metadata } from "next";
import Link from "next/link";
import {
  Bot,
  Cloud,
  CreditCard,
  Database,
  Mail,
  ShieldCheck
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "Subprocessors | Harlo AI LLC",
  description: "Review the third-party subprocessors Harlo AI LLC uses to provide hosting, database, AI, email, billing, and security services.",
  alternates: {
    canonical: "/subprocessors"
  }
};

const subprocessors = [
  {
    name: "Vercel Inc.",
    purpose: "Application hosting, serverless compute, content delivery, and production infrastructure.",
    data: "Account, workspace, request, usage, and technical data processed while operating the Harlo application.",
    icon: Cloud
  },
  {
    name: "Supabase, Inc.",
    purpose: "Managed database, authentication, file storage, and related backend infrastructure.",
    data: "Account details, workspace configuration, customer content, conversations, leads, integration configuration, and authentication data.",
    icon: Database
  },
  {
    name: "OpenAI, L.L.C.",
    purpose: "Artificial intelligence inference, embeddings, classification, planning, and response generation.",
    data: "Prompts, relevant customer-provided knowledge, conversation context, and instructions required to generate or classify a response.",
    icon: Bot
  },
  {
    name: "Resend, Inc.",
    purpose: "Transactional and service-related email delivery.",
    data: "Recipient email addresses, names when provided, and the content and delivery metadata of service emails.",
    icon: Mail
  },
  {
    name: "Stripe, Inc.",
    purpose: "Payment processing, subscriptions, invoices, billing portals, and fraud prevention.",
    data: "Customer identity, contact, subscription, transaction, and billing information. Harlo does not store full payment card numbers.",
    icon: CreditCard
  },
  {
    name: "Cloudflare, Inc.",
    purpose: "Abuse prevention and automated traffic detection through Cloudflare Turnstile.",
    data: "IP address, browser, device, request, and security signals needed to evaluate potentially abusive activity.",
    icon: ShieldCheck
  }
];

export default function SubprocessorsPage() {
  return (
    <main className="min-h-screen bg-harlo-canvas text-harlo-ink">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="inline-flex" aria-label="Harlo home">
          <BrandLogo />
        </Link>
        <Link href="/" className="text-sm font-semibold text-harlo-muted transition hover:text-harlo-ink">
          Back to home
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-harlo-teal">Trust and privacy</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink sm:text-5xl">Harlo subprocessors</h1>
          <p className="mt-5 text-base leading-7 text-harlo-muted">
            Harlo AI LLC uses the third-party service providers below to process customer data on our behalf and operate the Harlo service.
          </p>
          <p className="mt-3 text-sm text-harlo-muted">Last updated June 9, 2026</p>
        </div>

        <div className="mt-10 overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm">
          <div className="hidden grid-cols-[1fr_1.25fr_1.65fr] gap-6 border-b border-harlo-line bg-[#0a2633] px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-white md:grid">
            <span>Subprocessor</span>
            <span>Purpose</span>
            <span>Data processed</span>
          </div>

          {subprocessors.map((subprocessor) => {
            const Icon = subprocessor.icon;

            return (
              <article
                key={subprocessor.name}
                className="grid gap-4 border-b border-harlo-line px-6 py-6 last:border-b-0 md:grid-cols-[1fr_1.25fr_1.65fr] md:gap-6"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-harlo-blue/10 text-harlo-blue">
                    <Icon size={19} />
                  </span>
                  <h2 className="font-semibold text-harlo-ink">{subprocessor.name}</h2>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-harlo-teal md:hidden">Purpose</p>
                  <p className="text-sm leading-6 text-harlo-muted">{subprocessor.purpose}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-harlo-teal md:hidden">Data processed</p>
                  <p className="text-sm leading-6 text-harlo-muted">{subprocessor.data}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="rounded-lg border border-harlo-line bg-white p-6">
            <h2 className="text-lg font-semibold text-harlo-ink">Customer-enabled integrations</h2>
            <p className="mt-3 text-sm leading-7 text-harlo-muted">
              Slack, Calendly, Cal.com, Jobber, HubSpot, Mailchimp, and Google Sheets are optional services that a customer chooses to connect. Data sent to those services is directed by the customer and is also governed by the connected provider&apos;s terms and privacy practices.
            </p>
          </section>

          <section className="rounded-lg bg-[#0a2633] p-6 text-white">
            <h2 className="text-lg font-semibold">Questions about data processing?</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Contact Harlo for privacy, security, vendor, or data processing questions.
            </p>
            <Link
              href="mailto:support@harloai.co"
              className="mt-5 inline-flex text-sm font-semibold text-cyan-300 transition hover:text-white"
            >
              support@harloai.co
            </Link>
          </section>
        </div>

        <p className="mt-10 text-sm leading-7 text-harlo-muted">
          Harlo may update this list when service providers change. For more information about how Harlo handles personal information, review our{" "}
          <Link href="/privacy" className="font-semibold text-harlo-blue transition hover:text-harlo-teal">
            Privacy Statement
          </Link>
          .
        </p>
      </section>

      <MarketingFooter />
    </main>
  );
}
