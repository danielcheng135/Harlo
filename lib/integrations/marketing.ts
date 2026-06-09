export type MarketingIntegration = {
  key: string;
  name: string;
  category: string;
  description: string;
  action: string;
  logoUrl: string;
  docsHref: string;
  accentClass: string;
};

export const MARKETING_INTEGRATIONS = [
  {
    key: "calendly",
    name: "Calendly",
    category: "Scheduling",
    description: "Offer the right event type when a visitor is ready to book.",
    action: "Show booking link",
    logoUrl: "https://www.google.com/s2/favicons?domain=calendly.com&sz=128",
    docsHref: "/docs/integrations/calendly",
    accentClass: "bg-sky-50 text-sky-700"
  },
  {
    key: "calcom",
    name: "Cal.com",
    category: "Scheduling",
    description: "Route scheduling intent into selected Cal.com event types.",
    action: "Open scheduler",
    logoUrl: "https://www.google.com/s2/favicons?domain=cal.com&sz=128",
    docsHref: "/docs/integrations/calcom",
    accentClass: "bg-slate-100 text-slate-800"
  },
  {
    key: "jobber",
    name: "Jobber",
    category: "Service operations",
    description: "Turn qualified service conversations into a Jobber handoff.",
    action: "Create client request",
    logoUrl: "https://www.google.com/s2/favicons?domain=getjobber.com&sz=128",
    docsHref: "/docs/integrations/jobber",
    accentClass: "bg-lime-50 text-lime-700"
  },
  {
    key: "slack",
    name: "Slack",
    category: "Team alerts",
    description: "Send captured leads and conversation context to your team.",
    action: "Post lead alert",
    logoUrl: "/slack-logo.svg",
    docsHref: "/docs/integrations/slack",
    accentClass: "bg-fuchsia-50 text-fuchsia-700"
  },
  {
    key: "hubspot",
    name: "HubSpot",
    category: "CRM",
    description: "Create or update CRM contacts from qualified Harlo leads.",
    action: "Sync CRM contact",
    logoUrl: "https://www.google.com/s2/favicons?domain=hubspot.com&sz=128",
    docsHref: "/docs/integrations/hubspot",
    accentClass: "bg-orange-50 text-orange-700"
  },
  {
    key: "mailchimp",
    name: "Mailchimp",
    category: "Audience sync",
    description: "Add captured contacts to the audience selected by your team.",
    action: "Add to audience",
    logoUrl: "https://www.google.com/s2/favicons?domain=mailchimp.com&sz=128",
    docsHref: "/docs/integrations/mailchimp",
    accentClass: "bg-amber-50 text-amber-800"
  },
  {
    key: "google_sheets",
    name: "Google Sheets",
    category: "Lead export",
    description: "Append every lead field and question to a structured row.",
    action: "Append lead row",
    logoUrl: "/google-sheets-logo.svg",
    docsHref: "/docs/integrations/google-sheets",
    accentClass: "bg-emerald-50 text-emerald-700"
  }
] as const satisfies readonly MarketingIntegration[];
