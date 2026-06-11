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
  canUseIntegrationProvider,
  getBillingPlan,
  getIntegrationEntitlements,
  getPlanCreditLimit,
  hasHigherTier,
  type AddOnKey,
  type BillingInterval,
  type BillingPlanKey,
  type BillingStatus
} from "@/lib/billing/plans";
import { INTEGRATION_PROVIDERS, isIntegrationProviderKey } from "@/lib/integrations/registry";
import { isIntegrationOAuthConfigured } from "@/lib/integrations/oauth";
import type { IntegrationActionType, IntegrationProviderKey, IntegrationStatus, IntegrationTriggerType } from "@/lib/integrations/types";
import { normalizeAgentType, type AgentType } from "@/lib/agents";
import { normalizeLeadFields, normalizeLeadMetadata, type LeadCaptureField } from "@/lib/lead-fields";
import {
  INTERNAL_WORKSPACE_AGENT_LIMIT,
  INTERNAL_WORKSPACE_CREDIT_LIMIT,
  INTERNAL_WORKSPACE_SEAT_LIMIT,
  isInternalAdminEmail,
  withInternalWorkspaceMetadata,
  isInternalWorkspaceMetadata
} from "@/lib/internal-admin";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

const WORKSPACE_BOT_SELECT_WITH_ROUTES = "id, name, agent_type, description, system_instructions, handoff_instructions, status, is_default, greeting, fallback_message, allowed_domains, lead_capture_fields, widget_themes(accent, launcher_position, title, welcome_prompts), widget_routes(pattern, priority, behavior)";
const WORKSPACE_BOT_SELECT = "id, name, agent_type, description, system_instructions, handoff_instructions, status, is_default, greeting, fallback_message, allowed_domains, lead_capture_fields, widget_themes(accent, launcher_position, title, welcome_prompts)";

export type WorkspaceBot = {
  id: string;
  name: string;
  agent_type: AgentType;
  description: string;
  system_instructions: string;
  handoff_instructions: string;
  status: "active" | "archived";
  is_default: boolean;
  greeting: string;
  fallback_message: string;
  allowed_domains: string[];
  route_patterns: string[];
  excluded_route_patterns: string[];
  lead_capture_fields: LeadCaptureField[];
  widget_theme: {
    accent: string;
    launcher_position: "bottom-right" | "bottom-left";
    title: string;
    welcome_prompts: string[];
  };
};

export type Workspace = {
  user: {
    id: string;
    email: string | null;
  };
  organization: {
    id: string;
    name: string;
    website_url?: string | null;
    brand_logo_url?: string | null;
    metadata?: Record<string, unknown> | null;
  };
  bot: WorkspaceBot;
  bots: WorkspaceBot[];
  role: string;
};

export type KnowledgeSourceRow = {
  id: string;
  name: string;
  source_type: string;
  status: string;
  created_at: string;
  metadata: Record<string, unknown>;
  chunks: KnowledgeChunkContentRow[];
};

export type KnowledgeChunkContentRow = {
  source_id: string;
  content: string;
  metadata: {
    chunk_index?: number;
    chunk_count?: number;
    page_title?: string;
    page_url?: string;
    source_name?: string;
    source_url?: string;
  } | null;
};

export type ConversationRow = {
  id: string;
  visitor_id: string | null;
  page_url: string | null;
  review_status: "resolved" | "needs_review";
  source_channel: "website";
  integration_channel_id?: string | null;
  external_thread_id?: string | null;
  external_sender_id?: string | null;
  external_profile?: Record<string, unknown> | null;
  created_at: string;
  bot_id?: string | null;
  bot_name?: string;
  agent_type?: AgentType;
  bot_accent?: string;
  route_patterns?: string[];
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

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  agentCounts: Record<string, number>;
};

