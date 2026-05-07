import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-harlo-canvas text-harlo-ink">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <BrandLogo />
        <Link href="/" className="text-sm font-semibold text-harlo-muted transition hover:text-harlo-ink">
          Back to home
        </Link>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-harlo-teal">Privacy Policy</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink">Harlo Privacy Policy</h1>
        <p className="mt-4 text-sm text-harlo-muted">Last updated May 6, 2026</p>

        <div className="mt-8 space-y-6 rounded-lg border border-harlo-line bg-white p-6 text-sm leading-7 text-harlo-muted shadow-sm">
          <p>
            Harlo collects the information needed to provide AI chatbot, lead capture, billing, and workspace management services. This may include account details, workspace settings, website content provided for training, usage data, and customer conversations submitted through the widget.
          </p>
          <p>
            We use this information to operate Harlo, improve product reliability, process billing, secure accounts, and help teams review conversations and leads. We do not sell personal information.
          </p>
          <p>
            Workspace administrators control the content they upload, the widget configuration, and team access. Customers should avoid uploading sensitive information unless it is necessary for their use of Harlo.
          </p>
          <p>
            For privacy questions, data requests, or account deletion requests, contact the Harlo team through your workspace administrator or support channel.
          </p>
        </div>
      </section>
    </main>
  );
}
