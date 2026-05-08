import type { Metadata } from "next";
import { BILLING_PLANS, formatPrice } from "@/lib/billing/plans";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://harlo-cuxmlvf3y-chickenbuttns-projects.vercel.app").replace(/\/$/, "");

export const siteConfig = {
  name: "Harlo",
  url: SITE_URL,
  title: "Harlo | AI Agent for Website Answers and Qualified Leads",
  description: "Harlo is an AI website chatbot and support agent that answers visitors instantly, captures qualified leads, and stays grounded in approved business knowledge.",
  ogImage: "/harlo-site-preview.svg",
  keywords: [
    "AI website chatbot",
    "AI agent for website support",
    "AI lead capture chatbot",
    "customer support chatbot for websites",
    "website chatbot for small business",
    "business AI chatbot"
  ]
} as const;

export const publicRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/ai-website-chatbot", priority: 0.9, changeFrequency: "weekly" },
  { path: "/ai-lead-capture-chatbot", priority: 0.9, changeFrequency: "weekly" },
  { path: "/customer-support-ai-agent", priority: 0.9, changeFrequency: "weekly" },
  { path: "/website-chatbot-for-small-business", priority: 0.85, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
  { path: "/privacy", priority: 0.35, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.35, changeFrequency: "yearly" }
] as const;

export type SeoLandingKey =
  | "aiWebsiteChatbot"
  | "aiLeadCaptureChatbot"
  | "customerSupportAiAgent"
  | "smallBusinessWebsiteChatbot"
  | "aiChatbotPricing";

export type SeoLandingPage = {
  path: string;
  badge: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  primaryCta: string;
  secondaryCta: string;
  sections: Array<{ title: string; body: string }>;
  comparison: Array<{ label: string; harlo: string; alternative: string }>;
  related: Array<{ label: string; href: string }>;
};