export type LeadRow = {
  id: string;
  name: string;
  email: string;
  question: string;
  status: string;
  created_at: string;
  conversation_id?: string | null;
  bot_id?: string | null;
  bot_name?: string;
  agent_type?: AgentType;
  bot_accent?: string;
  route_patterns?: string[];
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
  isInternal: boolean;
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

export type IntegrationOverview = {
  migrationReady: boolean;
  entitlements: ReturnType<typeof getIntegrationEntitlements>;
  bots: IntegrationBotOverview[];
  providers: IntegrationProviderOverview[];
  recentRuns: IntegrationRunOverview[];
  runPagination: {
    page: number;
    pageSize: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
};

export type IntegrationBotOverview = {
  id: string;
  name: string;
};

export type IntegrationProviderOverview = {
  key: IntegrationProviderKey;
  name: string;
  description: string;
  actionTypes: IntegrationActionType[];
  planAllowed: boolean;
  requiredPlan: "Growth" | "Pro";
  oauthConfigured: boolean;
  integrationId: string | null;
  status: IntegrationStatus;
  displayName: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  configuredActions: IntegrationConfiguredAction[];
};

export type IntegrationConfiguredAction = {
  id: string;
  botId: string;
  actionType: IntegrationActionType;
  triggerType: IntegrationTriggerType;
  enabled: boolean;
  successMessage: string | null;
  fallbackMessage: string | null;
  config: Record<string, unknown>;
};

export type IntegrationRunOverview = {
  id: string;
  provider: IntegrationProviderKey;
  actionType: IntegrationActionType;
  triggerType: IntegrationTriggerType | null;
  status: string;
  externalRecordId: string | null;
  externalUrl: string | null;
  resultMessage: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  completedAt: string | null;
  reason: string | null;
  createdAt: string;
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

  const [{ data: organization }, botsResult, { data: billing }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, website_url, brand_logo_url, metadata")
      .eq("id", membership.organization_id)
      .single(),
    getWorkspaceBots(supabase, membership.organization_id),
    supabase
      .from("organization_billing")
      .select("status")
      .eq("organization_id", membership.organization_id)
      .maybeSingle()
  ]);
  const bots = botsResult.data;

  if (!organization || !bots || bots.length === 0) {
    redirect("/onboarding");
  }

  const billingStatus = normalizeBillingStatus(billing?.status);

  const isInternalAdmin = isInternalAdminEmail(user.email);
  const isInternalWorkspace = isInternalAdmin || isInternalWorkspaceMetadata(organization.metadata);

  if (isInternalAdmin && !isInternalWorkspaceMetadata(organization.metadata)) {
    const service = createSupabaseServiceClient();
    await Promise.all([
      service
        .from("organizations")
        .update({
          metadata: withInternalWorkspaceMetadata(organization.metadata),
          updated_at: new Date().toISOString()
        })
        .eq("id", organization.id),
      service
        .from("organization_billing")
        .upsert({
          organization_id: organization.id,
          plan_key: "pro",
          billing_interval: "monthly",
          status: "active",
          updated_at: new Date().toISOString()
        }, { onConflict: "organization_id" })
    ]);
    organization.metadata = withInternalWorkspaceMetadata(organization.metadata);
  }

  if (!isInternalWorkspace && billingStatus !== "active" && billingStatus !== "trialing") {
    redirect("/onboarding/checkout?checkout=required");
  }

  const normalizedBots = bots.map((bot) => normalizeWorkspaceBot(bot, organization.name));

  return {
    user: {
      id: user.id,
      email: user.email ?? null
    },
    organization,
    bot: normalizedBots[0],
    bots: normalizedBots,
    role: membership.role
  };
}

async function getWorkspaceBots(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string
) {
  const withRoutes = await supabase
    .from("bots")
    .select(WORKSPACE_BOT_SELECT_WITH_ROUTES)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(20);

  if (!withRoutes.error) {
    return withRoutes;
  }

  return supabase
    .from("bots")
    .select(WORKSPACE_BOT_SELECT)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(20);
}

export function isWorkspaceAdmin(role: string) {
  return role === "owner" || role === "admin";
}

export function requireWorkspaceAdmin(workspace: Workspace) {
  if (!isWorkspaceAdmin(workspace.role)) {
    redirect("/dashboard");
  }
}

function normalizeWorkspaceBot(bot: {
  id: string;
  name: string;
  agent_type: unknown;
  description: unknown;
  system_instructions: unknown;
  handoff_instructions: unknown;
  status: unknown;
  is_default: unknown;
  greeting: string;
  fallback_message: string;
  allowed_domains: string[] | null;
  widget_routes?: unknown;
  lead_capture_fields: unknown;
  widget_themes: unknown;
}, businessName: string): WorkspaceBot {
  return {
    id: bot.id,
    name: bot.name,
    agent_type: normalizeAgentType(bot.agent_type),
    description: typeof bot.description === "string" ? bot.description : "",
    system_instructions: typeof bot.system_instructions === "string" ? bot.system_instructions : "",
    handoff_instructions: typeof bot.handoff_instructions === "string" ? bot.handoff_instructions : "",
    status: bot.status === "archived" ? "archived" : "active",
    is_default: bot.is_default === true,
    greeting: bot.greeting,
    fallback_message: bot.fallback_message,
    allowed_domains: bot.allowed_domains ?? [],
    route_patterns: normalizeRoutePatternsFromRows(bot.widget_routes),
    excluded_route_patterns: normalizeRoutePatternsFromRows(bot.widget_routes, "exclude"),
    lead_capture_fields: normalizeLeadFields(bot.lead_capture_fields),
    widget_theme: normalizeWidgetTheme(bot.widget_themes, businessName)
  };
}

function normalizeRoutePatternsFromRows(rows: unknown, behavior = "include") {
  const routeRows = Array.isArray(rows) ? rows : [];

  return routeRows
    .map((row) => row && typeof row === "object" ? row as Record<string, unknown> : null)
    .filter((row): row is Record<string, unknown> => Boolean(row))
    .filter((row) => (typeof row.behavior === "string" ? row.behavior : "include") === behavior)
    .sort((first, second) => Number(first.priority ?? 100) - Number(second.priority ?? 100))
    .map((row) => typeof row.pattern === "string" ? row.pattern : "")
    .filter(Boolean);
}

function normalizeWidgetTheme(theme: unknown, businessName: string): WorkspaceBot["widget_theme"] {
  const rawTheme = Array.isArray(theme) ? theme[0] : theme;
  const themeRecord = rawTheme && typeof rawTheme === "object" ? rawTheme as Record<string, unknown> : {};
  const launcherPosition = themeRecord.launcher_position === "bottom-left" ? "bottom-left" : "bottom-right";
  const welcomePrompts = Array.isArray(themeRecord.welcome_prompts)
    ? themeRecord.welcome_prompts
      .filter((prompt): prompt is string => typeof prompt === "string" && prompt.trim().length > 0)
      .map((prompt) => prompt.trim().toLowerCase() === "how much does it cost?" ? `What is ${businessName}?` : prompt)
    : [];

  return {
    accent: typeof themeRecord.accent === "string" ? themeRecord.accent : "#087f95",
    launcher_position: launcherPosition,
    title: typeof themeRecord.title === "string" ? themeRecord.title : "Ask Harlo",
    welcome_prompts: welcomePrompts.length > 0
      ? welcomePrompts
      : ["What services do you offer?", `What is ${businessName}?`, "Can I book a demo?"]
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
  const [{ data: billing }, { data: organization }] = await Promise.all([
    supabase
      .from("organization_billing")
      .select("plan_key, billing_interval, status, trial_start, trial_end, current_period_start, current_period_end, cancel_at_period_end")
      .eq("organization_id", workspace.organization.id)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("metadata")
      .eq("id", workspace.organization.id)
      .maybeSingle()
  ]);
  const isInternalWorkspace = isInternalWorkspaceMetadata(workspace.organization.metadata ?? organization?.metadata);
  const fallbackPeriod = getFallbackBillingPeriod();
  const planKey = isInternalWorkspace ? "pro" : normalizePlanKey(billing?.plan_key);
  const status = isInternalWorkspace ? "active" : normalizeBillingStatus(billing?.status);
  const interval = normalizeBillingInterval(billing?.billing_interval);
  const periodStart = typeof billing?.current_period_start === "string" ? billing.current_period_start : fallbackPeriod.start;
  const periodEnd = typeof billing?.current_period_end === "string" ? billing.current_period_end : fallbackPeriod.end;
  const planCreditLimit = isInternalWorkspace ? INTERNAL_WORKSPACE_CREDIT_LIMIT : getPlanCreditLimit(planKey, status);

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
  const addOnsAvailable = status === "active";
  const addOnsByKey = new Map(
    ((addOnRows ?? []) as Array<{ add_on_key: AddOnKey; enabled: boolean; quantity: number; metadata?: Record<string, unknown> | null }>).map((row) => [row.add_on_key, row])
  );
  const autoRechargeRow = addOnsByKey.get("auto_recharge_credits");
  const extraAgentQuantity = addOnsAvailable && !isInternalWorkspace ? getEnabledAddOnQuantity(addOnsByKey.get("extra_agent")) : 0;
  const extraSeatQuantity = addOnsAvailable && !isInternalWorkspace ? getEnabledAddOnQuantity(addOnsByKey.get("extra_seat")) : 0;
  const agentLimit = isInternalWorkspace ? INTERNAL_WORKSPACE_AGENT_LIMIT : getBillingPlan(planKey).includedAgents + extraAgentQuantity;
  const seatLimit = isInternalWorkspace ? INTERNAL_WORKSPACE_SEAT_LIMIT : getBillingPlan(planKey).seats + extraSeatQuantity;
  const autoRechargeMetadata = isRecord(autoRechargeRow?.metadata) ? autoRechargeRow.metadata : {};
  const autoRechargeFailure = addOnsAvailable &&
    autoRechargeRow?.enabled === true &&
    typeof autoRechargeMetadata.last_failure_reason === "string" &&
    typeof autoRechargeMetadata.last_failed_at === "string"
      ? {
        reason: autoRechargeMetadata.last_failure_reason,
        failedAt: autoRechargeMetadata.last_failed_at
      }
      : null;

  return {
    isInternal: isInternalWorkspace,
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
        enabled: isInternalWorkspace && addOn.key === "remove_branding" ? true : addOnsAvailable && (row?.enabled ?? false),
        quantity: addOnsAvailable ? row?.quantity ?? 0 : 0
      };
    }),
    capacity: {
      agents: {
        included: isInternalWorkspace ? INTERNAL_WORKSPACE_AGENT_LIMIT : getBillingPlan(planKey).includedAgents,
        extra: extraAgentQuantity,
        used: botCount,
        limit: agentLimit,
        remaining: Math.max(0, agentLimit - botCount)
      },
      seats: {
        included: isInternalWorkspace ? INTERNAL_WORKSPACE_SEAT_LIMIT : getBillingPlan(planKey).seats,
        extra: extraSeatQuantity,
        used: memberCount,
        pending: pendingInviteCount,
        limit: seatLimit,
        remaining: Math.max(0, seatLimit - memberCount - pendingInviteCount)
      }
    }
  };
}

