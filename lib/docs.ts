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

export type WidgetInstallPlatformId = "wordpress" | "wix" | "squarespace" | "webflow" | "shopify" | "framer";

export type WidgetInstallDoc = {
  id: WidgetInstallPlatformId;
  name: string;
  slug: string;
  path: string;
  eyebrow: string;
  description: string;
  logoUrl: string;
  accentClass: string;
  sourceHref: string;
  sourceLabel: string;
  bestFor: string[];
  beforeYouStart: string[];
  steps: { title: string; body: string; details?: string[] }[];
  verifySteps: string[];
  troubleshooting: { title: string; body: string }[];
};

const appOrigin = normalizeWidgetOrigin(process.env.NEXT_PUBLIC_WIDGET_ORIGIN ?? "https://www.harloai.co");

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
      { title: "WordPress", body: "Use the WordPress guide when you want a plugin-based install through WPCode or a similar header/footer manager." },
      { title: "Wix", body: "Use the Wix guide to add Harlo from Dashboard -> Settings -> Custom Code and place it at the end of the body." },
      { title: "Squarespace", body: "Use the Squarespace guide to paste Harlo in the Code Injection Footer field so it loads across the site." },
      { title: "Webflow", body: "Use the Webflow guide for site-level Footer Code, or page-level custom code when only a few pages need Harlo." },
      { title: "Shopify", body: "Use the Shopify guide to place Harlo above the closing body tag in theme.liquid after duplicating the live theme." },
      { title: "Framer", body: "Use the Framer guide to add Harlo from Project Settings -> Custom Code and publish the site." }
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

