import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "Terms of Service | Harlo AI LLC",
  description: "Review the Harlo AI LLC terms of service for accounts, Google sign-in, subscriptions, AI chatbot use, lead capture, billing, and workspace responsibilities.",
  alternates: {
    canonical: "/terms"
  }
};

const introParagraphs = [
  "THESE TERMS OF SERVICE (the \"Agreement\") govern your receipt of, access to, and use of the services provided by Harlo AI LLC (\"Harlo,\" \"we,\" \"us,\" or \"our\"). By purchasing access to Harlo through an online ordering process, signing up for a free or paid plan, creating an account, installing the Harlo widget, inviting users, or clicking a box indicating acceptance, you agree to be bound by this Agreement.",
  "The individual accepting this Agreement does so on behalf of a company or other legal entity (\"Customer\"). Such individual represents and warrants that they have authority to bind Customer and its affiliates to this Agreement. If the individual does not have such authority, or if Customer does not agree to this Agreement, the individual must not accept this Agreement and Customer may not use the Services.",
  "Capitalized terms have the meanings set forth in this Agreement. The parties agree as follows:"
];

const sections: Array<{
  title: string;
  body?: string[];
  subsections?: Array<{ title: string; body: string[] }>;
}> = [
  {
    title: "1. The Service",
    subsections: [
      {
        title: "1.1 Service Description",
        body: [
          "Harlo owns and provides a cloud-based artificial intelligence service for website chat, customer support automation, lead capture, conversation review, analytics, knowledge management, and related business workflows (the \"Service\"). Anything Customer or its Users configure, customize, submit, upload, connect, or otherwise use through the Service is a \"User Submission.\" Customer is solely responsible for all User Submissions.",
          "The Service may include templates, widget scripts, installation snippets, documentation, examples, dashboards, workflows, and other materials that assist Customer in using the Service (\"Harlo Content\"). Customer will not receive or have access to the underlying code or software of the Service, except for installation snippets or API materials Harlo makes available for Customer's permitted use."
        ]
      },
      {
        title: "1.2 Customer's Subscription",
        body: [
          "Subject to this Agreement, Customer may purchase or receive access to the Service under ordering screens, checkout pages, plan selections, invoices, subscription portals, or other ordering processes that reference this Agreement and describe the applicable business terms (each, an \"Order\").",
          "Subscriptions are for the period described in the applicable Order (the \"Subscription Period\"). Access to the Service is permitted only for individuals authorized by Customer (\"Users\") and only for Customer's internal business purposes, including operating Harlo on Customer-owned or Customer-managed websites and properties."
        ]
      },
      {
        title: "1.3 Harlo's Ownership",
        body: [
          "Harlo AI LLC owns the Service, software, Harlo Content, documentation, website, dashboards, APIs, design elements, product workflows, and anything else provided by Harlo to Customer, excluding Customer's User Submissions (collectively, the \"Harlo Materials\").",
          "Harlo AI LLC retains all rights, title, and interest, including intellectual property rights, in and to the Harlo Materials and all related technology, updates, improvements, enhancements, modifications, fixes, and derivative works. No implied licenses are granted, and all rights not expressly granted to Customer are reserved by Harlo AI LLC."
        ]
      },
      {
        title: "1.4 Permissions",
        body: [
          "The Service may include roles, seats, workspace settings, team invitations, access controls, and other permissions that allow Users to perform tasks within the Service (\"Permissions\"). Customer is responsible for setting, reviewing, and managing all Permissions, including determining which Users may invite others or change workspace settings.",
          "Customer may provide access to the Service to its affiliates. Customer is responsible for all activity by its affiliates and Users, all payment obligations, and any breach of this Agreement by such affiliates or Users. An \"Affiliate\" means any entity that directly or indirectly controls, is controlled by, or is under common control with a party, where control means ownership of more than fifty percent (50%) of the voting interests."
        ]
      }
    ]
  },
  {
    title: "2. Restrictions",
    subsections: [
      {
        title: "2.1 Customer's Responsibilities",
        body: [
          "Customer is responsible for all activity in its account, workspaces, websites, widgets, and User accounts, except to the extent such activity results from unauthorized access caused solely by a vulnerability in the Service itself.",
          "Customer will ensure that its Users understand and comply with this Agreement. Customer is responsible for maintaining accurate account information, protecting credentials, configuring the widget appropriately, reviewing AI-generated output, and providing any required notices or consents to website visitors."
        ]
      },
      {
        title: "2.2 Use Restrictions",
        body: [
          "Customer will not, and will not permit Users or third parties to: copy, modify, translate, or create derivative works of the Service; reverse engineer, decompile, or attempt to discover source code or underlying systems except to the extent permitted by law; sell, resell, sublicense, rent, lease, distribute, or commercially exploit the Service for a third party; remove proprietary notices; use the Service in violation of law; interfere with or disrupt the Service; attempt unauthorized access; probe or test Service security without authorization; use the Service to develop or support a competing product; or use Harlo for high-risk decisions where inaccurate AI output could cause legal, financial, medical, safety, or other serious harm.",
          "Customer will not configure Harlo to mislead visitors, impersonate others without authorization, collect sensitive information without a lawful basis, provide regulated professional advice without required oversight, discriminate unlawfully, send spam, or infringe third-party rights. If Customer's use materially threatens the security, integrity, or availability of Harlo or third-party systems, Harlo AI LLC may suspend access as needed to address the issue."
        ]
      },
      {
        title: "2.3 API Access Restrictions",
        body: [
          "Harlo may provide API access, webhooks, scripts, or developer materials as part of the Service. Harlo AI LLC may set usage limits, rate limits, authentication requirements, and technical restrictions, and Customer will comply with them.",
          "Harlo AI LLC may suspend, limit, or terminate API access if Customer exceeds limits, creates security or reliability risk, violates this Agreement, or uses API access in a way that harms the Service or other customers."
        ]
      }
    ]
  },
  {
    title: "3. Third-Party Services",
    body: [
      "The Service may connect with, rely on, or make available third-party products, services, models, infrastructure, payment processors, authentication providers, analytics tools, hosting providers, websites, or applications that Harlo AI LLC does not own or control (\"Third-Party Services\"). Customer may choose to use some Third-Party Services with Harlo, and Customer is responsible for having the rights and permissions needed to do so.",
      "Third-Party Services are governed by their own terms and policies. Harlo AI LLC does not control and is not responsible for Third-Party Services, including their availability, security, functionality, errors, or omissions. Customer must direct claims about Third-Party Services to the applicable provider. Use of Third-Party Services is at Customer's own risk."
    ]
  },
  {
    title: "4. Financial Terms",
    subsections: [
      {
        title: "4.1 Fees",
        body: [
          "Customer will pay the fees shown in the applicable Order, checkout screen, billing portal, invoice, or plan description (\"Fees\"). Fees may include subscription charges, usage-based charges, message credits, add-ons, seats, agents, branding controls, taxes, or other approved charges.",
          "Unless expressly stated otherwise, payment obligations are non-cancellable and Fees are non-refundable. Harlo AI LLC may change Fees or introduce new fees for future subscription periods, renewals, upgrades, add-ons, or purchases."
        ]
      },
      {
        title: "4.2 Payment",
        body: [
          "Harlo AI LLC or its payment processor may charge the payment method Customer provides for Fees and recurring charges. Customer authorizes Harlo AI LLC and its payment processor to charge applicable Fees when due, including renewal charges, add-ons, usage charges, and taxes.",
          "Customer is responsible for maintaining accurate billing and payment information. Payment processing may be handled by Stripe or another third-party processor and is subject to that processor's terms and policies. Harlo AI LLC is not responsible for payment processor errors or omissions but may correct billing errors."
        ]
      },
      {
        title: "4.3 Taxes",
        body: [
          "Fees do not include taxes, levies, duties, assessments, withholding, sales, use, value-added, or similar governmental charges unless expressly stated. Customer is responsible for taxes associated with its purchases, except taxes based on Harlo AI LLC's income, property, or employees.",
          "If Harlo AI LLC is required to collect or pay taxes for which Customer is responsible, Harlo AI LLC may invoice or charge Customer for those amounts unless Customer provides a valid exemption certificate."
        ]
      },
      {
        title: "4.4 Failure to Pay",
        body: [
          "If Customer fails to pay Fees when due, Harlo AI LLC may suspend or limit access to the Service until overdue amounts are paid. Harlo AI LLC may retry failed payment methods and may downgrade, restrict, or terminate access for nonpayment.",
          "If Customer believes it has been billed incorrectly, Customer must contact Harlo AI LLC at support@harloai.co within sixty (60) days after the first statement or charge showing the issue. Harlo AI LLC will review the dispute in good faith. Undisputed amounts remain due."
        ]
      }
    ]
  },
  {
    title: "5. Term and Termination",
    subsections: [
      {
        title: "5.1 Agreement Term and Renewals",
        body: [
          "This Agreement begins when Customer first accepts it or begins using the Service and continues while Customer has an account, active subscription, unpaid plan, Order, or other access to the Service (the \"Term\"). Each paid subscription begins on the date shown in the applicable Order or checkout flow and continues for the Subscription Period.",
          "Subscriptions may renew automatically unless canceled through the Service, billing portal, or another method made available by Harlo AI LLC. If Customer cancels or does not renew a paid subscription, access may continue until the end of the current billing period or may be downgraded to a reduced or unpaid version if Harlo offers one."
        ]
      },
      {
        title: "5.2 Termination",
        body: [
          "Either party may terminate this Agreement if the other party materially breaches it and does not cure the breach within thirty (30) days after written notice. Harlo AI LLC may also suspend, downgrade, or terminate access for nonpayment, security risk, unlawful use, misuse of the Service, or use that may harm Harlo AI LLC, customers, visitors, or third parties.",
          "Customer may stop using Harlo at any time and may cancel paid services through the billing dashboard, Stripe portal, or other cancellation process made available by Harlo AI LLC."
        ]
      },
      {
        title: "5.3 Effect of Termination",
        body: [
          "Upon termination, Customer's rights to access and use the Service cease, and Harlo AI LLC may disable accounts, widgets, API access, and workspace features. Termination does not relieve Customer of payment obligations incurred before termination.",
          "Harlo AI LLC may retain or delete User Submissions, User Information, logs, billing records, backups, and other information as described in the Privacy Policy, applicable law, and Harlo's retention practices. Customer should export or save any information it needs before termination where export features are available."
        ]
      },
      {
        title: "5.4 Survival",
        body: [
          "Sections titled Harlo's Ownership, Third-Party Services, Financial Terms, Term and Termination, Warranties and Disclaimers, Limitation of Liability, Confidentiality, Data, and General Terms, together with any provisions that by their nature should survive, will survive termination or expiration of this Agreement."
        ]
      }
    ]
  },
  {
    title: "6. Warranties and Disclaimers",
    subsections: [
      {
        title: "6.1 Warranties",
        body: [
          "Customer represents and warrants that it has the authority to enter into this Agreement, provide User Submissions and User Information to Harlo, configure the Service for its websites, and use the Service as contemplated by this Agreement.",
          "Customer further represents and warrants that its User Submissions, widget configuration, visitor notices, lead capture practices, and use of the Service comply with applicable laws, rules, regulations, and third-party rights."
        ]
      },
      {
        title: "6.2 Warranty Disclaimer",
        body: [
          "EXCEPT AS EXPRESSLY STATED IN THIS AGREEMENT, THE SERVICE, HARLO MATERIALS, AI OUTPUT, DOCUMENTATION, AND ALL RELATED COMPONENTS AND INFORMATION ARE PROVIDED ON AN \"AS IS\" AND \"AS AVAILABLE\" BASIS WITHOUT WARRANTIES OF ANY KIND.",
          "TO THE FULLEST EXTENT PERMITTED BY LAW, HARLO AI LLC DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, UNINTERRUPTED OPERATION, SECURITY, ERROR-FREE PERFORMANCE, AND ACCURACY OF AI OUTPUT. CUSTOMER IS RESPONSIBLE FOR REVIEWING CUSTOMER-FACING USE OF HARLO AND ANY IMPORTANT AI-GENERATED OUTPUT."
        ]
      }
    ]
  },
  {
    title: "7. Limitation of Liability",
    body: [
      "TO THE FULLEST EXTENT PERMITTED BY LAW, HARLO AI LLC WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, LOST REVENUE, LOST DATA, LOST BUSINESS, LOSS OF GOODWILL, SERVICE INTERRUPTION, DATA CORRUPTION, SYSTEM FAILURE, OR INABILITY TO USE THE SERVICE, REGARDLESS OF LEGAL THEORY AND EVEN IF HARLO AI LLC HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.",
      "TO THE FULLEST EXTENT PERMITTED BY LAW, HARLO AI LLC'S TOTAL LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE OR THIS AGREEMENT WILL NOT EXCEED THE AMOUNTS PAID OR PAYABLE BY CUSTOMER TO HARLO AI LLC FOR THE SERVICE DURING THE TWELVE (12) MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM, OR ONE HUNDRED DOLLARS ($100) IF CUSTOMER HAS NOT PAID HARLO AI LLC DURING THAT PERIOD."
    ]
  },
  {
    title: "8. Confidentiality",
    subsections: [
      {
        title: "8.1 Definition",
        body: [
          "Each party may disclose business, technical, financial, product, security, customer, or operational information that is reasonably understood to be confidential based on its nature or the circumstances of disclosure (\"Confidential Information\").",
          "Harlo AI LLC's Confidential Information includes non-public information about the Service, Harlo Materials, product roadmap, security practices, pricing, performance, and technology. Customer's Confidential Information includes non-public User Submissions and User Information. Confidential Information does not include information that is publicly available without breach, already known without duty of confidentiality, received from a third party without breach, or independently developed without use of Confidential Information."
        ]
      },
      {
        title: "8.2 Protection and Use of Confidential Information",
        body: [
          "The receiving party will protect the disclosing party's Confidential Information using at least reasonable care and will use it only to perform under this Agreement or exercise rights permitted by this Agreement.",
          "The receiving party may disclose Confidential Information only to personnel, affiliates, contractors, advisors, service providers, or representatives who need to know it for purposes related to this Agreement and who are bound by confidentiality obligations at least as protective as those in this Agreement."
        ]
      },
      {
        title: "8.3 Compelled Access or Disclosure",
        body: [
          "The receiving party may disclose Confidential Information if required by law, subpoena, court order, or governmental request, provided it gives the disclosing party advance notice when legally permitted and reasonable assistance if the disclosing party seeks to contest or limit the disclosure."
        ]
      },
      {
        title: "8.4 Feedback",
        body: [
          "Customer may provide suggestions, ideas, requests, comments, or other feedback about the Service (\"Feedback\"). Customer grants Harlo AI LLC a worldwide, perpetual, irrevocable, royalty-free, transferable, and sublicensable license to use, disclose, reproduce, modify, create derivative works from, distribute, display, and otherwise exploit Feedback without restriction or obligation to Customer, provided Harlo AI LLC does not identify Customer as the source of Feedback without permission."
        ]
      }
    ]
  },
  {
    title: "9. Data",
    subsections: [
      {
        title: "9.1 User Information",
        body: [
          "Customer and Users may provide account, login, profile, workspace, billing, device, browser, IP address, usage, and related information to access and use the Service (\"User Information\"). Customer authorizes Harlo AI LLC and its service providers to store, process, transmit, and retrieve User Information to provide, secure, support, and improve the Service.",
          "Customer represents that it has all rights and notices needed to provide User Information to Harlo AI LLC. Customer is responsible for the accuracy of User Information and for unauthorized use of its credentials, accounts, and workspaces."
        ]
      },
      {
        title: "9.2 User Submissions",
        body: [
          "Customer grants Harlo AI LLC a non-exclusive, worldwide, royalty-free, transferable, and sublicensable license to host, copy, process, transmit, display, analyze, retrieve, and otherwise use User Submissions solely to provide, secure, support, maintain, and improve the Service for Customer and as otherwise described in this Agreement or the Privacy Policy.",
          "Customer retains ownership of its User Submissions. Customer is responsible for User Submissions, including website content, files, instructions, lead fields, visitor conversations, business information, and any personal information Customer or visitors provide through the Service."
        ]
      },
      {
        title: "9.3 Service Data",
        body: [
          "Harlo AI LLC may collect information about the performance, operation, usage, reliability, and security of the Service (\"Service Data\"). Harlo AI LLC may use Service Data to maintain, protect, analyze, improve, and develop the Service.",
          "Harlo AI LLC may use aggregated or de-identified Service Data for any lawful purpose, provided it does not identify Customer or Users as the source."
        ]
      },
      {
        title: "9.4 Data Protection",
        body: [
          "Harlo AI LLC maintains reasonable administrative, technical, and organizational safeguards designed to protect User Information and User Submissions. No online service can guarantee perfect security, and Customer is responsible for securing its systems, websites, credentials, and data.",
          "Harlo AI LLC processes personal information as described in the Privacy Policy. Customer is responsible for providing any privacy notices, cookie notices, consents, or legal bases required for its websites, visitors, leads, and Users."
        ]
      }
    ]
  },
  {
    title: "10. General Terms",
    subsections: [
      {
        title: "10.1 Publicity",
        body: [
          "Harlo AI LLC may identify Customer as a customer or use Customer's name, logo, trademarks, or service marks in marketing materials only with Customer's prior consent, except that Harlo AI LLC may use Customer's name as needed to provide support, billing, account management, or legally required notices."
        ]
      },
      {
        title: "10.2 Force Majeure",
        body: [
          "Harlo AI LLC will not be liable for delay or failure to perform caused by events beyond its reasonable control, including failures of hosting, telecommunications, utilities, payment processors, model providers, security providers, labor disruptions, natural disasters, war, terrorism, civil unrest, government action, internet disturbances, or other events outside Harlo AI LLC's reasonable control."
        ]
      },
      {
        title: "10.3 Changes",
        body: [
          "Harlo is an evolving subscription product, and Harlo AI LLC may modify, improve, discontinue, or change features from time to time. Harlo AI LLC will not materially reduce the core functionality of a paid subscription during the then-current Subscription Period without a reasonable business, legal, or security reason.",
          "Harlo AI LLC may update this Agreement from time to time. If changes are material, Harlo AI LLC will take reasonable steps to notify Customer, such as posting an updated version on the website, providing notice in the Service, or emailing the account contact. Continued use of the Service after changes take effect means Customer accepts the updated Agreement."
        ]
      },
      {
        title: "10.4 Relationship of the Parties",
        body: [
          "The parties are independent contractors. This Agreement does not create a partnership, franchise, joint venture, agency, fiduciary, or employment relationship between Harlo AI LLC and Customer."
        ]
      },
      {
        title: "10.5 No Third-Party Beneficiaries",
        body: [
          "This Agreement is for the benefit of Harlo AI LLC and Customer only and does not create rights for any third party, except as expressly stated in this Agreement."
        ]
      },
      {
        title: "10.6 Email Communications",
        body: [
          "Harlo AI LLC may provide notices by email, through the Service, through the billing portal, or by posting to the website. Notices to Harlo AI LLC must be sent to support@harloai.co unless Harlo AI LLC provides a different notice address. Email notices are deemed delivered on the next business day after sending, unless the sender receives a delivery failure notice."
        ]
      },
      {
        title: "10.7 Amendment and Waivers",
        body: [
          "Except for updates made under Section 10.3, amendments must be in writing and accepted by authorized representatives of both parties. A party's failure or delay in exercising a right is not a waiver. Waivers must be in writing and apply only to the specific instance identified."
        ]
      },
      {
        title: "10.8 Severability",
        body: [
          "If any provision of this Agreement is found unlawful or unenforceable, it will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions will remain in full force and effect."
        ]
      },
      {
        title: "10.9 Assignment",
        body: [
          "Customer may not assign or delegate this Agreement without Harlo AI LLC's prior written consent. Harlo AI LLC may assign or delegate this Agreement without consent in connection with a merger, acquisition, corporate reorganization, financing, sale of assets, or transfer of business. Any unauthorized assignment is void."
        ]
      },
      {
        title: "10.10 Governing Law and Venue",
        body: [
          "This Agreement is governed by the laws of the Commonwealth of Virginia, excluding conflict of law rules, unless applicable law requires otherwise. The parties consent to the exclusive jurisdiction and venue of the state and federal courts located in Virginia for disputes arising out of or relating to this Agreement, and each party waives any right to a jury trial to the fullest extent permitted by law.",
          "The prevailing party in an action to enforce this Agreement may recover reasonable costs and attorneys' fees to the extent permitted by law."
        ]
      },
      {
        title: "10.11 Entire Agreement",
        body: [
          "This Agreement, together with any applicable Orders, policies, and documents expressly referenced in it, is the entire agreement between Harlo AI LLC and Customer regarding the Service and supersedes all prior or contemporaneous agreements, discussions, and understandings about the Service."
        ]
      }
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
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink">Harlo AI LLC Terms of Service</h1>
        <p className="mt-4 text-sm text-harlo-muted">Last updated May 19, 2026</p>

        <div className="mt-8 space-y-8 rounded-lg border border-harlo-line bg-white p-6 text-sm leading-7 text-harlo-muted shadow-sm sm:p-8">
          {introParagraphs.map((paragraph) => (
            <p key={paragraph} className="font-medium text-harlo-ink">
              {paragraph}
            </p>
          ))}
          <aside className="rounded-lg border border-harlo-blue/20 bg-harlo-blue/5 p-5">
            <p className="font-semibold text-harlo-ink">Service providers and subprocessors</p>
            <p className="mt-2">
              Harlo uses selected providers to operate the Service. Review their purposes and the categories of data they process on our{" "}
              <Link href={"/subprocessors" as Route} className="font-semibold text-harlo-blue transition hover:text-harlo-teal">
                Subprocessors page
              </Link>
              .
            </p>
          </aside>
          {sections.map((section) => (
            <section key={section.title} className="border-t border-harlo-line pt-6 first:border-t-0 first:pt-0">
              <h2 className="text-lg font-semibold text-harlo-ink">{section.title}</h2>
              <div className="mt-3 space-y-5">
                {section.body?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.subsections?.map((subsection) => (
                  <section key={subsection.title} className="space-y-3">
                    <h3 className="text-base font-semibold text-harlo-ink">{subsection.title}</h3>
                    {subsection.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </section>
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
