import {
  Activity,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  Code2,
  Contact,
  Filter,
  FileSpreadsheet,
  Inbox,
  LayoutPanelLeft,
  Library,
  Megaphone,
  MessageSquareText,
  MonitorCheck,
  Plug,
  Route,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users
} from "lucide-react";

export type DocId = "widget" | "builder" | "knowledge" | "conversations" | "leads" | "analytics" | "integrations" | "team";

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

export type IntegrationDocId = "calendly" | "calcom" | "jobber" | "slack" | "hubspot" | "mailchimp" | "google-sheets";

export type IntegrationDoc = {
  id: IntegrationDocId;
  name: string;
  slug: string;
  path: string;
  eyebrow: string;
  description: string;
  icon: typeof Sparkles;
  logoUrl?: string;
  accentClass: string;
  actionLabel: string;
  triggerLabel: string;
  outcomeLabel: string;
  bestFor: string[];
  setupSteps: { title: string; body: string }[];
  requiredFields: { label: string; detail: string }[];
  testSteps: string[];
  troubleshooting: { title: string; body: string }[];
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
    id: "integrations",
    slug: "integrations",
    path: "/docs/integrations",
    title: "Connect and configure Integrations",
    label: "Integrations",
    eyebrow: "Connected actions",
    description: "Connect Calendly, Cal.com, Jobber, Slack, HubSpot, Mailchimp, and Google Sheets so Harlo can schedule meetings, notify your team, create CRM records, and export captured leads.",
    icon: Plug,
    dashboardHref: "/dashboard/integrations",
    highlights: ["OAuth setup", "Agent selection", "Lead actions", "Scheduling", "CRM and exports"],
    nextChecks: [
      { icon: Plug, text: "Confirm the provider is connected and shows the expected account or workspace." },
      { icon: Bot, text: "Choose exactly which Harlo widget agents can use the integration action." },
      { icon: CheckCircle2, text: "Run a realistic lead capture or booking test before relying on the integration in production." }
    ],
    steps: [
      { title: "Open Integrations", body: "Go to Dashboard -> Integrations. The page shows all available providers, connection status, configured actions, last successful run, and recent integration errors." },
      { title: "Connect a provider", body: "Choose Connect on the provider card and complete the provider's OAuth flow. Harlo stores encrypted credentials and returns you to the Integrations page when the provider authorizes successfully." },
      { title: "Configure the action", body: "Expand Configure on the connected provider. Select the widget agents that should use the action, set the success and fallback messages visitors may see, and complete any provider-specific fields such as event types, Slack channel ID, Mailchimp audience, or Google Sheets target." },
      { title: "Save and test", body: "Save the configuration, then test from the widget with a realistic visitor question. For booking integrations, ask to schedule. For lead integrations, complete lead capture with the fields your team expects." },
      { title: "Monitor results", body: "Review the provider card for last success, last error, and configured actions. Captured leads, conversations, and integration run history help confirm whether the action completed or failed." }
    ],
    details: [
      { title: "Workspace connection", body: "Connect the provider once from Dashboard -> Integrations. Harlo stores encrypted OAuth credentials and shows the connected account, status, last successful run, and recent integration errors on the provider card." },
      { title: "Agent-level enablement", body: "After a provider is connected, choose which widget agents can use it. This lets sales, support, operations, and service agents trigger different actions without sending every lead to every provider." },
      { title: "Success and fallback messages", body: "Each provider action has a success message and fallback message. Use these to tell visitors what happened when Harlo offers a booking link, creates a record, posts a notification, or cannot complete the action automatically." },
      { title: "Provider-specific pages", body: "Use the integration cards below for detailed setup, required fields, testing instructions, and troubleshooting notes for each provider." }
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

export const integrationDocs: IntegrationDoc[] = [
  {
    id: "calendly",
    name: "Calendly",
    slug: "calendly",
    path: "/docs/integrations/calendly",
    eyebrow: "Scheduling",
    description: "Let Harlo offer Calendly booking links when a visitor asks to schedule a meeting, consultation, demo, estimate, or follow-up call.",
    icon: CalendarDays,
    logoUrl: "https://www.google.com/s2/favicons?domain=calendly.com&sz=128",
    accentClass: "from-sky-500 to-blue-600",
    actionLabel: "Show booking link",
    triggerLabel: "Booking requested",
    outcomeLabel: "Visitor chooses a Calendly event",
    bestFor: ["Sales demos", "Consultations", "Service estimates", "Support calls"],
    setupSteps: [
      { title: "Connect Calendly", body: "Open Dashboard -> Integrations, choose Calendly, and complete OAuth with the Calendly account that owns the event types your visitors should book." },
      { title: "Select event types", body: "Expand Configure and select the active Calendly event types Harlo may show. Choose only the meetings that make sense for the selected agents." },
      { title: "Choose agents", body: "Enable Calendly for the widget agents that should offer scheduling. A sales agent might offer demos while a support agent stays focused on answers." },
      { title: "Test booking intent", body: "Ask the widget a realistic scheduling question such as 'Can I book a demo?' and confirm the right Calendly options appear." }
    ],
    requiredFields: [
      { label: "Connected account", detail: "The Calendly account used in OAuth." },
      { label: "Event types", detail: "At least one active event type must be selected." },
      { label: "Widget agents", detail: "The agents that can offer selected booking links." }
    ],
    testSteps: [
      "Ask a visitor-style booking question from the live widget.",
      "Confirm Harlo offers the selected event type rather than starting lead capture too early.",
      "Open the Calendly link and verify the event name, duration, and availability look correct."
    ],
    troubleshooting: [
      { title: "No event types appear", body: "Confirm the connected Calendly account has active event types and reconnect if permissions changed." },
      { title: "Wrong event appears", body: "Return to Configure and deselect event types that should not be shown for that agent." },
      { title: "Booking link is not offered", body: "Confirm the conversation actually expresses scheduling intent and that the agent is selected in the Calendly configuration." }
    ]
  },
  {
    id: "calcom",
    name: "Cal.com",
    slug: "calcom",
    path: "/docs/integrations/calcom",
    eyebrow: "Scheduling",
    description: "Use Cal.com event types as booking options when Harlo detects that a visitor wants to schedule time with your team.",
    icon: CalendarDays,
    logoUrl: "https://www.google.com/s2/favicons?domain=cal.com&sz=128",
    accentClass: "from-slate-700 to-slate-950",
    actionLabel: "Show Cal.com scheduler",
    triggerLabel: "Booking requested",
    outcomeLabel: "Visitor chooses a Cal.com event",
    bestFor: ["Founder-led demos", "Team routing", "Consulting calls", "Intake sessions"],
    setupSteps: [
      { title: "Connect Cal.com", body: "Open Dashboard -> Integrations, choose Cal.com, and authorize Harlo with the Cal.com account that owns your event types." },
      { title: "Pick meeting types", body: "In Configure, select the event types Harlo can show to visitors. Keep this list focused so visitors are not overwhelmed." },
      { title: "Enable agents", body: "Choose which Harlo agents can offer Cal.com. Different agents can be enabled or disabled depending on their workflow." },
      { title: "Run a scheduling test", body: "Ask the widget to book, schedule, or talk to a person and verify that the expected Cal.com option appears." }
    ],
    requiredFields: [
      { label: "Connected account", detail: "The Cal.com account authorized through OAuth." },
      { label: "Event types", detail: "At least one active Cal.com event type." },
      { label: "Widget agents", detail: "The agents that should offer Cal.com." }
    ],
    testSteps: [
      "Ask for a meeting from the website widget.",
      "Confirm Harlo offers only the selected Cal.com options.",
      "Open the booking link and verify the event page is public and bookable."
    ],
    troubleshooting: [
      { title: "Event types are missing", body: "Make sure the event types are active and public in Cal.com, then reconnect or reload the integration configuration." },
      { title: "Visitors see too many choices", body: "Deselect event types that are not relevant to the agent or visitor journey." },
      { title: "No booking action appears", body: "Confirm the agent is enabled and the visitor message clearly asks to schedule." }
    ]
  },
  {
    id: "jobber",
    name: "Jobber",
    slug: "jobber",
    path: "/docs/integrations/jobber",
    eyebrow: "Service requests",
    description: "Send qualified service-business leads from Harlo into Jobber so your team can follow up on quote, job, and service requests.",
    icon: Contact,
    logoUrl: "https://www.google.com/s2/favicons?domain=getjobber.com&sz=128",
    accentClass: "from-emerald-500 to-teal-700",
    actionLabel: "Submit service request",
    triggerLabel: "Lead captured",
    outcomeLabel: "Jobber handoff is created",
    bestFor: ["Home services", "Quote requests", "Job intake", "Operations handoff"],
    setupSteps: [
      { title: "Connect Jobber", body: "Open Dashboard -> Integrations, choose Jobber, and authorize the Jobber account that should receive service-request handoffs." },
      { title: "Enable service agents", body: "Choose agents that collect job, estimate, service, or quote requests. Leave Jobber disabled for agents that should only answer FAQs." },
      { title: "Tune lead capture fields", body: "In Builder, ask for the fields your team needs before creating a useful Jobber handoff: name, email or phone, service need, location, timeline, and question." },
      { title: "Test a real request", body: "Complete a visitor conversation that asks for service and verify the Jobber record includes contact details and context." }
    ],
    requiredFields: [
      { label: "Contact method", detail: "Collect email or phone so the service team can follow up." },
      { label: "Service need", detail: "Ask what the visitor needs help with." },
      { label: "Location or address", detail: "Recommended for service-area and dispatch workflows." }
    ],
    testSteps: [
      "Ask the widget for an estimate or service appointment.",
      "Complete the configured lead fields.",
      "Check Jobber for the new customer or service-request style handoff."
    ],
    troubleshooting: [
      { title: "No record appears", body: "Confirm Jobber is connected, the agent is selected, and the conversation completed lead capture." },
      { title: "Missing contact details", body: "Update lead fields in Builder so Harlo asks for the details Jobber needs." },
      { title: "Permissions changed", body: "Reconnect Jobber if OAuth permissions were changed or revoked in Jobber." }
    ]
  },
  {
    id: "slack",
    name: "Slack",
    slug: "slack",
    path: "/docs/integrations/slack",
    eyebrow: "Team notifications",
    description: "Post lead capture notifications into Slack channels so sales, support, or operations can follow up where they already work.",
    icon: Send,
    logoUrl: "/slack-logo.svg",
    accentClass: "from-fuchsia-500 to-purple-800",
    actionLabel: "Lead capture notification",
    triggerLabel: "Lead captured",
    outcomeLabel: "Slack channel receives context",
    bestFor: ["Sales alerts", "Support escalation", "Founder feed", "Operations routing"],
    setupSteps: [
      { title: "Connect Slack", body: "Open Dashboard -> Integrations, choose Slack, and authorize Harlo in the workspace where lead notifications should be posted." },
      { title: "Add the channel ID", body: "Open Configure and paste the destination channel ID. Public channel IDs usually start with C; private channel IDs may start with G." },
      { title: "Invite Harlo to the channel", body: "In Slack, open the destination channel and type /invite @Harlo so the app can post there." },
      { title: "Choose agents and test", body: "Enable Slack for the agents that should notify the team, then complete a lead capture test from the website widget." }
    ],
    requiredFields: [
      { label: "Slack channel ID", detail: "The channel where Harlo should post lead notifications." },
      { label: "App membership", detail: "The Harlo app must be invited to the channel." },
      { label: "Lead fields", detail: "Collect useful contact details before notifying the team." }
    ],
    testSteps: [
      "Complete a lead capture conversation from the website widget.",
      "Confirm a message appears in the configured Slack channel.",
      "Verify the notification includes contact details, source page, and conversation context."
    ],
    troubleshooting: [
      { title: "Slack says channel not found", body: "Confirm the channel ID is correct and that Harlo was invited to the channel." },
      { title: "Private channel does not work", body: "Invite Harlo to the private channel before saving or testing the notification." },
      { title: "Wrong team gets alerts", body: "Use different agents or channel IDs for sales, support, and operations workflows." }
    ]
  },
  {
    id: "hubspot",
    name: "HubSpot",
    slug: "hubspot",
    path: "/docs/integrations/hubspot",
    eyebrow: "CRM contacts",
    description: "Create or update HubSpot contacts from captured Harlo leads so CRM follow-up has the visitor's details and context.",
    icon: Contact,
    logoUrl: "https://www.google.com/s2/favicons?domain=hubspot.com&sz=128",
    accentClass: "from-orange-400 to-red-600",
    actionLabel: "Create CRM contact",
    triggerLabel: "Lead captured",
    outcomeLabel: "HubSpot contact is created or updated",
    bestFor: ["Sales follow-up", "CRM timelines", "Lifecycle tracking", "Pipeline handoff"],
    setupSteps: [
      { title: "Connect HubSpot", body: "Open Dashboard -> Integrations, choose HubSpot, and authorize the HubSpot portal where Harlo should create or update contacts." },
      { title: "Enable sales agents", body: "Choose the Harlo agents whose captured leads should enter HubSpot." },
      { title: "Collect email when possible", body: "HubSpot works best when lead capture asks for email. Name, phone, question, and source page add helpful context." },
      { title: "Test with a unique email", body: "Submit a test lead with an email address you can identify, then confirm the HubSpot contact appears or updates." }
    ],
    requiredFields: [
      { label: "Email", detail: "Recommended for reliable CRM matching and contact creation." },
      { label: "Name", detail: "Helpful for human follow-up and CRM readability." },
      { label: "Conversation context", detail: "Included so your team understands what the visitor asked." }
    ],
    testSteps: [
      "Capture a lead with a unique test email.",
      "Open HubSpot and search for that email address.",
      "Confirm contact details and lead context were recorded."
    ],
    troubleshooting: [
      { title: "Contact is not created", body: "Confirm HubSpot is connected and the agent is enabled for the action." },
      { title: "Contact merged with an existing record", body: "HubSpot may update an existing contact with the same email. Test with a unique email when verifying setup." },
      { title: "Missing fields", body: "Update the agent's lead capture fields so Harlo collects the details your team wants in HubSpot." }
    ]
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    slug: "mailchimp",
    path: "/docs/integrations/mailchimp",
    eyebrow: "Audience sync",
    description: "Add captured Harlo leads to a selected Mailchimp audience for newsletters, nurture campaigns, or post-inquiry follow-up.",
    icon: Megaphone,
    logoUrl: "https://www.google.com/s2/favicons?domain=mailchimp.com&sz=128",
    accentClass: "from-yellow-400 to-amber-600",
    actionLabel: "Add lead to audience",
    triggerLabel: "Lead captured",
    outcomeLabel: "Mailchimp audience is updated",
    bestFor: ["Newsletter signup", "Lead nurture", "Post-demo follow-up", "Campaign lists"],
    setupSteps: [
      { title: "Connect Mailchimp", body: "Open Dashboard -> Integrations, choose Mailchimp, and authorize the account that owns the audience you want to update." },
      { title: "Choose an audience", body: "In Configure, select the Mailchimp audience. Harlo loads available audiences from the connected account when possible." },
      { title: "Require email capture", body: "Make sure the selected agents ask for email because Mailchimp needs an email address to add or update contacts." },
      { title: "Submit a test lead", body: "Complete a widget lead capture with a test email and confirm the contact appears in the chosen audience." }
    ],
    requiredFields: [
      { label: "Audience", detail: "The Mailchimp audience where Harlo should add captured leads." },
      { label: "Email", detail: "Required for Mailchimp contact creation or update." },
      { label: "Name fields", detail: "Recommended when you want personalized campaigns." }
    ],
    testSteps: [
      "Capture a lead with a test email address.",
      "Open the selected Mailchimp audience.",
      "Confirm the contact exists and includes the Harlo Lead tag or context where supported."
    ],
    troubleshooting: [
      { title: "Audience list is empty", body: "Confirm the connected Mailchimp account has audiences and reconnect if the account changed." },
      { title: "Lead is skipped", body: "Make sure lead capture collected an email address." },
      { title: "Wrong audience", body: "Return to Configure and select the correct audience before saving." }
    ]
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    slug: "google-sheets",
    path: "/docs/integrations/google-sheets",
    eyebrow: "Lead export",
    description: "Append captured Harlo leads to spreadsheet rows with columns for contact details, source context, and each configured lead capture question.",
    icon: FileSpreadsheet,
    logoUrl: "/google-sheets-logo.svg",
    accentClass: "from-emerald-500 to-green-700",
    actionLabel: "Append lead row",
    triggerLabel: "Lead captured",
    outcomeLabel: "Spreadsheet row is added",
    bestFor: ["Lightweight CRM", "Manual review", "Exports", "Ops handoff"],
    setupSteps: [
      { title: "Connect Google Sheets", body: "Open Dashboard -> Integrations, choose Google Sheets, and authorize the Google account Harlo should use to edit the sheet." },
      { title: "Paste the spreadsheet", body: "In Configure, paste the full Google Sheets URL or the spreadsheet ID from the URL." },
      { title: "Name the tab", body: "Choose a tab name such as Leads. Harlo creates the tab if it does not exist and writes headers." },
      { title: "Test lead capture", body: "Submit a test lead and confirm Harlo appends a row with contact details, source page, conversation summary, metadata, and the agent's lead fields." }
    ],
    requiredFields: [
      { label: "Spreadsheet ID or URL", detail: "The target Google spreadsheet." },
      { label: "Sheet tab name", detail: "The tab Harlo should create or append to." },
      { label: "Sheet access", detail: "The connected Google account must have edit access." }
    ],
    testSteps: [
      "Complete lead capture from the website widget.",
      "Open the configured spreadsheet and tab.",
      "Confirm headers exist and the new row includes each lead capture question as its own column."
    ],
    troubleshooting: [
      { title: "Unable to parse range", body: "Confirm the sheet tab name is valid and saved. Harlo creates the tab during configuration when the connected account has access." },
      { title: "No row appears", body: "Share the spreadsheet with the connected Google account and confirm the spreadsheet ID or URL is correct." },
      { title: "Missing lead field columns", body: "Save the integration again after updating the agent's lead capture questions so headers can refresh." }
    ]
  }
];

export function getDocBySlug(slug: string) {
  return docs.find((doc) => doc.slug === slug);
}

export function isDocId(value: string): value is DocId {
  return docs.some((doc) => doc.id === value);
}