export async function getIntegrationOverview(
  workspace: Workspace,
  billing: BillingOverview,
  options: {
    includeHistory?: boolean;
    historyPage?: number;
  } = {}
): Promise<IntegrationOverview> {
  const supabase = await createSupabaseServerClient();
  const entitlements = getIntegrationEntitlements(billing.planKey);
  const historyPageSize = 10;
  const historyPage = Math.max(1, options.historyPage ?? 1);
  const integrationResult = await supabase
    .from("integrations")
    .select("id, provider, status, display_name, last_success_at, last_error, config")
    .eq("organization_id", workspace.organization.id);

  const migrationReady = !integrationResult.error;
  const rows = migrationReady
    ? ((integrationResult.data ?? []) as Array<{
      id: string;
      provider: string;
      status: IntegrationStatus;
      display_name: string | null;
      last_success_at: string | null;
      last_error: string | null;
      config: Record<string, unknown> | null;
    }>)
    : [];
  const rowsByProvider = new Map(rows.filter((row) => isIntegrationProviderKey(row.provider)).map((row) => [row.provider, row]));
  const integrationIds = rows.map((row) => row.id);
  const actionsResult = integrationIds.length > 0 && migrationReady
    ? await supabase
      .from("bot_integration_actions")
      .select("id, bot_id, integration_id, trigger_type, action_type, enabled, success_message, fallback_message, config")
      .eq("organization_id", workspace.organization.id)
      .in("integration_id", integrationIds)
    : { data: [] };
  const actionsByIntegrationId = new Map<string, IntegrationConfiguredAction[]>();

  ((actionsResult.data ?? []) as Array<{
    id: string;
    bot_id: string;
    integration_id: string;
    trigger_type: IntegrationTriggerType;
    action_type: IntegrationActionType;
    enabled: boolean;
    success_message: string | null;
    fallback_message: string | null;
    config: Record<string, unknown> | null;
  }>).forEach((action) => {
    const current = actionsByIntegrationId.get(action.integration_id) ?? [];
    current.push({
      id: action.id,
      botId: action.bot_id,
      actionType: action.action_type,
      triggerType: action.trigger_type,
      enabled: action.enabled,
      successMessage: action.success_message,
      fallbackMessage: action.fallback_message,
      config: action.config ?? {}
    });
    actionsByIntegrationId.set(action.integration_id, current);
  });
  const providers = INTEGRATION_PROVIDERS.map((provider) => {
    const row = rowsByProvider.get(provider.key);

    return {
      key: provider.key,
      name: provider.name,
      description: provider.description,
      actionTypes: provider.actionTypes,
      planAllowed: canUseIntegrationProvider(billing.planKey, provider.key),
      requiredPlan: provider.growthEnabled ? "Growth" as const : "Pro" as const,
      oauthConfigured: isIntegrationOAuthConfigured(provider.key),
      integrationId: row?.id ?? null,
      status: row?.status ?? "disconnected",
      displayName: row?.display_name ?? null,
      lastSuccessAt: row?.last_success_at ?? null,
      lastError: row?.last_error ?? null,
      configuredActions: row?.id ? actionsByIntegrationId.get(row.id) ?? [] : []
    };
  });
  const bots = workspace.bots.map((bot) => ({
    id: bot.id,
    name: bot.name
  }));

  if (!migrationReady) {
    return {
      migrationReady,
      entitlements,
      bots,
      providers,
      recentRuns: [],
      runPagination: {
        page: historyPage,
        pageSize: historyPageSize,
        hasPrevious: historyPage > 1,
        hasNext: false
      }
    };
  }

  if (!options.includeHistory) {
    return {
      migrationReady,
      entitlements,
      bots,
      providers,
      recentRuns: [],
      runPagination: {
        page: 1,
        pageSize: historyPageSize,
        hasPrevious: false,
        hasNext: false
      }
    };
  }

  const historyOffset = (historyPage - 1) * historyPageSize;
  const runsResult = await supabase
    .from("integration_action_runs")
    .select("id, provider, action_type, trigger_type, status, external_record_id, external_url, result_message, error_message, duration_ms, completed_at, reason, created_at")
    .eq("organization_id", workspace.organization.id)
    .in("provider", INTEGRATION_PROVIDERS.map((provider) => provider.key))
    .order("created_at", { ascending: false })
    .range(historyOffset, historyOffset + historyPageSize);
  const runRows = (runsResult.data ?? []) as Array<{
    id: string;
    provider: string;
    action_type: string;
    trigger_type: string | null;
    status: string;
    external_record_id: string | null;
    external_url: string | null;
    result_message: string | null;
    error_message: string | null;
    duration_ms: number | null;
    completed_at: string | null;
    reason: string | null;
    created_at: string;
  }>;
  const recentRuns = runRows
    .slice(0, historyPageSize)
    .filter((run) => isIntegrationProviderKey(run.provider) && isIntegrationActionType(run.action_type))
    .map((run) => ({
      id: run.id,
      provider: run.provider as IntegrationProviderKey,
      actionType: run.action_type as IntegrationActionType,
      triggerType: isIntegrationTriggerType(run.trigger_type) ? run.trigger_type : null,
      status: run.status,
      externalRecordId: run.external_record_id,
      externalUrl: run.external_url,
      resultMessage: run.result_message,
      errorMessage: run.error_message,
      durationMs: run.duration_ms,
      completedAt: run.completed_at,
      reason: run.reason,
      createdAt: run.created_at
    }));

  return {
    migrationReady,
    entitlements,
    bots,
    providers,
    recentRuns,
    runPagination: {
      page: historyPage,
      pageSize: historyPageSize,
      hasPrevious: historyPage > 1,
      hasNext: runRows.length > historyPageSize
    }
  };
}

