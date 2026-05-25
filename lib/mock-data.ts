import {
  Activity,
  BarChart3,
  Bot,
  Code2,
  Grid2X2,
  LayoutDashboard,
  Library,
  MessageSquare,
  Sparkles,
  UserPlus,
  Users
} from "lucide-react";

export const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Builder", href: "/dashboard/builder", icon: Bot, adminOnly: true },
  { label: "Knowledge", href: "/dashboard/knowledge", icon: Library, adminOnly: true },
  { label: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
  { label: "Leads", href: "/dashboard/leads", icon: Users },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Team", href: "/dashboard/team", icon: UserPlus, adminOnly: true },
  { label: "Widget", href: "/dashboard/widget", icon: Code2, adminOnly: true },
  { label: "Integrations", href: "/dashboard/integrations", icon: Grid2X2, adminOnly: true }
] as const;

export const stats = [
  { label: "Conversations", value: "1,284", delta: "+18%", icon: MessageSquare },
  { label: "Lead captures", value: "96", delta: "+11%", icon: Users },
  { label: "Resolved by AI", value: "84%", delta: "+6%", icon: Sparkles },
  { label: "Knowledge health", value: "92%", delta: "Ready", icon: Activity }
];

export const sources = [
  { name: "Main website", type: "URL crawl", status: "Ready", pages: 42, updated: "2h ago" },
  { name: "Services guide.pdf", type: "PDF", status: "Ready", pages: 12, updated: "Yesterday" },
  { name: "Pricing FAQ", type: "Manual", status: "Review", pages: 8, updated: "3d ago" }
];

export const conversations = [
  {
    visitor: "Visitor from /pricing",
    question: "Do you offer weekend appointments?",
    status: "Answered",
    outcome: "Resolved"
  },
  {
    visitor: "Visitor from /services",
    question: "Can I get a quote for a commercial space?",
    status: "Lead captured",
    outcome: "Needs follow-up"
  },
  {
    visitor: "Visitor from /contact",
    question: "Are emergency visits available?",
    status: "Answered",
    outcome: "Resolved"
  }
];

export const chartBars = [44, 62, 58, 73, 69, 88, 81, 96, 104, 118, 132, 126];
