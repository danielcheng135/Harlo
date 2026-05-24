import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "Cookie Policy | Harlo AI LLC",
  description: "Review the Harlo AI LLC cookie policy for essential cookies, local storage, analytics, security, billing, and chatbot widget technologies.",
  alternates: {
    canonical: "/cookie-policy"
  }
};

const sections = [
  {
    title: "1. Overview",
    body: [
      "This Cookie Policy explains how Harlo AI LLC (\"Harlo,\" \"we,\" \"us,\" or \"our\") uses cookies, local storage, pixels, SDKs, and similar technologies when you visit our website, create an account, sign in, use the Harlo dashboard, install the Harlo widget, or interact with a Harlo-powered chatbot.",
      "This policy should be read together with our Privacy Policy and Terms of Service. It describes the technologies we use, why we use them, and the choices you may have."
    ]
  },
  {
    title: "2. What cookies and similar technologies are",
    body: [
      "Cookies are small text files stored on your browser or device. They can help a website remember information about your visit, keep you signed in, secure your session, measure usage, or support product features.",
      "Similar technologies include browser local storage, session storage, pixels, tags, SDKs, scripts, device identifiers, and server logs. These technologies may store or read information such as session identifiers, preferences, page URLs, timestamps, browser type, device information, IP address, and product events."
    ]
  },
  {
    title: "3. Essential and security technologies",
    body: [
      "Harlo AI LLC uses essential cookies and similar technologies to operate the website, authenticate users, maintain secure sessions, route requests, prevent abuse, detect suspicious activity, remember account state, and provide dashboard functionality.",
      "These technologies are necessary for Harlo to work. If you block or delete them, you may not be able to sign in, maintain a session, use the dashboard, complete checkout, manage billing, or use certain security-protected forms."
    ]
  },
  {
    title: "4. Authentication and account technologies",
    body: [
      "When you create an account or sign in, Harlo and its authentication providers may use cookies, OAuth session data, local storage, and related identifiers to verify your identity, keep you signed in, manage workspace access, remember login state, and protect your account.",
      "If you sign in with Google, Google may set or read cookies according to its own policies. Harlo uses Google sign-in data only to authenticate you and maintain account access, as described in our Privacy Policy."
    ]
  },
  {
    title: "5. Preferences and product settings",
    body: [
      "Harlo AI LLC may use cookies or local storage to remember product preferences, widget state, visitor identifiers, dashboard settings, dismissed notices, selected filters, UI choices, and other settings that make the service work consistently.",
      "These technologies help reduce repeated prompts and keep your experience stable across page loads or browser sessions."
    ]
  },
  {
    title: "6. Analytics and performance",
    body: [
      "Harlo AI LLC may use analytics and performance technologies to understand website traffic, product usage, page performance, feature adoption, errors, referrals, and conversion flows. This helps us improve reliability, usability, onboarding, pricing pages, documentation, and customer support.",
      "Analytics information may include page views, clicked elements, approximate location derived from IP address, device and browser information, referring pages, timestamps, and product events. We do not use analytics cookies to sell personal information."
    ]
  },
  {
    title: "7. Harlo widget and visitor conversations",
    body: [
      "When a business installs the Harlo widget on its website, the widget may use local storage or similar browser technologies to recognize a returning visitor, maintain a conversation, remember whether a greeting was shown or dismissed, connect messages to a conversation, and keep the widget operating across page views.",
      "The business that operates the website is responsible for providing any cookie notice, privacy notice, or consent mechanism required for its visitors. Harlo AI LLC processes widget-related information to provide the service to that business customer."
    ]
  },
  {
    title: "8. Billing, checkout, and fraud prevention",
    body: [
      "Harlo AI LLC may rely on Stripe or other payment providers for checkout, subscription management, billing portals, invoices, tax calculation, payment security, and fraud prevention. Those providers may set or read cookies and similar technologies under their own policies.",
      "Harlo AI LLC does not store full payment card numbers. Payment technologies are used to process transactions, maintain billing records, reduce fraud, and provide subscription features."
    ]
  },
  {
    title: "9. Third-party providers",
    body: [
      "Harlo AI LLC may use service providers for hosting, security, authentication, databases, analytics, payments, support, email delivery, monitoring, and AI infrastructure. These providers may process information collected through cookies or similar technologies as needed to provide their services to Harlo AI LLC.",
      "Examples may include Cloudflare Turnstile for abuse prevention on authentication forms, Stripe for payments and billing, Google for optional sign-in, hosting and database providers for service delivery, and analytics or monitoring tools for product reliability."
    ]
  },
  {
    title: "10. Your choices",
    body: [
      "Most browsers let you block, delete, or limit cookies through browser settings. Your device may also provide privacy controls for identifiers, cross-site tracking, or local storage.",
      "If you block all cookies or storage, parts of Harlo may not work correctly. Essential security, authentication, checkout, and dashboard functions may require cookies or similar technologies.",
      "Some third-party providers offer their own opt-out controls. You should review the privacy and cookie settings made available by your browser, device, and relevant third-party providers."
    ]
  },
  {
    title: "11. Do Not Track and preference signals",
    body: [
      "Some browsers send Do Not Track or other preference signals. Because there is not a single industry standard for responding to every signal, Harlo AI LLC may not respond to all browser signals in the same way.",
      "Where required by applicable law, Harlo AI LLC will honor legally recognized opt-out preference signals or provide additional controls for applicable users."
    ]
  },
  {
    title: "12. Retention",
    body: [
      "Cookies and similar technologies may last only for a browser session or may remain for a longer period, depending on their purpose. For example, session cookies may expire when you close your browser, while preference or visitor identifiers may remain so the service can remember settings or conversation state.",
      "Information collected through cookies and similar technologies is retained as described in our Privacy Policy, unless a shorter retention period applies or deletion is required by law."
    ]
  },
  {
    title: "13. Changes to this policy",
    body: [
      "We may update this Cookie Policy from time to time to reflect changes in our service, technologies, providers, legal requirements, or business practices. If changes are material, we will take reasonable steps to provide notice, such as posting a new effective date."
    ]
  },
  {
    title: "14. Contact",
    body: [
      "Questions about this Cookie Policy or Harlo AI LLC's use of cookies and similar technologies can be sent to support@harloai.co."
    ]
  }
];

export default function CookiePolicyPage() {
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
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-harlo-teal">Cookie Policy</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink">Harlo AI LLC Cookie Policy</h1>
        <p className="mt-4 text-sm text-harlo-muted">Last updated May 24, 2026</p>

        <div className="mt-8 space-y-8 rounded-lg border border-harlo-line bg-white p-6 text-sm leading-7 text-harlo-muted shadow-sm sm:p-8">
          <p>
            This policy explains how Harlo AI LLC uses cookies and similar technologies to run the website, secure accounts, power the dashboard, process billing, understand product usage, and support Harlo-powered chat widgets.
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