function getEnabledAddOnQuantity(row: { enabled: boolean; quantity: number } | undefined) {
  return row?.enabled ? Math.max(0, row.quantity ?? 0) : 0;
}

function isIntegrationActionType(value: string): value is IntegrationActionType {
  return value === "show_booking_link" ||
    value === "submit_service_request" ||
    value === "send_webhook" ||
    value === "send_notification" ||
    value === "create_crm_contact";
}

function isIntegrationTriggerType(value: string | null): value is IntegrationTriggerType {
  return value === "booking_requested" ||
    value === "service_request_completed" ||
    value === "lead_captured" ||
    value === "human_follow_up_requested" ||
    value === "integration_failed";
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

  const sources = (data ?? []) as Omit<KnowledgeSourceRow, "chunks">[];
  const { data: allChunks } = sources.length > 0
    ? await supabase
      .from("knowledge_chunks")
      .select("source_id, content, metadata")
      .in("source_id", sources.map((source) => source.id))
    : { data: [] };
  const chunksBySource = ((allChunks ?? []) as KnowledgeChunkContentRow[]).reduce<Record<string, KnowledgeChunkContentRow[]>>((current, chunk) => {
    current[chunk.source_id] ??= [];
    current[chunk.source_id].push(chunk);
    return current;
  }, {});
  return sources.map((source) => {
    const sourceChunks = (chunksBySource[source.id] ?? [])
      .sort((a, b) => (a.metadata?.chunk_index ?? 0) - (b.metadata?.chunk_index ?? 0));

    if (source.source_type !== "manual" || typeof source.metadata?.content === "string") {
      return {
        ...source,
        chunks: sourceChunks
      };
    }

    const reconstructedContent = sourceChunks
      .map((chunk) => chunk.content)
      .join("\n\n");

    return {
      ...source,
      metadata: {
        ...source.metadata,
        content: reconstructedContent
      },
      chunks: sourceChunks
    };
  });
}

