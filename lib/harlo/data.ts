import { redirect } from "next/navigation";
import {
  Activity,
  BarChart3,
  Library,
  MessageSquare,
  Sparkles,
  Users
} from "lucide-react";
import {
  BILLING_ADD_ONS,
  getBillingPlan,
  getPlanCreditLimit,
  hasHigherTier,
  type AddOnKey,
  type BillingInterval,
  type BillingPlanKey,
  type BillingStatus
} from "@/lib/billing/plans";
import { normalizeLeadFields, normalizeLeadMetadata, type LeadCaptureField } from "@/lib/lead-fields";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export type Workspace = {
  user: {
    id: string;
    email: string | null;
  };
  organization: {
    id: string;
    name: string;
  };
  bot: {
    id: string;
    name: string;
    greeting: string;
    fallback_message: string;
    allowed_domains: string[];
    lead_capture_fields: LeadCaptureField[];
    widget_theme: {
      accent: string;
      launcher_position: "bottom-right" | "bottom-left";
      title: string;
      welcome_prompts: string[];
    };
  };
  role: string;
};

export type KnowledgeSourceRow = {
  id: string;
  name: string;
  source_type: string;
  status: string;
  created_at: string;
  metadata: Record<string, unknown>;
};

type KnowledgeChunkContentRow = {
  source_id: string;
  content: string;
  metadata: {
    chunk_index?: number;
  } | null;
};

export type ConversationRow = {
  id: string;
  visitor_id: string | null;
  page_url: string | null;
  created_at: string;
};

export type InboxMessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type InboxConversationRow = ConversationRow & {
  messages: InboxMessageRow[];
  lead: LeadRow | null;
  last_message_at: string;
  outcome: "Lead captured" | "Needs review" | "Answered";
};

export type LeadRow = {
  id: string;
  name: string;
  email: string;
  question: string;
  status: string;
  created_at: string;
  conversation_id?: string | null;
  metadata: {
    property_size?: string;
    preferred_date?: string;
    [key: string]: unknown;
  };
};

export type TeamMemberRow = {
  id: string;
  userId: string;
  email: string;
  role: string;
  joinedAt: string;
  isCurrentUser: boolean;
  canRemove: boolean;
};

export type TeamInvitationRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  inviteUrl: string;
  expiresAt: string;
  createdAt: string;
  canCancel: boolean;
};

export type TeamOverview = {
  members: TeamMemberRow[];
  invitations: TeamInvitationRow[];
  seatCapacity: BillingOverview["capacity"]["seats"];
  canInvite: boolean;
  canInviteAdmins: boolean;
};

export type BillingOverview = {
  planKey: BillingPlanKey;
  interval: BillingInterval;
  status: BillingStatus;
  trialStart: string | null;
  trialEnd: string | null;
  periodStart: string;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  creditsUsed: number;
  creditLimit: number;
  planCreditLimit: number;
  planCreditsUsed: number;
  addOnCreditsUsed: number;
  addOnCreditsAvailable: number;
  autoRechargeFailure: {
    reason: string;
    failedAt: string;
  } | null;
  activeCreditGrants: Array<{
    id: string;
    source: string;
    creditsGranted: number;
    creditsUsed: number;
    creditsRemaining: number;
    grantedAt: string;
    expiresAt: string;
  }>;
  percentUsed: number;
  hasHigherTier: boolean;
  plan: ReturnType<typeof getBillingPlan>;
  addOns: Array<{
    key: AddOnKey;
    name: string;
    enabled: boolean;
    quantity: number;
    price: number;
    unit: string;
    description: string;
  }>;
  capacity: {
    agents: {
      included: number;
      extra: number;
      used: number;
      limit: number;
      remaining: number;
    };
    seats: {
      included: number;
      extra: number;
      used: number;
      pending: number;
      limit: number;
      remaining: number;
    };
  };
};

export async function getWorkspaceOrRedirect(): Promise<Workspace> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/dashboard");
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const [{ data: organization }, { data: bot }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name")
      .eq("id", membership.organization_id)
      .single(),
    supabase
      .from("bots")
      .select("id, name, greeting, fallback_message, allowed_domains, lead_capture_fields, widget_themes(accent, launcher_position, title, welcome_prompts)")
      .eq("organization_id", membership.organization_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single()
  ]);

  if (!organization || !bot) {
    redirect("/onboarding");
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null
    },
    organization,
    bot: {
      id: bot.id,
      name: bot.name,
      greeting: bot.greeting,
      fallback_message: bot.fallback_message,
      allowed_domains: bot.allowed_domains ?? [],
      lead_capture_fields: normalizeLeadFields(bot.lead_capture_fields),
      widget_theme: normalizeWidgetTheme(bot.widget_themes)
    },
    role: membership.role
  };
}

