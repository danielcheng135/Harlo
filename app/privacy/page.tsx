import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "Privacy Statement | Harlo AI LLC",
  description: "Review the Harlo AI LLC privacy statement for account data, Google sign-in, AI chatbot data, lead capture, billing, analytics, and workspace information.",
  alternates: {
    canonical: "/privacy"
  }
};

const sections = [
  {
    title: "Introduction",
    body: [
      "Harlo is an AI website agent platform for customer support, lead capture, user engagement, knowledge-grounded answers, conversation review, analytics, and related business workflows.",
      "This Privacy Statement describes how Harlo AI LLC (\"Harlo,\" \"we,\" \"us,\" or \"our\") collects, uses, shares, and protects personal information when you visit our website, create an account, sign in, use the Harlo dashboard, install the Harlo widget, or interact with a Harlo-powered chatbot.",
      "We understand that privacy is an ongoing responsibility. We may update this Privacy Statement from time to time as we change our services, adopt new practices, or respond to legal, technical, or business developments."
    ]
  },
  {
    title: "Contacting Us About Data Protection",
    body: [
      "Harlo AI LLC is operated from the United States. For inquiries or concerns about our personal information practices, or to exercise privacy rights that may apply to you, contact us at support@harloai.co.",
      "Privacy Team Contact Information: Harlo AI LLC, support@harloai.co."
    ]
  },
  {
    title: "How we collect and use (process) your personal information",
    body: [
      "Harlo AI LLC collects personal information about website visitors, prospects, customers, workspace members, and people who interact with Harlo-powered chatbots. Depending on how you use Harlo, this information may include name, job title, employer or company name, work email address, work phone number, website URL, account credentials, profile information, billing information, workspace membership, role, settings, login activity, and support communications.",
      "We also collect workspace and business information such as company name, website URL, bot settings, widget settings, agent configuration, routing rules, lead fields, allowed domains, team invitations, and preferences. Customer-provided content may include website pages, uploaded files, manual text, snippets, business instructions, FAQs, policies, support content, and other materials used to answer visitor questions.",
      "If a business installs the Harlo widget, visitors may submit questions, messages, contact details, lead fields, source page information, timestamps, and conversation context. The business that operates the website controls how it uses visitor conversations and lead information. Harlo AI LLC processes that information to provide the Service to the business customer.",
      "We use personal information to provide prospects and customers with services, create and secure accounts, authenticate users, operate the dashboard and widget, retrieve relevant knowledge, generate AI responses, capture leads, process billing, provide support, monitor usage limits, prevent abuse, debug errors, improve reliability, and comply with legal obligations.",
      "We do not sell personal information. We share personal information only as described in this Privacy Statement, including with service providers that help us deliver Harlo."
    ]
  },
  {
    title: "Use of the Harlo Website",
    body: [
      "As with most websites, the Harlo website may automatically collect and store information in logs. This may include internet protocol (IP) address, region or general location, browser type, device type, operating system, pages viewed, referring pages, timestamps, and other usage information.",
      "We use this information to operate and secure the website, diagnose technical issues, administer the website, analyze trends, understand visitor movement, evaluate site performance, improve our content, and better understand the needs of customers and potential customers.",
      "Harlo AI LLC has a legitimate interest in understanding how visitors, customers, and potential customers use its website so we can provide relevant services, maintain appropriate staffing and support, and improve the website experience."
    ]
  },
  {
    title: "Cookies and tracking technologies",
    body: [
      "Harlo AI LLC uses cookies, local storage, and similar technologies to keep users signed in, remember preferences, secure sessions, measure product usage, prevent fraud, operate the dashboard, support the website, and maintain Harlo-powered chat widgets.",
      "We maintain a Cookie Policy that describes these technologies in more detail and explains choices you may have. You can view it at /cookie-policy.",
      "Your browser may let you block or delete cookies, but some Harlo features may not work properly without them."
    ]
  },
  {
    title: "Sharing information with third parties",
    body: [
      "The personal information Harlo AI LLC collects may be stored in databases or infrastructure operated by service providers located in the United States or other countries where our providers operate. These providers process information only to provide services to Harlo AI LLC, such as hosting, database management, authentication, AI processing, payments, analytics, email delivery, security, monitoring, and support.",
      "We may share information with workspace users according to their permissions, with business customers that operate Harlo widgets, with payment processors for billing, with AI and infrastructure providers to generate and retrieve relevant responses, and with vendors or service providers that perform functions on our behalf.",
      "We may also disclose information if you request or authorize it; if required by law, subpoena, court order, or legal process; to enforce agreements; to protect Harlo AI LLC, customers, visitors, employees, or others from fraud, abuse, security incidents, or harm; to address emergencies; to resolve disputes or claims; or in connection with a merger, acquisition, financing, reorganization, or sale of assets.",
      "We may use and share aggregated or de-identified information that does not identify you for analytics, service improvement, business reporting, and other lawful purposes."
    ]
  },
  {
    title: "Transferring personal data to the U.S.",
    body: [
      "Information we collect about you may be processed in the United States. If you use Harlo from outside the United States, you acknowledge that your personal information may be transferred to and processed in the United States and other countries where we or our service providers operate.",
      "These countries may have privacy laws that differ from those in your location. Where required, Harlo AI LLC uses appropriate safeguards for international transfers, which may include contractual protections, data processing terms, or other lawful transfer mechanisms.",
      "Depending on the circumstances, Harlo AI LLC may process and transfer personal information with your consent, to perform a contract with you, to provide the Service to a business customer, to comply with law, or to fulfill legitimate interests that are not overridden by your rights and freedoms."
    ]
  },
  {
    title: "Data Subject rights",
    body: [
      "Depending on your location, privacy laws may give you rights to be informed, access personal information, correct inaccurate information, request deletion, restrict processing, request portability, object to certain processing, opt out of certain disclosures or uses, and avoid certain automated decision-making or profiling.",
      "This Privacy Statement is intended to inform you about the personal information Harlo AI LLC collects and how it is used. You may contact us to confirm whether we process your personal information, request access to it, ask about the purpose of processing, categories of information, sources, recipients, retention periods, or request correction, deletion, restriction, portability, or objection where applicable.",
      "If you are a Harlo account user, you can update some information in your account or workspace settings. If you are a website visitor who interacted with a Harlo-powered chatbot, please contact the business that operates that website first, because that business controls its visitor and lead records.",
      "Reasonable access to your personal information will be provided at no cost where required by law. We may need to verify your identity and authority before fulfilling a request. If a request is denied, we will explain why when required. You may also have the right to lodge a complaint with a data protection authority."
    ]
  },
  {
    title: "Use of Google Workspace APIs",
    body: [
      "Harlo may use Google OAuth/OpenID Connect to let users create accounts, sign in, verify identity, and display basic account profile information inside Harlo. If you choose to sign in with Google, we may receive your Google account identifier, name, email address, profile image, email verification status, OAuth tokens or session information needed to authenticate you, and related security information.",
      "Harlo AI LLC does not use Google sign-in data for advertising, does not sell Google user data, and does not use Google user data to train generalized AI or machine learning models. We do not access Gmail, Google Drive, Google Calendar, Google Contacts, or other Google Workspace content unless we separately request permission and update this policy or provide additional disclosures.",
      "Harlo AI LLC's use and transfer of information received from Google APIs will adhere to the Google API Services User Data Policy, including Limited Use requirements where applicable. You can revoke Harlo's Google access through your Google account permissions."
    ]
  },
  {
    title: "Data Protection Mechanisms",
    body: [
      "Harlo AI LLC uses reasonable administrative, technical, and organizational safeguards designed to protect account data, Google sign-in data, workspace content, visitor conversations, lead information, and billing-related information.",
      "These safeguards may include encrypted HTTPS/TLS connections, encryption by infrastructure providers, managed authentication sessions, workspace role-based access controls, least-privilege internal access, restricted administrative access, secure handling of environment secrets, activity and error logging, abuse prevention, rate limiting, domain allowlist controls for widget embedding, and vendor controls for service providers that process data on Harlo's behalf.",
      "Payment information is processed by Stripe or another payment provider. Harlo AI LLC does not store full payment card numbers. OAuth sessions and authentication data are handled through Harlo's authentication provider and are used only to maintain secure account access.",
      "Harlo uses retrieval-augmented generation and customer-provided knowledge to generate responses for customer workspaces. Harlo AI LLC does not use customer data, Google user data, or visitor conversations to train generalized AI or machine learning models."
    ]
  },
  {
    title: "Data storage and retention",
    body: [
      "Personal information may be stored on Harlo AI LLC systems and on systems operated by cloud-based service providers. We retain information for as long as needed to provide Harlo, maintain accounts, support business operations, comply with legal obligations, resolve disputes, enforce agreements, prevent abuse, and maintain security.",
      "Customer service data is generally retained for the duration of the customer relationship and for a period afterward for business, legal, security, backup, historical, and archiving purposes. Prospect information is retained while it has business value or as needed for legal and operational purposes.",
      "Workspace owners and admins may delete certain content from the dashboard. Some information may remain in backups, logs, billing records, audit records, or security records for a limited period unless longer retention is required or permitted by law. Verified data subject or authorized agent deletion requests will be handled as required by applicable law."
    ]
  },
  {
    title: "Children's data",
    body: [
      "Harlo is not directed to children under 13, and Harlo AI LLC does not knowingly attempt to solicit or receive personal information from children under 13. If you believe a child has provided personal information to Harlo, contact us so we can review and delete it where appropriate."
    ]
  },
  {
    title: "Questions, concerns or complaints",
    body: [
      "If you have questions, concerns, complaints, or would like to exercise your privacy rights, contact Harlo AI LLC at support@harloai.co.",
      "If you are located in a jurisdiction with a data protection authority, you may also have the right to contact that authority about concerns regarding our processing of personal information."
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
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-harlo-teal">Privacy Statement</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink">Harlo AI LLC Privacy Statement</h1>
        <p className="mt-4 text-sm text-harlo-muted">Last updated May 24, 2026</p>

        <div className="mt-8 space-y-8 rounded-lg border border-harlo-line bg-white p-6 text-sm leading-7 text-harlo-muted shadow-sm sm:p-8">
          <p>
            This Privacy Statement is written for Harlo customers, team members, prospects, website visitors, and people who interact with a Harlo-powered chatbot.
          </p>
          <aside className="rounded-lg border border-harlo-blue/20 bg-harlo-blue/5 p-5">
            <p className="font-semibold text-harlo-ink">Third-party subprocessors</p>
            <p className="mt-2">
              Review the providers Harlo uses for infrastructure, AI processing, email delivery, billing, and security on our{" "}
              <Link href={"/subprocessors" as Route} className="font-semibold text-harlo-blue transition hover:text-harlo-teal">
                Subprocessors page
              </Link>
              .
            </p>
          </aside>
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