export async function getConversations(workspace: Workspace): Promise<ConversationRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("conversations")
    .select("id, visitor_id, page_url, review_status, source_channel, integration_channel_id, external_thread_id, external_sender_id, external_profile, created_at, bot_id")
    .eq("organization_id", workspace.organization.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return ((data ?? []) as ConversationRow[]).map((conversation) => ({
    ...normalizeConversationSource(conversation),
    ...getWorkspaceBotMeta(workspace, conversation.bot_id)
  }));
}

export async function getInboxConversations(workspace: Workspace): Promise<InboxConversationRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, visitor_id, page_url, review_status, source_channel, integration_channel_id, external_thread_id, external_sender_id, external_profile, created_at, bot_id")
    .eq("organization_id", workspace.organization.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return hydrateInboxConversations(workspace, supabase, conversations ?? []);
}

export async function getPaginatedInboxConversations(
  workspace: Workspace,
  options: { page?: number; pageSize?: number; agentId?: string }
): Promise<PaginatedResult<InboxConversationRow>> {
  const supabase = await createSupabaseServerClient();
  const pageSize = Math.max(1, Math.min(options.pageSize ?? 10, 50));
  let countQuery = supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", workspace.organization.id);

  if (options.agentId) {
    countQuery = countQuery.eq("bot_id", options.agentId);
  }

  const [{ count }, agentCounts] = await Promise.all([
    countQuery,
    getTableAgentCounts(supabase, "conversations", workspace)
  ]);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, options.page ?? 1), totalPages);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let conversationsQuery = supabase
    .from("conversations")
    .select("id, visitor_id, page_url, review_status, source_channel, integration_channel_id, external_thread_id, external_sender_id, external_profile, created_at, bot_id")
    .eq("organization_id", workspace.organization.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options.agentId) {
    conversationsQuery = conversationsQuery.eq("bot_id", options.agentId);
  }

  const { data: conversations } = await conversationsQuery;
  const items = await hydrateInboxConversations(workspace, supabase, conversations ?? []);

  return { items, page, pageSize, total, totalPages, agentCounts };
}