export function isWorkspaceAdmin(role: string) {
  return role === "owner" || role === "admin";
}

export function requireWorkspaceAdmin(workspace: Workspace) {
  if (!isWorkspaceAdmin(workspace.role)) {
    redirect("/dashboard");
  }
}

function normalizeWidgetTheme(theme: unknown): Workspace["bot"]["widget_theme"] {
  const rawTheme = Array.isArray(theme) ? theme[0] : theme;
  const themeRecord = rawTheme && typeof rawTheme === "object" ? rawTheme as Record<string, unknown> : {};
  const launcherPosition = themeRecord.launcher_position === "bottom-left" ? "bottom-left" : "bottom-right";
  const welcomePrompts = Array.isArray(themeRecord.welcome_prompts)
    ? themeRecord.welcome_prompts.filter((prompt): prompt is string => typeof prompt === "string" && prompt.trim().length > 0)
    : [];

  return {
    accent: typeof themeRecord.accent === "string" ? themeRecord.accent : "#087f95",
    launcher_position: launcherPosition,
    title: typeof themeRecord.title === "string" ? themeRecord.title : "Ask Harlo",
    welcome_prompts: welcomePrompts.length > 0
      ? welcomePrompts
      : ["What services do you offer?", "How much does it cost?", "Can I book a consultation?"]
  };
}

export async function getDashboardStats(workspace: Workspace) {
  const supabase = await createSupabaseServerClient();

  const [conversationCount, leadCount, sourceCount, readySourceCount] = await Promise.all([
    getCount("conversations", workspace.organization.id),
    getCount("leads", workspace.organization.id),
    getCount("knowledge_sources", workspace.organization.id),
    supabase
      .from("knowledge_sources")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", workspace.organization.id)
      .eq("status", "ready")
  ]);

  const sourcesTotal = sourceCount;
  const sourcesReady = readySourceCount.count ?? 0;
  const knowledgeHealth = sourcesTotal > 0 ? Math.round((sourcesReady / sourcesTotal) * 100) : 0;

  return [
    { label: "Conversations", value: String(conversationCount), delta: "All time", icon: MessageSquare },
    { label: "Lead captures", value: String(leadCount), delta: "All time", icon: Users },
    { label: "Resolved by AI", value: conversationCount > 0 ? "84%" : "0%", delta: conversationCount > 0 ? "Estimated" : "No data yet", icon: Sparkles },
    { label: "Knowledge health", value: `${knowledgeHealth}%`, delta: sourcesTotal > 0 ? `${sourcesReady}/${sourcesTotal} ready` : "Add sources", icon: Activity }
  ];
}

