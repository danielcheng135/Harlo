import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "Terms of Service | Harlo",
  description: "Review the Harlo terms of service for accounts, Google sign-in, subscriptions, AI chatbot use, lead capture, billing, and workspace responsibilities.",
  alternates: {
    canonical: "/terms"
  }
};

const sections = [
  {
    title: "1. Agreement to these terms",
    body: [
      "These Terms of Service govern access to and use of Harlo, including the Harlo website, dashboard, AI website chatbot, lead capture tools, knowledge management features, analytics, billing tools, and related services.",
      "By creating an account, signing in, starting a trial, installing the Harlo widget, inviting a team member, or using Harlo in any way, you agree to these terms. If you use Harlo on behalf of a business or organization, you represent that you have authority to bind that organization, and \"you\" means that organization."
    ]
  },
  {
    title: "2. Harlo services",
    body: [
      "Harlo helps businesses answer website visitor questions, capture lead information, review conversations, manage knowledge sources, and analyze customer engagement. Harlo may use AI systems and third-party infrastructure to generate responses, retrieve knowledge, process conversations, and power product features.",
      "AI-generated responses can be incomplete, inaccurate, delayed, or inappropriate for a specific situation. You are responsible for reviewing your chatbot configuration, knowledge sources, lead fields, routing settings, and customer-facing use of Harlo."
    ]
  },
  {
    title: "3. Accounts, eligibility, and Google sign-in",
    body: [
      "You must provide accurate account information and keep your account secure. You are responsible for activity under your account and for the users you invite to your workspace.",
      "Harlo may allow you to sign up or log in with Google. When you choose Google sign-in, Harlo uses Google OAuth/OpenID Connect to authenticate you and may receive basic profile information such as your name, email address, profile image, and a Google account identifier. Harlo uses this information to create and secure your account, manage your session, display your workspace profile, and provide access to Harlo. Harlo does not use Google sign-in to access your Gmail, Google Drive, Calendar, or other Google Workspace content unless we separately request additional permissions and disclose that use."
    ]
  },
  {
    title: "4. Customer content and visitor data",
    body: [
      "You may upload or connect business information, website pages, files, manual text, instructions, lead fields, team settings, and other content to Harlo. You retain ownership of your content. You grant Harlo the rights needed to host, process, analyze, retrieve, display, and use that content to provide and improve Harlo for your workspace.",
      "If you install the Harlo widget on your website, visitors may submit questions, contact information, business details, and other information through the chatbot. You are responsible for providing any privacy notices or consents required for your website visitors and for using visitor data in compliance with applicable law."
    ]
  },
  {
    title: "5. Your responsibilities",
    body: [
      "You are responsible for your workspace configuration, your website, the content you provide to Harlo, the accuracy of your business information, your team members, and your use of conversation and lead data.",
      "You will not use Harlo to violate law, infringe rights, send spam, mislead visitors, collect sensitive information without proper authorization, reverse engineer the service, interfere with security, overload the service, or use Harlo for high-risk decisions where an inaccurate AI response could cause legal, financial, medical, safety, or other serious harm."
    ]
  },
  {
    title: "6. Subscriptions, trials, credits, add-ons, and billing",
    body: [
      "Harlo may offer free trials, paid subscriptions, message credits, usage limits, and paid add-ons. Plan features, prices, limits, and billing intervals are shown at checkout or in the billing dashboard and may change for future billing periods.",
      "Payments are processed by Stripe or another payment provider. By starting a paid plan or add-on, you authorize Harlo and its payment provider to charge the payment method you provide for recurring fees, usage-based fees, add-ons, taxes, and other amounts you approve. Unless stated otherwise at checkout, subscriptions renew automatically until canceled.",
      "Trials may have limited credits or features. If trial credits run out, you may need to start a paid subscription to continue using paid features. Add-ons are available only when your main plan is active unless Harlo states otherwise. Cancellations, downgrades, and add-on changes may take effect immediately or at the end of the billing period depending on the action and Stripe checkout or portal flow."
    ]
  },
  {
    title: "7. Acceptable use of AI and communications",
    body: [
      "You are responsible for ensuring that chatbot messages, lead capture prompts, and follow-up workflows are appropriate for your business. Harlo is not a substitute for professional advice or human review where review is required.",
      "You must not configure Harlo to impersonate someone without permission, make false claims, collect prohibited categories of information, discriminate unlawfully, or provide regulated advice unless you have appropriate rights, disclosures, and human oversight."
    ]
  },
  {
    title: "8. Third-party services",
    body: [
      "Harlo may integrate with or rely on third-party services, including authentication providers, hosting providers, database providers, AI model providers, email providers, analytics providers, and payment processors. Your use of those services may be subject to their own terms and policies.",
      "Harlo is not responsible for third-party services that it does not control, but we choose service providers to help operate, secure, and improve Harlo."
    ]
  },
  {
    title: "9. Suspension and termination",
    body: [
      "You may stop using Harlo at any time. You may cancel paid services through the billing dashboard or Stripe billing portal when available.",
      "Harlo may suspend or terminate access if you violate these terms, fail to pay, create security risk, misuse the service, or if continued access could harm Harlo, visitors, customers, or third parties. After termination, Harlo may retain certain information as described in the Privacy Policy or as required by law."
    ]
  },
  {
    title: "10. Disclaimers",
    body: [
      "Harlo is provided on an \"as is\" and \"as available\" basis. To the fullest extent permitted by law, Harlo disclaims warranties of merchantability, fitness for a particular purpose, non-infringement, uninterrupted operation, and error-free or fully accurate AI output.",
      "You are responsible for backing up important business information and reviewing important customer-facing content and workflows."
    ]
  },
  {
    title: "11. Limitation of liability",
    body: [
      "To the fullest extent permitted by law, Harlo will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost revenue, lost data, lost business, goodwill, or service interruption.",
      "To the fullest extent permitted by law, Harlo's total liability for claims relating to the service will not exceed the amount you paid to Harlo for the service in the three months before the event giving rise to the claim, or $100 if you did not pay Harlo during that period."
    ]
  },
  {
    title: "12. Indemnity",
    body: [
      "You will defend, indemnify, and hold harmless Harlo from claims, damages, liabilities, losses, and expenses, including reasonable attorneys' fees, arising from your content, your website, your workspace configuration, your use of visitor or lead data, your violation of law, or your violation of these terms."
    ]
  },
  {
    title: "13. Governing law and disputes",
    body: [
      "These terms are governed by the laws of the Commonwealth of Virginia, excluding conflict of law rules, unless applicable law requires otherwise. Courts located in Virginia will have jurisdiction over disputes that cannot be resolved informally, unless a different venue is required by applicable law.",
      "Before filing a claim, each party agrees to try to resolve the dispute informally by contacting the other party and giving a reasonable opportunity to respond."
    ]
  },
  {
    title: "14. Changes to these terms",
    body: [
      "Harlo may update these terms from time to time. If changes are material, we will take reasonable steps to notify you, such as posting an updated date or providing notice in the product. Continued use of Harlo after changes become effective means you accept the updated terms."
    ]
  },
  {
    title: "15. Contact",
    body: [
      "Questions about these terms can be sent to support@harloai.co."
    ]
  }
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-harlo-canvas text-harlo-ink">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Link href="/" className="inline-flex" aria-label="Harlo home">
          <BrandLogo />
        </Link>
        <Link href="/" className="text-sm font-semibold text-harlo-muted transition hover:text-harlo-ink">
          Back to home
        </Link>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-harlo-teal">Terms of Service</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink">Harlo Terms of Service</h1>
        <p className="mt-4 text-sm text-harlo-muted">Last updated May 19, 2026</p>

        <div className="mt-8 space-y-8 rounded-lg border border-harlo-line bg-white p-6 text-sm leading-7 text-harlo-muted shadow-sm sm:p-8">
          <p>
            Please read these terms carefully. They explain the rules for using Harlo and the responsibilities that apply when your business uses Harlo to answer website visitors, capture leads, and manage customer conversations.
          </p>
          {sections.map((section) => (
            <section key={section.title} className="border-t border-harlo-line pt-6 first:border-t-0 first:pt-0">
              <h2 className="text-lg font-semibold text-harlo-ink">{section.title}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
