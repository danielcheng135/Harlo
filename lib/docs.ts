import {
  Activity,
  BarChart3,
  Bot,
  CheckCircle2,
  Code2,
  Filter,
  Inbox,
  LayoutPanelLeft,
  Library,
  MessageSquareText,
  MonitorCheck,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users
} from "lucide-react";

export type DocId = "widget" | "builder" | "knowledge" | "conversations" | "leads" | "analytics" | "team";

export type DocSection = {
  id: DocId;
  slug: string;
  path: string;
  title: string;
  label: string;
  eyebrow: string;
  description: string;
  icon: typeof Sparkles;
  dashboardHref: string;
  highlights: string[];
  nextChecks: { icon: typeof Sparkles; text: string }[];
  steps: { title: string; body: string }[];
  details: { title: string; body: string }[];
};

const appOrigin = normalizeWidgetOrigin(process.env.NEXT_PUBLIC_WIDGET_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://www.harloai.co");

export const workspaceSnippet = `<script src="${appOrigin}/widget.js" data-harlo-organization="YOUR_ORGANIZATION_ID" async></script>`;

function normalizeWidgetOrigin(origin: string) {
  const trimmed = origin.trim().replace(/\/$/, "");

  if (!trimmed) {
    return "https://www.harloai.co";
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";

    if (!isLocal) {
      url.protocol = "https:";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return `https://${trimmed.replace(/^https?:\/\//i, "")}`;
  }
}

export const docs: DocSection[] = [
  {
    id: "widget",
    slug: "widget-install",
    path: "/docs/widget-install",
    title: "Install the Harlo widget",
    label: "Widget install",
    eyebrow: "Getting started",
    description: "Add Harlo to your website so visitors can ask questions, get answers, and share their details when they want follow-up.",
    icon: Code2,
    dashboardHref: "/dashboard/widget",
    highlights: ["Website install", "No-code builders", "Allowed websites", "Page routing"],
    nextChecks: [
      { icon: Code2, text: "Use the exact install code from your Harlo dashboard." },
      { icon: Route, text: "Test the widget on the pages where customers are most likely to ask questions." },
      { icon: MonitorCheck, text: "Ask a real customer question from the live website." }
    ],
    steps: [
      { title: "Copy your install code", body: "Open Dashboard -> Widget and copy the install code for your whole website." },
      { title: "Add it to your website", body: "Paste the code into your website builder, footer area, or custom code section." },
      { title: "Approve your website", body: "Add your live website domain in Builder so Harlo knows where the widget is allowed to appear." },
      { title: "Test as a visitor", body: "Open your site, ask realistic customer questions, and confirm Harlo records conversations and leads correctly." }
    ],
    details: [
      { title: "WordPress", body: "Use a trusted header/footer plugin or your theme footer area, add the Harlo install code, then clear your site cache." },
      { title: "Wix", body: "Go to Settings -> Custom Code, add the Harlo install code, choose the pages where it should load, and publish." },
      { title: "Squarespace", body: "Use Settings -> Advanced -> Code Injection and add the Harlo install code in the Footer field." },
      { title: "Webflow", body: "Use Site settings -> Custom Code -> Footer Code, publish the site, then confirm Harlo appears on the right pages." },
      { title: "Shopify", body: "Open your theme code, add the Harlo install code near the end of the page, then test the storefront." },
      { title: "Framer", body: "Add the Harlo install code to Project Settings -> Custom Code, then publish." }
    ]
  },
  {
    id: "builder",
    slug: "builder",
    path: "/docs/builder",
    title: "Configure agents in Builder",
    label: "Builder",
    eyebrow: "Agent setup",
    description: "Use Builder to shape how your website agent sounds, looks, captures leads, and appears on the right pages.",
    icon: LayoutPanelLeft,
    dashboardHref: "/dashboard/builder",
    highlights: ["Agent role", "Widget styling", "Lead fields", "Route rules"],
    nextChecks: [
      { icon: Bot, text: "Preview the agent after changing its voice, greeting, or lead settings." },
      { icon: MessageSquareText, text: "Ask a buying-intent question to confirm lead capture feels natural." },
      { icon: Route, text: "Confirm important pages open the right agent for that part of your business." }
    ],
    steps: [
      { title: "Choose the agent", body: "Select the agent you want to customize for a service, location, product, or customer journey." },
      { title: "Define how it should help", body: "Set the agent name, tone, and instructions so responses sound like your business." },
      { title: "Set up lead capture", body: "Choose the details your team needs, such as name, email, phone, budget, timeline, or service request." },
      { title: "Preview before launch", body: "Test the greeting, suggested questions, styling, and lead capture flow before saving." }
    ],
    details: [
      { title: "Role tab", body: "Sets who the agent is, what it should help with, and how it should speak to visitors." },
      { title: "Widget tab", body: "Controls the title, greeting, color, logo, and suggested questions visitors see." },
      { title: "Leads tab", body: "Controls which customer details Harlo collects before your team follows up." },
      { title: "Routing tab", body: "Chooses which website pages should open this agent and which paths should hide the widget." }
    ]
  },
  {
    id: "knowledge",
    slug: "knowledge",
    path: "/docs/knowledge",
    title: "Manage Knowledge sources",
    label: "Knowledge",
    eyebrow: "Source of truth",
    description: "Give Harlo the business information it needs to answer customer questions accurately.",
    icon: Library,
    dashboardHref: "/dashboard/knowledge",
    highlights: ["Website URLs", "Files", "Manual text", "Knowledge test"],
    nextChecks: [
      { icon: Library, text: "Review each source to make sure Harlo has the right business information." },
      { icon: Search, text: "Ask the same questions your customers usually ask." },
      { icon: Activity, text: "Refresh sources after your website, pricing, services, or policies change." }
    ],
    steps: [
      { title: "Add business information", body: "Import website pages, upload files, or add manual notes for services, pricing, policies, FAQs, and approved answers." },
      { title: "Let Harlo process it", body: "Harlo prepares the information so your agents can use it in conversations." },
      { title: "Review what was captured", body: "Select a source to make sure the important details are available for answers." },
      { title: "Ask a test question", body: "Use Knowledge test to confirm Harlo answers from your published business information." }
    ],
    details: [
      { title: "Website sources", body: "Best for public pages like services, pricing, support pages, and FAQs." },
      { title: "File sources", body: "Best for PDFs, guides, policies, menus, catalogs, and service documents." },
      { title: "Manual text", body: "Best for short rules, special instructions, and approved answers." },
      { title: "Retraining", body: "Use retrain when a source changes and Harlo should refresh its answers." }
    ]
  },
  {
    id: "conversations",
    slug: "conversations",
    path: "/docs/conversations",
    title: "Review and respond to Conversations",
    label: "Conversations",
    eyebrow: "Inbox workflow",
    description: "Use Conversations to see what visitors asked, how Harlo answered, and whether your team needs to follow up.",
    icon: MessageSquareText,
    dashboardHref: "/dashboard/conversations",
    highlights: ["Inbox filters", "Chat transcript", "Answer quality", "Lead capture panel"],
    nextChecks: [
      { icon: Inbox, text: "Review conversations that need attention before marking them resolved." },
      { icon: Library, text: "Check which business information Harlo used for important answers." },
      { icon: UserPlus, text: "Open lead details when a visitor is ready for follow-up." }
    ],
    steps: [
      { title: "Filter the inbox", body: "Switch between Inbox, Needs review, Leads captured, and Resolved to focus on the right customer conversations." },
      { title: "Open a conversation", body: "Review what the visitor asked, which agent answered, and where the conversation came from." },
      { title: "Check answer context", body: "Use the right panel to see what business information supported the answer." },
      { title: "Follow up when needed", body: "Use captured contact details or open the related lead when your team should continue the conversation." }
    ],
    details: [
      { title: "Inbox", body: "Active or recent conversations your team may want to review." },
      { title: "Needs review", body: "Conversations where Harlo may not have had enough information or a human should inspect the answer." },
      { title: "Leads captured", body: "Chats where the visitor shared contact details for follow-up." },
      { title: "Resolved", body: "Conversations that are answered or no longer need attention." }
    ]
  },
  {
    id: "leads",
    slug: "leads",
    path: "/docs/leads",
    title: "Work captured Leads",
    label: "Leads",
    eyebrow: "Follow-up pipeline",
    description: "Use Leads to review visitors who shared their contact details and decide who your team should follow up with next.",
    icon: UserPlus,
    dashboardHref: "/dashboard/leads",
    highlights: ["Lead table", "Pipeline", "Activity", "CSV export"],
    nextChecks: [
      { icon: Filter, text: "Filter by stage or agent before reviewing or exporting leads." },
      { icon: MessageSquareText, text: "Open the conversation when your team needs more context." },
      { icon: CheckCircle2, text: "Move leads to Contacted once your team follows up." }
    ],
    steps: [
      { title: "Search and filter", body: "Filter by stage, source, agent, or search terms to find the leads your team should work next." },
      { title: "Open lead details", body: "Review contact details, source, last question, conversation count, and captured answers." },
      { title: "Move the stage", body: "Use New and Contacted to track whether your team has followed up." },
      { title: "Export or open chat", body: "Export filtered leads to CSV or jump into the source conversation for context." }
    ],
    details: [
      { title: "Table view", body: "Best for scanning many leads and selecting rows for review or export." },
      { title: "Pipeline view", body: "Best for seeing lead progress by stage." },
      { title: "Activity view", body: "Best for reviewing recent lead capture activity in chronological order." },
      { title: "Lead details", body: "Shows the information Harlo captured so your team can follow up with context." }
    ]
  },
  {
    id: "analytics",
    slug: "analytics",
    path: "/docs/analytics",
    title: "Understand Analytics",
    label: "Analytics",
    eyebrow: "Performance reporting",
    description: "Use Analytics to understand how visitors use Harlo, which questions they ask, and where your team can improve.",
    icon: BarChart3,
    dashboardHref: "/dashboard/analytics",
    highlights: ["Date range", "Agent filter", "Lead funnel", "Top questions"],
    nextChecks: [
      { icon: Filter, text: "Choose an agent and date range before reviewing performance." },
      { icon: BarChart3, text: "Compare conversations, leads, and response speed over time." },
      { icon: Search, text: "Use top questions to decide what business information to add next." }
    ],
    steps: [
      { title: "Choose scope", body: "Use the agent and date range controls to focus the report." },
      { title: "Read the top cards", body: "Track conversations, leads captured, response quality, average response time, and credit usage." },
      { title: "Review trends", body: "Use the charts to see how customer activity changes over time." },
      { title: "Find improvements", body: "Use top questions and answer sources to decide what business information to improve." }
    ],
    details: [
      { title: "Lead funnel", body: "Shows how many conversations became captured leads and how many were contacted." },
      { title: "Response quality", body: "Shows whether Harlo is giving complete, helpful answers." },
      { title: "Average response time", body: "Shows how quickly visitors usually receive a reply." },
      { title: "Top knowledge sources", body: "Shows which business information sources are most represented in Harlo." }
    ]
  },
  {
    id: "team",
    slug: "team",
    path: "/docs/team",
    title: "Manage Team access",
    label: "Team",
    eyebrow: "Workspace permissions",
    description: "Invite teammates, manage access, and make sure the right people can help run Harlo.",
    icon: Users,
    dashboardHref: "/dashboard/team",
    highlights: ["Seat capacity", "Invitations", "Members", "Admin access"],
    nextChecks: [
      { icon: Users, text: "Confirm available seats before inviting another teammate." },
      { icon: UserPlus, text: "Remove old pending invites if they are no longer needed." },
      { icon: ShieldCheck, text: "Keep owner/admin access limited to trusted teammates." }
    ],
    steps: [
      { title: "Check seats", body: "Review seats used, active members, pending invites, and remaining capacity before inviting someone." },
      { title: "Invite a teammate", body: "Send an invitation to the teammate's email address. Pending invites reserve seats." },
      { title: "Review pending invites", body: "Monitor invitations that have not been accepted yet and remove any that are no longer needed." },
      { title: "Remove access", body: "Remove members who should no longer manage the Harlo workspace." }
    ],
    details: [
      { title: "Owners", body: "Can manage billing, team access, and workspace settings." },
      { title: "Admins", body: "Can help manage day-to-day Harlo pages such as Builder, Knowledge, Conversations, Leads, Analytics, and Team." },
      { title: "Seat limits", body: "Extra seats can be added from Billing when the team needs more dashboard users." },
      { title: "Invite lifecycle", body: "An invite reserves capacity until accepted or removed." }
    ]
  }
];

export function getDocBySlug(slug: string) {
  return docs.find((doc) => doc.slug === slug);
}

export function isDocId(value: string): value is DocId {
  return docs.some((doc) => doc.id === value);
}
