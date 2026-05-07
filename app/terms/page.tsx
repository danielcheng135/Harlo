import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-harlo-canvas text-harlo-ink">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <BrandLogo />
        <Link href="/" className="text-sm font-semibold text-harlo-muted transition hover:text-harlo-ink">
          Back to home
        </Link>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-harlo-teal">Terms of Service</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink">Harlo Terms of Service</h1>
        <p className="mt-4 text-sm text-harlo-muted">Last updated May 6, 2026</p>

        <div className="mt-8 space-y-6 rounded-lg border border-harlo-line bg-white p-6 text-sm leading-7 text-harlo-muted shadow-sm">
          <p>
            Harlo provides AI chatbot, knowledge management, lead capture, and related dashboard services for business websites. By using Harlo, you agree to use the service responsibly and in compliance with applicable laws.
          </p>
          <p>
            You are responsible for the content you upload, the instructions you configure, and the way your team uses customer conversations and lead data. Harlo may generate imperfect responses, so teams should review important workflows and customer-facing instructions.
          </p>
          <p>
            Paid plans, add-ons, usage limits, renewals, and cancellations are managed through the billing settings available in the workspace. Features and limits may vary by plan.
          </p>
          <p>
            Harlo may suspend access for misuse, security risk, payment failure, or activity that could harm the service or other customers.
          </p>
        </div>
      </section>
    </main>
  );
}