export const widgetInstallDocs: WidgetInstallDoc[] = [
  {
    id: "wordpress",
    name: "WordPress",
    slug: "wordpress",
    path: "/docs/widget-install/wordpress",
    eyebrow: "Plugin-based install",
    description: "Add Harlo to WordPress with a simple plugin, then check the live site to make sure the chat button appears.",
    logoUrl: "https://www.google.com/s2/favicons?domain=wordpress.org&sz=128",
    accentClass: "from-sky-500 to-blue-700",
    sourceHref: "https://wpcode.com/docs/using-the-global-header-footer-settings/",
    sourceLabel: "WPCode Header & Footer docs",
    bestFor: ["WordPress.org", "Plugin-enabled WordPress.com", "Managed WordPress hosts"],
    beforeYouStart: [
      "Copy the Harlo install code from Dashboard -> Widget.",
      "Make sure you can add plugins or ask your website manager to do it.",
      "If your site uses caching, be ready to clear the cache after you save."
    ],
    steps: [
      {
        title: "Install WPCode",
        body: "Log in to WordPress. Go to Plugins, choose Add New, search for WPCode, install it, and activate it. If your website already has a header/footer code tool, you can use that instead."
      },
      {
        title: "Open the Header & Footer screen",
        body: "In the WordPress left menu, go to Code Snippets, then Header & Footer. This is where you can add code that loads on every public page."
      },
      {
        title: "Paste Harlo in the footer area",
        body: "Paste the full Harlo code into the Footer field. This places Harlo near the bottom of every public page, which is the safest spot for the chat widget.",
        details: [
          "Paste the whole snippet exactly as copied.",
          "Do not paste it into a blog post, page editor, or visual content block.",
          "Only add the Harlo snippet once."
        ]
      },
      {
        title: "Save and clear cache",
        body: "Save the WPCode settings. If your site has a cache plugin or hosting cache, clear it so visitors receive the newest version of the page."
      },
      {
        title: "Test the public site",
        body: "Open the public website in a private or incognito window. Wait for the page to load, then look for the Harlo chat button in the corner."
      }
    ],
    verifySteps: [
      "Visit the homepage and one high-intent page such as pricing, services, contact, or booking.",
      "Ask a normal customer question and confirm the conversation appears in Dashboard -> Conversations.",
      "If the widget is missing, check that the code was saved in WPCode and clear cache once more."
    ],
    troubleshooting: [
      { title: "The widget is not visible", body: "Clear the cache first. Then confirm the Harlo code is in the Footer field, not inside a page or post." },
      { title: "It appears while logged in but not for visitors", body: "Open the public site in an incognito window. Some WordPress cache tools show different pages to admins." },
      { title: "The snippet disappears after a theme update", body: "Keep Harlo in WPCode or another plugin-based code tool instead of editing theme files directly." }
    ]
  },
  {
    id: "wix",
    name: "Wix",
    slug: "wix",
    path: "/docs/widget-install/wix",
    eyebrow: "Dashboard custom code",
    description: "Add Harlo through Wix Custom Code, choose where it should appear, and publish the site.",
    logoUrl: "https://www.google.com/s2/favicons?domain=wix.com&sz=128",
    accentClass: "from-indigo-500 to-slate-950",
    sourceHref: "https://support.wix.com/en/article/wix-editor-embedding-custom-code-on-your-site",
    sourceLabel: "Wix Custom Code docs",
    bestFor: ["Wix Editor", "Wix Studio", "Sites with connected domains"],
    beforeYouStart: [
      "Copy the Harlo install code from Dashboard -> Widget.",
      "Make sure the Wix site is published and connected to the domain visitors use.",
      "Open the Wix dashboard for the site. The visual editor alone is not enough."
    ],
    steps: [
      {
        title: "Open Custom Code",
        body: "In the Wix dashboard, open Settings. Find Custom Code under Development & integrations."
      },
      {
        title: "Create a Harlo code snippet",
        body: "Click Add Custom Code. Paste the full Harlo code and name it Harlo widget so you can recognize it later."
      },
      {
        title: "Choose where Harlo loads",
        body: "Choose All pages if Harlo should appear throughout your website. If you only want it on certain pages, select those pages one by one.",
        details: [
          "Choose a body placement when Wix asks where the code should go.",
          "If Wix asks when the code should run, choose the option that runs when each page loads."
        ]
      },
      {
        title: "Place the code at Body - end",
        body: "Set Place Code in to Body - end. This helps Harlo load after the rest of the page."
      },
      {
        title: "Apply and publish",
        body: "Click Apply, then publish the site. Test the public website, not only the editor preview."
      }
    ],
    verifySteps: [
      "Open the published site in an incognito window.",
      "Move between two Wix pages and confirm the chat button stays available.",
      "Ask a test question and confirm the conversation appears in Harlo."
    ],
    troubleshooting: [
      { title: "Custom Code is unavailable", body: "Wix usually requires a published site with a connected domain before Custom Code is available." },
      { title: "The widget only appears on one page", body: "Reopen the Harlo snippet and confirm it is applied to All pages, or select every page where visitors should see it." },
      { title: "It works in preview but not live", body: "Publish again and test the connected domain. Wix editor previews can behave differently from the public site." }
    ]
  },
  {
    id: "squarespace",
    name: "Squarespace",
    slug: "squarespace",
    path: "/docs/widget-install/squarespace",
    eyebrow: "Footer code injection",
    description: "Install Harlo from Squarespace Code Injection so the chat widget loads on your published pages.",
    logoUrl: "https://www.google.com/s2/favicons?domain=squarespace.com&sz=128",
    accentClass: "from-neutral-700 to-black",
    sourceHref: "https://support.squarespace.com/hc/en-us/articles/205815908-Using-code-injection",
    sourceLabel: "Squarespace Code Injection docs",
    bestFor: ["Squarespace 7.1", "Business sites", "Commerce sites"],
    beforeYouStart: [
      "Copy the Harlo install code from Dashboard -> Widget.",
      "Confirm your Squarespace plan includes Code Injection.",
      "Decide whether Harlo should load site-wide or only on selected pages."
    ],
    steps: [
      {
        title: "Open Code Injection",
        body: "In Squarespace, open your website settings and find Code Injection."
      },
      {
        title: "Use the Footer field",
        body: "Paste the full Harlo code into the Footer field. This adds Harlo near the bottom of supported pages.",
        details: [
          "Do not paste Harlo into Custom CSS.",
          "Do not split the snippet into multiple fields.",
          "Squarespace checkout pages may not support injected code."
        ]
      },
      {
        title: "Save the site settings",
        body: "Click Save. Wait a moment for Squarespace to apply the change."
      },
      {
        title: "Check page-specific needs",
        body: "If only one page should show Harlo, use that page's advanced code injection area instead of the site-wide Footer field."
      },
      {
        title: "Test the live site",
        body: "Open the public website and confirm the Harlo chat button appears on the pages where customers ask questions."
      }
    ],
    verifySteps: [
      "Visit at least one normal content page and one conversion page.",
      "Ask a realistic customer question and confirm the response uses the right information.",
      "Check Dashboard -> Conversations for the test chat."
    ],
    troubleshooting: [
      { title: "Code Injection is missing", body: "Confirm your Squarespace plan includes Code Injection and that you are editing the correct site." },
      { title: "The widget appears on public pages but not checkout", body: "Squarespace does not support injected code on some checkout surfaces." },
      { title: "The widget loads twice", body: "Search site-wide and page-level injection fields for duplicate Harlo snippets and keep only one." }
    ]
  },
  {
    id: "webflow",
    name: "Webflow",
    slug: "webflow",
    path: "/docs/widget-install/webflow",
    eyebrow: "Site-level footer code",
    description: "Add Harlo through Webflow Site settings so it loads on the published site, or add it to only one page when needed.",
    logoUrl: "https://www.google.com/s2/favicons?domain=webflow.com&sz=128",
    accentClass: "from-blue-500 to-violet-700",
    sourceHref: "https://university.webflow.com/videos/page-site-level-code",
    sourceLabel: "Webflow page and site code docs",
    bestFor: ["Marketing sites", "CMS sites", "Landing pages"],
    beforeYouStart: [
      "Copy the Harlo install code from Dashboard -> Widget.",
      "Make sure the Webflow site has custom code available on its site plan.",
      "Decide whether Harlo should load site-wide or only on selected pages."
    ],
    steps: [
      {
        title: "Open Site settings",
        body: "From the Webflow dashboard, choose the site and open Site settings."
      },
      {
        title: "Go to Custom code",
        body: "Choose the Custom code tab. Use site-level custom code if Harlo should appear on every page."
      },
      {
        title: "Paste in Footer code",
        body: "Paste the full Harlo code into Footer code so it loads after the page content.",
        details: [
          "Use page-level custom code only if Harlo should appear on a specific page.",
          "Paste the snippet exactly as copied.",
          "Avoid placing the snippet inside a Designer embed element unless you only need Harlo on that one page area."
        ]
      },
      {
        title: "Save and publish",
        body: "Save the custom code changes and publish to staging or production. Webflow custom code usually needs a published page before it works fully."
      },
      {
        title: "Test route changes",
        body: "Open the live site, visit a few pages, and confirm the Harlo chat button stays available where expected."
      }
    ],
    verifySteps: [
      "Publish, then open the staging or production URL.",
      "Check a static page and a CMS page if the site uses CMS templates.",
      "Ask a test question and confirm it appears in Harlo."
    ],
    troubleshooting: [
      { title: "The widget is missing in Designer preview", body: "Publish to staging or production and test there. Some custom code does not fully run in the Designer." },
      { title: "CMS pages do not show Harlo", body: "Use site-level Footer code for all pages, or add the snippet to the CMS template's custom code area." },
      { title: "Only one page should have Harlo", body: "Move the snippet from Site settings to that page's custom code field." }
    ]
  },
  {
    id: "shopify",
    name: "Shopify",
    slug: "shopify",
    path: "/docs/widget-install/shopify",
    eyebrow: "Theme code install",
    description: "Place Harlo in your Shopify theme so it appears on the customer-facing storefront.",
    logoUrl: "https://www.google.com/s2/favicons?domain=shopify.com&sz=128",
    accentClass: "from-lime-500 to-emerald-700",
    sourceHref: "https://help.shopify.com/en/manual/online-store/themes/customizing-themes/edit-code/edit-theme-code",
    sourceLabel: "Shopify theme code docs",
    bestFor: ["Shopify storefronts", "Online Store 2.0 themes", "Service and product businesses"],
    beforeYouStart: [
      "Copy the Harlo install code from Dashboard -> Widget.",
      "Duplicate the live theme before editing, so you have a backup.",
      "Confirm you can edit the active theme's code. Some paid trial themes restrict code changes until purchased."
    ],
    steps: [
      {
        title: "Duplicate the current theme",
        body: "In Shopify admin, go to Online Store, then Themes. Open the menu for the live theme and duplicate it so you have a backup copy."
      },
      {
        title: "Open Edit code",
        body: "Open the theme menu again and choose Edit code."
      },
      {
        title: "Open theme.liquid",
        body: "In the Layout folder, open theme.liquid. This file controls the main storefront page layout."
      },
      {
        title: "Paste above the closing body tag",
        body: "Find the closing body tag near the bottom of the file and paste the full Harlo code directly above it.",
        details: [
          "Do not paste Harlo inside another script tag.",
          "Do not put the snippet inside a product, section, or cart template unless Harlo should only load there.",
          "Keep the duplicate theme until you have confirmed the widget works."
        ]
      },
      {
        title: "Save, preview, then publish",
        body: "Save the file, preview the theme, and publish the edited theme only after the chat button works correctly."
      }
    ],
    verifySteps: [
      "Open the storefront homepage and a product or service page.",
      "Confirm the launcher appears and does not cover key purchase controls.",
      "Ask a question and confirm Harlo records the conversation."
    ],
    troubleshooting: [
      { title: "Edit code is unavailable", body: "Confirm the theme is editable and not a paid trial theme that must be purchased before code changes." },
      { title: "The widget appears in preview but not live", body: "Publish the edited theme or repeat the install on the active theme after testing." },
      { title: "Theme updates remove Harlo", body: "Reapply the snippet after major theme updates, or ask support about a theme-app style install path." }
    ]
  },
  {
    id: "framer",
    name: "Framer",
    slug: "framer",
    path: "/docs/widget-install/framer",
    eyebrow: "Project custom code",
    description: "Add Harlo from Framer Project Settings with Custom Code, then publish and test the live site.",
    logoUrl: "https://www.google.com/s2/favicons?domain=framer.com&sz=128",
    accentClass: "from-pink-500 to-purple-700",
    sourceHref: "https://www.framer.com/help/articles/how-to-add-custom-code/",
    sourceLabel: "Framer Custom Code docs",
    bestFor: ["Framer marketing sites", "Portfolio sites", "Startup landing pages"],
    beforeYouStart: [
      "Copy the Harlo install code from Dashboard -> Widget.",
      "Open the Framer project where the live domain is managed.",
      "Decide whether Harlo should run on every page or only selected pages."
    ],
    steps: [
      {
        title: "Open Project Settings",
        body: "In Framer, open Project Settings for the website."
      },
      {
        title: "Open Custom Code",
        body: "Select Custom Code in the left sidebar, then create a new script with Add Script or the plus button."
      },
      {
        title: "Name and paste the script",
        body: "Name the script Harlo widget and paste the full Harlo code into the code field."
      },
      {
        title: "Choose placement and scope",
        body: "Place the script at the end of the body when that option is available. Select all pages unless Harlo should only appear on specific pages.",
        details: [
          "Choose Once for a normal chat widget install.",
          "If Harlo appears only on the first route after publish, switch the script to run on every page visit."
        ]
      },
      {
        title: "Publish and test",
        body: "Publish the site, open the live domain, and confirm the Harlo chat button appears after the page loads."
      }
    ],
    verifySteps: [
      "Open the published Framer domain, not only the canvas preview.",
      "Navigate between pages and confirm Harlo remains available.",
      "Ask a test question and confirm the chat appears in Harlo."
    ],
    troubleshooting: [
      { title: "The widget does not appear in preview", body: "Publish the site and test the public URL. Custom code is most reliable on published Framer pages." },
      { title: "It disappears after client-side navigation", body: "Change the script execution option from Once to Run on every page visit." },
      { title: "Only some pages should show Harlo", body: "Edit the custom code scope and select only the desired pages." }
    ]
  }
];

export function getWidgetInstallDocBySlug(slug: string) {
  return widgetInstallDocs.find((doc) => doc.slug === slug);
}

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
      { title: "Connect Google Sheets", body: "Open Dashboard -> Integrations, choose Google Sheets, and authorize the Google account Harlo should use for lead exports." },
      { title: "Choose the lead sheet", body: "In Configure, choose an existing spreadsheet with Google Picker or create a new Harlo-owned sheet. Harlo only receives access to the selected file." },
      { title: "Save the action", body: "Select the widget agents that should append rows, then save the configuration. Harlo stores the selected spreadsheet and tab." },
      { title: "Test lead capture", body: "Submit a test lead and confirm Harlo appends a row with contact details, source page, and the agent's lead fields." }
    ],
    requiredFields: [
      { label: "Selected spreadsheet", detail: "The Google spreadsheet created or explicitly authorized for Harlo." },
      { label: "Sheet tab name", detail: "The tab Harlo should create or append to." },
      { label: "Selected spreadsheet", detail: "The spreadsheet Harlo should use for captured lead rows." }
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