export const seoLandingPages: Record<SeoLandingKey, SeoLandingPage> = {
  aiWebsiteChatbot: {
    path: "/ai-website-chatbot",
    badge: "Website chatbot",
    title: "AI Website Chatbot for Instant Answers and Lead Capture | Harlo",
    description: "Launch an AI website chatbot that answers visitors from approved business knowledge, captures qualified leads, and installs with one snippet.",
    h1: "AI website chatbot for answers and qualified leads.",
    intro: "Harlo gives business websites an AI chatbot that learns approved pages, support docs, policies, and lead rules so visitors get useful answers before they bounce.",
    primaryCta: "Compare plans",
    secondaryCta: "See workflow",
    sections: [
      { title: "Answers grounded in your business", body: "Train Harlo on website pages, FAQs, policy docs, and internal notes so the chatbot answers from the same sources your team trusts." },
      { title: "Lead capture built into every conversation", body: "When a visitor needs follow-up, Harlo collects the right details and preserves the conversation context for your team." },
      { title: "A website widget your team can manage", body: "Customize the assistant voice, colors, greeting, lead fields, and escalation behavior from a simple dashboard." }
    ],
    comparison: [
      { label: "Setup", harlo: "One snippet plus approved knowledge sources", alternative: "Manual bot flows and developer-heavy configuration" },
      { label: "Answers", harlo: "Grounded in site content and support docs", alternative: "Generic AI replies or rigid FAQ matching" },
      { label: "Outcome", harlo: "Support automation and qualified lead handoff", alternative: "Chat transcripts without clear follow-up context" }
    ],
    related: []
  },
  aiLeadCaptureChatbot: {
    path: "/ai-lead-capture-chatbot",
    badge: "Lead capture",
    title: "AI Lead Capture Chatbot for Business Websites | Harlo",
    description: "Use Harlo to qualify website visitors, capture contact details, and hand your team conversation context before follow-up.",
    h1: "AI lead capture chatbot for better website follow-up.",
    intro: "Harlo turns helpful website conversations into clean lead records, so sales and support teams know what visitors asked, what they need, and how to follow up.",
    primaryCta: "View pricing",
    secondaryCta: "Explore outcomes",
    sections: [
      { title: "Qualify intent while answering questions", body: "Harlo can answer pricing, service, policy, and availability questions while identifying when a visitor is ready for a person." },
      { title: "Capture the details your team needs", body: "Configure lead fields for email, phone, timeline, service area, or any detail that makes handoff cleaner." },
      { title: "Keep the conversation history attached", body: "Every captured lead includes context from the chat, reducing cold follow-up and repeated discovery questions." }
    ],
    comparison: [
      { label: "Lead quality", harlo: "Conversation-aware qualification", alternative: "Static forms with limited intent context" },
      { label: "Follow-up", harlo: "Contact fields plus visitor questions", alternative: "Email-only capture with no transcript" },
      { label: "Routing", harlo: "Escalates when AI is not enough", alternative: "Every visitor gets the same form path" }
    ],
    related: []
  },
  customerSupportAiAgent: {
    path: "/customer-support-ai-agent",
    badge: "Support agent",
    title: "Customer Support AI Agent for Website Questions | Harlo",
    description: "Harlo is a customer support AI agent for websites that answers repeat questions from approved knowledge and routes moments that need a person.",
    h1: "Customer support AI agent for website questions.",
    intro: "Harlo helps growing teams answer repeat website questions instantly without pulling support, sales, or operations into every basic conversation.",
    primaryCta: "Start building",
    secondaryCta: "Compare plans",
    sections: [
      { title: "Reduce repetitive support work", body: "Let Harlo handle common questions about services, pricing, policies, availability, and next steps before a ticket is created." },
      { title: "Keep answers current and approved", body: "Use approved pages, docs, and workspace guidance as the source of truth for customer-facing replies." },
      { title: "Escalate with useful context", body: "When the AI cannot answer safely, Harlo can collect visitor details and route the conversation with the context your team needs." }
    ],
    comparison: [
      { label: "Support load", harlo: "Deflects repeat questions on the website", alternative: "Teams answer the same questions manually" },
      { label: "Knowledge", harlo: "Approved business sources", alternative: "Disconnected scripts and stale macros" },
      { label: "Escalation", harlo: "Context-rich handoff", alternative: "Generic contact forms or inbox forwarding" }
    ],
    related: []
  },
  smallBusinessWebsiteChatbot: {
    path: "/website-chatbot-for-small-business",
    badge: "Small business",
    title: "Website Chatbot for Small Business Support and Leads | Harlo",
    description: "A simple website chatbot for small businesses that answers customer questions, captures leads, and launches without a custom engineering project.",
    h1: "Website chatbot for small business teams.",
    intro: "Harlo gives lean teams a practical AI assistant for their website, built to answer customer questions and capture qualified leads without complex setup.",
    primaryCta: "Start free trial",
    secondaryCta: "See features",
    sections: [
      { title: "Launch without a big software project", body: "Install a lightweight snippet, connect website knowledge, and tune the assistant from one dashboard." },
      { title: "Answer more visitors after hours", body: "Give customers instant help when your team is busy, offline, or focused on higher-value work." },
      { title: "Grow into more automation", body: "Start with one assistant, then add credits, seats, agents, or branding controls as website traffic increases." }
    ],
    comparison: [
      { label: "Team fit", harlo: "Built for lean teams and growing traffic", alternative: "Enterprise suites with heavy configuration" },
      { label: "Launch path", harlo: "No-code setup with one website snippet", alternative: "Custom development or brittle plugins" },
      { label: "Lead capture", harlo: "Built-in qualification and handoff", alternative: "Separate forms and manual follow-up" }
    ],
    related: []
  },
  aiChatbotPricing: {
    path: "/pricing",
    badge: "Pricing",
    title: "AI Chatbot Pricing for Website Support and Lead Capture | Harlo",
    description: "Compare Harlo AI chatbot pricing for website support, lead capture, message credits, seats, and add-ons.",
    h1: "AI chatbot pricing that scales with website conversations.",
    intro: "Harlo pricing is designed around real website usage: message credits, included seats, lead capture, analytics, and add-ons as your workspace grows.",
    primaryCta: "See plans",
    secondaryCta: "Compare features",
    sections: [
      { title: "Start with the plan that matches traffic", body: "Starter covers small teams, Growth supports steady website volume, and Pro adds higher message capacity and priority support." },
      { title: "Understand what you are paying for", body: "Plans include message credits, lead capture, dashboard access, analytics, and an AI assistant trained on your approved knowledge." },
      { title: "Add capacity only when needed", body: "Use add-ons for auto-recharge credits, extra assistants, more seats, or removing Harlo branding." }
    ],
    comparison: [
      { label: "Starter", harlo: "$39/month for 500 message credits", alternative: "Best for one chatbot and small teams" },
      { label: "Growth", harlo: "$129/month for 4,000 message credits", alternative: "Best for steady traffic and automation" },
      { label: "Pro", harlo: "$399/month for 15,000 message credits", alternative: "Best for higher volume and priority support" }
    ],
    related: []
  }
};

export function createPageMetadata(page: SeoLandingPage): Metadata {
  return {
    title: {
      absolute: page.title
    },
    description: page.description,
    alternates: {
      canonical: page.path
    },
    keywords: [...siteConfig.keywords],
    openGraph: {
      title: page.title,
      description: page.description,
      url: page.path,
      siteName: siteConfig.name,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 760, alt: "Harlo AI website chatbot product preview" }],
      locale: "en_US",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [siteConfig.ogImage]
    }
  };
}

export function homeJsonLd() {
  const offers = BILLING_PLANS.map((plan) => ({
    "@type": "Offer",
    name: `${plan.name} plan`,
    price: plan.monthlyPrice,
    priceCurrency: "USD",
    category: "subscription",
    url: `${siteConfig.url}/pricing`,
    description: `${formatPrice(plan.monthlyPrice)} per month for ${plan.features.join(", ")}.`
  }));

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/icon.svg`,
      description: siteConfig.description
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteConfig.url,
      description: siteConfig.description,
      offers
    }
  ];
}