async function hydrateInboxConversations(
  workspace: Workspace,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  conversations: Array<Record<string, unknown>>
): Promise<InboxConversationRow[]> {
  if (!conversations || conversations.length === 0) {
    return [];
  }

  const typedConversations = conversations as unknown as ConversationRow[];
  const conversationIds = typedConversations.map((conversation) => conversation.id);
  const [{ data: messages }, { data: leads }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, conversation_id, role, content, metadata, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("leads")
      .select("id, name, email, question, status, created_at, metadata, conversation_id, bot_id")
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
        metadata: normalizeLeadMetadata(lead.metadata, getLeadFieldsForBot(workspace, lead.bot_id)),
        conversation_id: lead.conversation_id,
        ...getWorkspaceBotMeta(workspace, lead.bot_id)
      };
    }

    return current;
  }, {});

  return typedConversations.map((conversation) => {
    const conversationMessages = messagesByConversation[conversation.id] ?? [];
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    const lead = leadsByConversation[conversation.id] ?? null;
    const outcome: InboxConversationRow["outcome"] = conversation.review_status === "needs_review"
      ? "Needs review"
      : lead
        ? "Lead captured"
        : "Answered";

    return {
      ...normalizeConversationSource(conversation),
      ...getWorkspaceBotMeta(workspace, conversation.bot_id),
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
    .select("id, name, email, question, status, created_at, metadata, conversation_id, bot_id")
    .eq("organization_id", workspace.organization.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return ((data ?? []) as LeadRow[]).map((lead) => ({
    ...lead,
    metadata: normalizeLeadMetadata(lead.metadata, getLeadFieldsForBot(workspace, lead.bot_id)),
    ...getWorkspaceBotMeta(workspace, lead.bot_id)
  }));
}

export async function getPaginatedLeads(
  workspace: Workspace,
  options: { page?: number; pageSize?: number; agentId?: string }
): Promise<PaginatedResult<LeadRow>> {
  const supabase = await createSupabaseServerClient();
  const pageSize = Math.max(1, Math.min(options.pageSize ?? 10, 50));
  let countQuery = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", workspace.organization.id);

  if (options.agentId) {
    countQuery = countQuery.eq("bot_id", options.agentId);
  }

  const [{ count }, agentCounts] = await Promise.all([
    countQuery,
    getTableAgentCounts(supabase, "leads", workspace)
  ]);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, options.page ?? 1), totalPages);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let leadsQuery = supabase
    .from("leads")
    .select("id, name, email, question, status, created_at, metadata, conversation_id, bot_id")
    .eq("organization_id", workspace.organization.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options.agentId) {
    leadsQuery = leadsQuery.eq("bot_id", options.agentId);
  }

  const { data } = await leadsQuery;
  const items = ((data ?? []) as LeadRow[]).map((lead) => ({
    ...lead,
    metadata: normalizeLeadMetadata(lead.metadata, getLeadFieldsForBot(workspace, lead.bot_id)),
    ...getWorkspaceBotMeta(workspace, lead.bot_id)
  }));

  return { items, page, pageSize, total, totalPages, agentCounts };
}

async function getTableAgentCounts(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: "conversations" | "leads",
  workspace: Workspace
) {
  const counts = await Promise.all(workspace.bots.map(async (bot) => {
    const { count } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("organization_id", workspace.organization.id)
      .eq("bot_id", bot.id);

    return [bot.id, count ?? 0] as const;
  }));

  return Object.fromEntries(counts);
}

function getWorkspaceBotMeta(workspace: Workspace, botId?: string | null) {
  const bot = workspace.bots.find((item) => item.id === botId) ?? workspace.bot;

  return {
    bot_id: bot.id,
    bot_name: bot.name,
    agent_type: bot.agent_type,
    bot_accent: bot.widget_theme.accent,
    route_patterns: bot.route_patterns
  };
}

function getLeadFieldsForBot(workspace: Workspace, botId?: string | null) {
  return (workspace.bots.find((item) => item.id === botId) ?? workspace.bot).lead_capture_fields;
}

function normalizeConversationSource(conversation: ConversationRow): ConversationRow {
  return {
    ...conversation,
    source_channel: "website",
    external_profile: isRecord(conversation.external_profile) ? conversation.external_profile : {}
  };
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
  let query = service
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (table === "bots") {
    query = query.eq("status", "active");
  }

  const { count } = await query;

  return count ?? 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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
