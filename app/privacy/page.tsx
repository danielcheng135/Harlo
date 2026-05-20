import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Harlo",
  description: "Review the Harlo privacy policy for account data, Google sign-in, AI chatbot data, lead capture, billing, analytics, and workspace information.",
  alternates: {
    canonical: "/privacy"
  }
};

const sections = [
  {
    title: "1. Overview",
    body: [
      "This Privacy Policy explains how Harlo collects, uses, shares, and protects information when you visit our website, create an account, sign in with Google, use the Harlo dashboard, install the Harlo widget, or interact with a Harlo-powered chatbot.",
      "Harlo is built for businesses. When a business uses Harlo on its website, that business controls how it uses visitor conversations and lead information. Harlo processes that information to provide the service to the business customer."
    ]
  },
  {
    title: "2. Information we collect",
    body: [
      "Account information: name, email address, password authentication data if you use email/password login, profile information, workspace membership, role, settings, and login activity.",
      "Google sign-in information: if you choose to sign in with Google, we may receive your Google account identifier, name, email address, profile image, email verification status, OAuth tokens or session information needed to authenticate you, and related security information. We request only the Google permissions needed to sign you in and maintain your Harlo account.",
      "Workspace and business information: company or workspace name, website URL, bot settings, widget settings, agent configuration, routing rules, lead field settings, allowed domains, team invitations, and preferences.",
      "Knowledge and customer content: website URLs, crawled website content, uploaded files, manual text, snippets, business instructions, FAQs, policies, support content, and other materials you provide so Harlo can answer visitor questions.",
      "Visitor conversations and lead information: questions, chatbot messages, visitor replies, captured contact details, lead fields, source page, timestamps, answer quality signals, retrieval sources, and conversation status.",
      "Billing information: plan, subscription status, add-ons, credit usage, invoice metadata, payment status, and limited billing details from Stripe. Harlo does not store full payment card numbers.",
      "Usage, device, and log information: IP address, browser type, device information, pages viewed, referring pages, product events, error logs, timestamps, and security logs.",
      "Support communications: messages you send to Harlo, feedback, files, and information needed to respond to support requests."
    ]
  },
  {
    title: "3. How we use information",
    body: [
      "We use information to create and secure accounts, authenticate users, provide the Harlo dashboard, operate the chatbot, retrieve relevant knowledge, capture leads, process billing, provide customer support, monitor usage limits, prevent abuse, debug errors, improve reliability, and comply with legal obligations.",
      "We may use workspace content and visitor conversations to provide Harlo features for that workspace, including AI responses, retrieval, analytics, lead capture, conversation review, and quality improvements. We do not sell personal information."
    ]
  },
  {
    title: "4. Google user data",
    body: [
      "Harlo uses Google OAuth/OpenID Connect only to let users create accounts, sign in, verify identity, and display basic account profile information inside Harlo.",
      "Harlo does not use Google sign-in data for advertising, does not sell Google user data, and does not use Google user data to train generalized AI models. We do not access Gmail, Google Drive, Google Calendar, Google Contacts, or other Google Workspace content unless we separately request permission and update this policy or provide additional disclosures.",
      "Harlo's use and transfer of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements, where applicable.",
      "You can revoke Harlo's Google access through your Google account permissions. If you revoke access, you may need to use another login method or contact support to regain access to your Harlo account."
    ]
  },
  {
    title: "5. Sensitive data and protection measures",
    body: [
      "Harlo does not intentionally request sensitive personal information through Google sign-in. The Google sign-in information Harlo receives is limited to the account data needed for authentication and account management.",
      "Harlo uses safeguards designed to protect account data, Google sign-in data, workspace content, visitor conversations, and lead information. These safeguards include encrypted HTTPS/TLS connections, managed authentication sessions, workspace role-based access controls, least-privilege access for internal systems, restricted administrative access, secure handling of environment secrets, activity and error logging, and vendor controls for service providers that process data on Harlo's behalf.",
      "Payment information is processed by Stripe. Harlo does not store full payment card numbers. OAuth sessions and authentication data are handled through Harlo's authentication provider and are used only to maintain secure account access.",
      "If Harlo becomes aware of a security incident involving personal information, we will investigate and take appropriate steps, which may include notifying affected customers or authorities when required by law."
    ]
  },
  {
    title: "6. AI processing",
    body: [
      "Harlo may send relevant prompts, business knowledge, conversation history, lead fields, and retrieval context to AI model providers and infrastructure providers to generate responses, classify intent, format lead capture answers, improve retrieval, and provide product functionality.",
      "You should not upload or intentionally collect sensitive personal information unless your business has a lawful basis and appropriate safeguards. You are responsible for reviewing your chatbot configuration and the information your website visitors are asked to provide."
    ]
  },
  {
    title: "7. How we share information",
    body: [
      "Service providers: we may share information with vendors that help us provide hosting, databases, authentication, AI processing, payments, analytics, email, security, monitoring, and support.",
      "Workspace users: information in a workspace may be visible to owners, admins, and team members based on their permissions. This can include conversations, leads, knowledge sources, analytics, and billing status.",
      "Website visitors and business customers: chatbot responses and relevant business information may be shown to visitors using the Harlo widget. Lead information submitted by a visitor may be shown to the business that operates the widget.",
      "Legal and safety: we may disclose information if required by law, legal process, or to protect Harlo, customers, visitors, or others from fraud, abuse, security incidents, or harm.",
      "Business transfers: information may be transferred as part of a merger, acquisition, financing, reorganization, or sale of assets."
    ]
  },
  {
    title: "8. Cookies and similar technologies",
    body: [
      "Harlo may use cookies, local storage, and similar technologies to keep users signed in, remember preferences, secure sessions, measure product usage, prevent fraud, and operate the website and dashboard.",
      "Harlo uses Cloudflare Turnstile on authentication forms to help verify that sign-in and sign-up activity is legitimate and to reduce automated abuse. For more information about Cloudflare's processing for Turnstile, see the Cloudflare Turnstile Privacy Addendum at https://www.cloudflare.com/turnstile-privacy-policy/.",
      "Your browser may let you block or delete cookies, but some Harlo features may not work properly without them."
    ]
  },
  {
    title: "9. Data retention",
    body: [
      "We retain information for as long as needed to provide Harlo, maintain accounts, comply with legal obligations, resolve disputes, enforce agreements, prevent abuse, and support business operations.",
      "Workspace owners and admins may delete certain content from the dashboard. Some information may remain in backups, logs, billing records, or audit records for a limited period, unless longer retention is required by law."
    ]
  },
  {
    title: "10. Your choices and rights",
    body: [
      "Depending on your location, you may have rights to access, correct, delete, export, restrict, or object to certain processing of personal information. You may also have the right to opt out of certain disclosures or uses.",
      "If you are a Harlo account user, you can update some information in your account or workspace settings. If you are a website visitor who interacted with a Harlo-powered chatbot, please contact the business that operates that website first, because that business controls its visitor and lead records.",
      "You may contact Harlo at support@harloai.co for privacy requests. We may need to verify your identity and authority before fulfilling a request."
    ]
  },
  {
    title: "11. Security",
    body: [
      "We use reasonable administrative, technical, and organizational safeguards designed to protect information from unauthorized access, loss, misuse, alteration, or disclosure. No online service can guarantee perfect security, and you are responsible for keeping your account credentials secure and limiting team access to trusted users."
    ]
  },
  {
    title: "12. International transfers",
    body: [
      "Harlo is operated from the United States and may process information in the United States and other countries where we or our service providers operate. These countries may have privacy laws that differ from the laws where you live."
    ]
  },
  {
    title: "13. Children",
    body: [
      "Harlo is not directed to children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child provided personal information to Harlo, contact us so we can review and delete it where appropriate."
    ]
  },
  {
    title: "14. Changes to this policy",
    body: [
      "We may update this Privacy Policy from time to time. If changes are material, we will take reasonable steps to notify users, such as posting a new effective date or providing notice in the product."
    ]
  },
  {
    title: "15. Contact",
    body: [
      "For privacy questions, Google sign-in questions, data requests, or account deletion requests, contact support@harloai.co."
    ]
  }
];

export default function PrivacyPage() {
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
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-harlo-teal">Privacy Policy</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink">Harlo Privacy Policy</h1>
        <p className="mt-4 text-sm text-harlo-muted">Last updated May 19, 2026</p>

        <div className="mt-8 space-y-8 rounded-lg border border-harlo-line bg-white p-6 text-sm leading-7 text-harlo-muted shadow-sm sm:p-8">
          <p>
            This policy is written for Harlo customers, team members, and website visitors who interact with a Harlo-powered chatbot. It also explains how Harlo handles Google sign-in data for accounts that log in with Google.
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