export async function getBillingOverview(workspace: Workspace): Promise<BillingOverview> {
  const supabase = await createSupabaseServerClient();
  const service = createSupabaseServiceClient();
  const { data: billing } = await supabase
    .from("organization_billing")
    .select("plan_key, billing_interval, status, trial_start, trial_end, current_period_start, current_period_end, cancel_at_period_end")
    .eq("organization_id", workspace.organization.id)
    .maybeSingle();
  const fallbackPeriod = getFallbackBillingPeriod();
  const planKey = normalizePlanKey(billing?.plan_key);
  const status = normalizeBillingStatus(billing?.status);
  const interval = normalizeBillingInterval(billing?.billing_interval);
  const periodStart = typeof billing?.current_period_start === "string" ? billing.current_period_start : fallbackPeriod.start;
  const periodEnd = typeof billing?.current_period_end === "string" ? billing.current_period_end : fallbackPeriod.end;
  const planCreditLimit = getPlanCreditLimit(planKey, status);

  const [
    { data: usageEvents },
    { data: grantUsages },
    { data: creditGrants },
    { data: addOnRows },
    botCount,
    memberCount,
    pendingInviteCount
  ] = await Promise.all([
    supabase
      .from("usage_events")
      .select("credits")
      .eq("organization_id", workspace.organization.id)
      .eq("event_type", "assistant_message")
      .gte("created_at", periodStart)
      .lt("created_at", periodEnd),
    supabase
      .from("credit_grant_usages")
      .select("credits")
      .eq("organization_id", workspace.organization.id)
      .gte("created_at", periodStart)
      .lt("created_at", periodEnd),
    supabase
      .from("credit_grants")
      .select("id, source, credits_granted, credits_used, granted_at, expires_at")
      .eq("organization_id", workspace.organization.id)
      .gt("expires_at", new Date().toISOString()),
    supabase
      .from("organization_add_ons")
      .select("add_on_key, enabled, quantity, metadata")
      .eq("organization_id", workspace.organization.id),
    getServiceCount(service, "bots", workspace.organization.id),
    getServiceCount(service, "memberships", workspace.organization.id),
    getPendingInvitationCount(service, workspace.organization.id)
  ]);
  const creditsUsed = ((usageEvents ?? []) as Array<{ credits: number }>).reduce((total, event) => total + event.credits, 0);
  const addOnCreditsUsed = ((grantUsages ?? []) as Array<{ credits: number }>).reduce((total, event) => total + event.credits, 0);
  const activeCreditGrants = ((creditGrants ?? []) as Array<{
    id: string;
    source: string;
    credits_granted: number;
    credits_used: number;
    granted_at: string;
    expires_at: string;
  }>).map((grant) => ({
    id: grant.id,
    source: grant.source,
    creditsGranted: grant.credits_granted,
    creditsUsed: grant.credits_used,
    creditsRemaining: Math.max(0, grant.credits_granted - grant.credits_used),
    grantedAt: grant.granted_at,
    expiresAt: grant.expires_at
  }));
  const addOnCreditsAvailable = activeCreditGrants.reduce((total, grant) => total + grant.creditsRemaining, 0);
  const planCreditsUsed = Math.max(0, creditsUsed - addOnCreditsUsed);
  const creditLimit = planCreditLimit + addOnCreditsUsed + addOnCreditsAvailable;
  const addOnsByKey = new Map(
    ((addOnRows ?? []) as Array<{ add_on_key: AddOnKey; enabled: boolean; quantity: number; metadata?: Record<string, unknown> | null }>).map((row) => [row.add_on_key, row])
  );
  const autoRechargeRow = addOnsByKey.get("auto_recharge_credits");
  const extraAgentQuantity = getEnabledAddOnQuantity(addOnsByKey.get("extra_agent"));
  const extraSeatQuantity = getEnabledAddOnQuantity(addOnsByKey.get("extra_seat"));
  const agentLimit = getBillingPlan(planKey).includedAgents + extraAgentQuantity;
  const seatLimit = getBillingPlan(planKey).seats + extraSeatQuantity;
  const autoRechargeMetadata = isRecord(autoRechargeRow?.metadata) ? autoRechargeRow.metadata : {};
  const autoRechargeFailure = autoRechargeRow?.enabled === true &&
    typeof autoRechargeMetadata.last_failure_reason === "string" &&
    typeof autoRechargeMetadata.last_failed_at === "string"
      ? {
        reason: autoRechargeMetadata.last_failure_reason,
        failedAt: autoRechargeMetadata.last_failed_at
      }
      : null;

  return {
    planKey,
    interval,
    status,
    trialStart: typeof billing?.trial_start === "string" ? billing.trial_start : null,
    trialEnd: typeof billing?.trial_end === "string" ? billing.trial_end : null,
    periodStart,
    periodEnd,
    cancelAtPeriodEnd: billing?.cancel_at_period_end === true,
    creditsUsed,
    creditLimit,
    planCreditLimit,
    planCreditsUsed,
    addOnCreditsUsed,
    addOnCreditsAvailable,
    autoRechargeFailure,
    activeCreditGrants,
    percentUsed: creditLimit > 0 ? Math.min(100, Math.round((creditsUsed / creditLimit) * 100)) : 0,
    hasHigherTier: hasHigherTier(planKey),
    plan: getBillingPlan(planKey),
    addOns: BILLING_ADD_ONS.map((addOn) => {
      const row = addOnsByKey.get(addOn.key);

      return {
        ...addOn,
        enabled: row?.enabled ?? false,
        quantity: row?.quantity ?? 0
      };
    }),
    capacity: {
      agents: {
        included: getBillingPlan(planKey).includedAgents,
        extra: extraAgentQuantity,
        used: botCount,
        limit: agentLimit,
        remaining: Math.max(0, agentLimit - botCount)
      },
      seats: {
        included: getBillingPlan(planKey).seats,
        extra: extraSeatQuantity,
        used: memberCount,
        pending: pendingInviteCount,
        limit: seatLimit,
        remaining: Math.max(0, seatLimit - memberCount - pendingInviteCount)
      }
    }
  };
}

function getEnabledAddOnQuantity(row: { enabled: boolean; quantity: number } | undefined) {
  return row?.enabled ? Math.max(0, row.quantity ?? 0) : 0;
}

export async function getTeamOverview(workspace: Workspace, billing: BillingOverview): Promise<TeamOverview> {
  const service = createSupabaseServiceClient();
  const [{ data: memberships }, { data: invitations }] = await Promise.all([
    service
      .from("memberships")
      .select("id, user_id, role, created_at")
      .eq("organization_id", workspace.organization.id)
      .order("created_at", { ascending: true }),
    service
      .from("team_invitations")
      .select("id, email, role, status, token, expires_at, created_at")
      .eq("organization_id", workspace.organization.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
  ]);

  const memberRows = (memberships ?? []) as Array<{ id: string; user_id: string; role: string; created_at: string }>;
  const memberEmails = await Promise.all(memberRows.map(async (member) => {
    const { data } = await service.auth.admin.getUserById(member.user_id);

    return data.user?.email ?? "Unknown user";
  }));
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return {
    members: memberRows.map((member, index) => ({
      id: member.id,
      userId: member.user_id,
      email: memberEmails[index] ?? "Unknown user",
      role: member.role,
      joinedAt: member.created_at,
      isCurrentUser: member.user_id === workspace.user.id,
      canRemove: canManageMember(workspace.role, member.role, member.user_id === workspace.user.id)
    })),
    invitations: ((invitations ?? []) as Array<{ id: string; email: string; role: string; status: string; token: string; expires_at: string; created_at: string }>).map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      inviteUrl: `${appUrl}/invite/${invitation.token}`,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
      canCancel: canManageInvite(workspace.role, invitation.role)
    })),
    seatCapacity: billing.capacity.seats,
    canInvite: workspace.role === "owner" || workspace.role === "admin",
    canInviteAdmins: workspace.role === "owner"
  };
}

export async function getMonthlyCreditUsage(workspace: Workspace) {
  const overview = await getBillingOverview(workspace);
  const periodStart = new Date(overview.periodStart);

  return {
    used: overview.creditsUsed,
    limit: overview.creditLimit,
    label: overview.status === "trialing" ? "Trial" : periodStart.toLocaleDateString("en", { month: "long" })
  };
}

export async function getCurrentBillingPlan(workspace: Workspace) {
  const overview = await getBillingOverview(workspace);

  return {
    name: overview.plan.name,
    hasHigherTier: overview.hasHigherTier
  };
}

export async function getKnowledgeSources(workspace: Workspace): Promise<KnowledgeSourceRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("knowledge_sources")
    .select("id, name, source_type, status, created_at, metadata")
    .eq("organization_id", workspace.organization.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const sources = data ?? [];
  const manualSourcesMissingContent = sources.filter(
    (source) => source.source_type === "manual" && typeof source.metadata?.content !== "string"
  );

  if (manualSourcesMissingContent.length === 0) {
    return sources;
  }

  const { data: chunks } = await supabase
    .from("knowledge_chunks")
    .select("source_id, content, metadata")
    .in("source_id", manualSourcesMissingContent.map((source) => source.id));
  const chunksBySource = ((chunks ?? []) as KnowledgeChunkContentRow[]).reduce<Record<string, KnowledgeChunkContentRow[]>>((current, chunk) => {
    current[chunk.source_id] ??= [];
    current[chunk.source_id].push(chunk);
    return current;
  }, {});

  return sources.map((source) => {
    if (source.source_type !== "manual" || typeof source.metadata?.content === "string") {
      return source;
    }

    const reconstructedContent = (chunksBySource[source.id] ?? [])
      .sort((a, b) => (a.metadata?.chunk_index ?? 0) - (b.metadata?.chunk_index ?? 0))
      .map((chunk) => chunk.content)
      .join("\n\n");

    return {
      ...source,
      metadata: {
        ...source.metadata,
        content: reconstructedContent
      }
    };
  });
}

export async function getConversations(workspace: Workspace): Promise<ConversationRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("conversations")
    .select("id, visitor_id, page_url, created_at")
    .eq("organization_id", workspace.organization.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return data ?? [];
}

export async function getInboxConversations(workspace: Workspace): Promise<InboxConversationRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, visitor_id, page_url, created_at")
    .eq("organization_id", workspace.organization.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!conversations || conversations.length === 0) {
    return [];
  }

  const conversationIds = conversations.map((conversation) => conversation.id);
  const [{ data: messages }, { data: leads }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, conversation_id, role, content, metadata, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("leads")
      .select("id, name, email, question, status, created_at, metadata, conversation_id")
      .eq("organization_id", workspace.organization.id)
      .in("conversation_id", conversationIds)
  ]);
  const messagesByConversation = ((messages ?? []) as InboxMessageRow[]).reduce<Record<string, InboxMessageRow[]>>((current, message) => {
    current[message.conversation_id] ??= [];
    current[message.conversation_id].push(message);
    return current;
  }, {});
  const leadsByConversation = ((leads ?? []) as Array<LeadRow & { conversation_id: string | null }>).reduce<Record<string, LeadRow>>((current, lead) => {
    if (lead.conversation_id) {
      current[lead.conversation_id] = {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        question: lead.question,
        status: lead.status,
        created_at: lead.created_at,
        metadata: normalizeLeadMetadata(lead.metadata, workspace.bot.lead_capture_fields),
        conversation_id: lead.conversation_id
      };
    }

    return current;
  }, {});

  return conversations.map((conversation) => {
    const conversationMessages = messagesByConversation[conversation.id] ?? [];
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    const lead = leadsByConversation[conversation.id] ?? null;
    const outcome: InboxConversationRow["outcome"] = lead
      ? "Lead captured"
      : conversationMessages.some((message) => message.metadata?.fallback === true)
        ? "Needs review"
        : "Answered";

    return {
      ...conversation,
      messages: conversationMessages,
      lead,
      last_message_at: lastMessage?.created_at ?? conversation.created_at,
      outcome
    };
  }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
}

export async function getLeads(workspace: Workspace): Promise<LeadRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("leads")
    .select("id, name, email, question, status, created_at, metadata, conversation_id")
    .eq("organization_id", workspace.organization.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return ((data ?? []) as LeadRow[]).map((lead) => ({
    ...lead,
    metadata: normalizeLeadMetadata(lead.metadata, workspace.bot.lead_capture_fields)
  }));
}

export function getInitials(email: string | null) {
  if (!email) {
    return "HA";
  }

  return email.slice(0, 2).toUpperCase();
}

export function getChartBars(conversationCount: number) {
  if (conversationCount === 0) {
    return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  return [3, 5, 4, 6, 8, 7, 9, 11, 10, 12, 14, conversationCount].map((value) =>
    Math.max(1, Math.min(value, conversationCount))
  );
}

export const analyticsCards = [
  { label: "Sources", icon: Library },
  { label: "Analytics", icon: BarChart3 }
];

async function getCount(table: "bots" | "conversations" | "leads" | "knowledge_sources" | "memberships", organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  return count ?? 0;
}

function canManageMember(currentRole: string, targetRole: string, isCurrentUser: boolean) {
  if (isCurrentUser || targetRole === "owner") {
    return false;
  }

  if (currentRole === "owner") {
    return targetRole === "admin" || targetRole === "member";
  }

  return currentRole === "admin" && targetRole === "member";
}

function canManageInvite(currentRole: string, inviteRole: string) {
  if (currentRole === "owner") {
    return inviteRole === "admin" || inviteRole === "member";
  }

  return currentRole === "admin" && inviteRole === "member";
}

async function getPendingInvitationCount(service: ReturnType<typeof createSupabaseServiceClient>, organizationId: string) {
  const { count } = await service
    .from("team_invitations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());

  return count ?? 0;
}

async function getServiceCount(
  service: ReturnType<typeof createSupabaseServiceClient>,
  table: "bots" | "memberships",
  organizationId: string
) {
  const { count } = await service
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  return count ?? 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePlanKey(value: unknown): BillingPlanKey {
  return value === "growth" || value === "pro" ? value : "starter";
}

function normalizeBillingInterval(value: unknown): BillingInterval {
  return value === "annual" ? "annual" : "monthly";
}

function normalizeBillingStatus(value: unknown): BillingStatus {
  return value === "trialing" || value === "past_due" || value === "canceled" || value === "incomplete"
    ? value
    : "active";
}

function getFallbackBillingPeriod() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}
