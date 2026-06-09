import { NextRequest, NextResponse } from "next/server";
import { getAgentTemplate, normalizeAgentType, type AgentType } from "@/lib/agents";
import { getBillingPlan, type AddOnKey } from "@/lib/billing/plans";
import { INTERNAL_WORKSPACE_AGENT_LIMIT, isInternalWorkspaceMetadata } from "@/lib/internal-admin";
import { normalizeLeadFields, type LeadCaptureField } from "@/lib/lead-fields";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type BuilderAction = "save" | "create" | "archive" | "set_default";

type BuilderRequest = {
  action?: BuilderAction;
  botId?: string;
  botName?: string;
  agentType?: string;
  description?: string;
  systemInstructions?: string;
  handoffInstructions?: string;
  widgetTitle?: string;
  greeting?: string;
  fallbackMessage?: string;
  accent?: string;
  launcherPosition?: "bottom-right" | "bottom-left";
  welcomePrompts?: string[];
  allowedDomains?: string[];
  routePatterns?: string[];
  excludedRoutePatterns?: string[];
  leadCaptureFields?: LeadCaptureField[];
};

type WorkspaceMembership = {
  organization_id: string;
  role: string;
};

type AgentResponse = {
  id: string;
  botName: string;
  agentType: AgentType;
  description: string;
  systemInstructions: string;
  handoffInstructions: string;
  widgetTitle: string;
  greeting: string;
  fallbackMessage: string;
  accent: string;
  launcherPosition: "bottom-right" | "bottom-left";
  welcomePrompts: string[];
  allowedDomains: string[];
  routePatterns: string[];
  excludedRoutePatterns: string[];
  leadCaptureFields: LeadCaptureField[];
  isDefault: boolean;
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as BuilderRequest;
  const action = resolveAction(body.action);
  const authResult = await getAuthorizedMembership();

  if ("response" in authResult) {
    return authResult.response;
  }

  const membership = authResult.membership;
  const serviceClient = createSupabaseServiceClient();

  if (action === "archive") {
    return archiveAgent(serviceClient, membership, body.botId);
  }

  if (action === "set_default") {
    return setDefaultAgent(serviceClient, membership, body.botId);
  }

  if (action === "create") {
    return createAgent(serviceClient, membership, body);
  }

  return saveAgent(serviceClient, membership, body);
}

async function getAuthorizedMembership(): Promise<{ membership: WorkspaceMembership } | { response: NextResponse }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { response: NextResponse.json({ error: "You must be signed in." }, { status: 401 }) };
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return { response: NextResponse.json({ error: "Finish onboarding before editing the widget." }, { status: 409 }) };
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    return { response: NextResponse.json({ error: "Only owners and admins can edit chatbot settings." }, { status: 403 }) };
  }

  return { membership };
}

async function saveAgent(
  serviceClient: ReturnType<typeof createSupabaseServiceClient>,
  membership: WorkspaceMembership,
  body: BuilderRequest
) {
  const parsed = parseAgentSettings(body);

  if ("response" in parsed) {
    return parsed.response;
  }

  const activeBot = body.botId
    ? await getActiveBotById(serviceClient, membership.organization_id, body.botId)
    : await getFallbackActiveBot(serviceClient, membership.organization_id);

  if (!activeBot) {
    return NextResponse.json({ error: "No active agent found for this workspace." }, { status: 409 });
  }

  const { error: botError } = await serviceClient
    .from("bots")
    .update({
      name: parsed.settings.botName,
      agent_type: parsed.settings.agentType,
      description: parsed.settings.description,
      system_instructions: parsed.settings.systemInstructions,
      handoff_instructions: parsed.settings.handoffInstructions,
      greeting: parsed.settings.greeting,
      fallback_message: parsed.settings.fallbackMessage,
      allowed_domains: parsed.settings.allowedDomains,
      lead_capture_fields: parsed.settings.leadCaptureFields,
      updated_at: new Date().toISOString()
    })
    .eq("id", activeBot.id)
    .eq("organization_id", membership.organization_id);

  if (botError) {
    return NextResponse.json({ error: botError.message }, { status: 500 });
  }

  const { error: themeError } = await serviceClient
    .from("widget_themes")
    .upsert(
      {
        organization_id: membership.organization_id,
        bot_id: activeBot.id,
        accent: parsed.settings.accent,
        launcher_position: parsed.settings.launcherPosition,
        title: parsed.settings.widgetTitle,
        welcome_prompts: parsed.settings.welcomePrompts,
        updated_at: new Date().toISOString()
      },
      { onConflict: "bot_id" }
    );

  if (themeError) {
    return NextResponse.json({ error: themeError.message }, { status: 500 });
  }

  const routeError = await replaceWidgetRoutes(
    serviceClient,
    membership.organization_id,
    activeBot.id,
    parsed.settings.routePatterns,
    parsed.settings.excludedRoutePatterns
  );

  if (routeError) {
    return NextResponse.json({ error: routeError.message }, { status: 500 });
  }

  const agent = await getAgentResponse(serviceClient, membership.organization_id, activeBot.id);

  return NextResponse.json({
    botId: activeBot.id,
    agent,
    status: "saved"
  });
}

async function createAgent(
  serviceClient: ReturnType<typeof createSupabaseServiceClient>,
  membership: WorkspaceMembership,
  body: BuilderRequest
) {
  const agentType = normalizeAgentType(body.agentType);
  const capacity = await getAgentCapacity(serviceClient, membership.organization_id);

  if (capacity.used >= capacity.limit) {
    return NextResponse.json({ error: "Enable the Extra agent add-on before creating another agent." }, { status: 402 });
  }

  const template = getAgentTemplate(agentType);
  const accent = typeof body.accent === "string" && HEX_COLOR.test(body.accent.trim()) ? body.accent.trim() : "#087f95";
  const launcherPosition = body.launcherPosition === "bottom-left" ? "bottom-left" : "bottom-right";
  const welcomePrompts = normalizePrompts(body.welcomePrompts);
  const allowedDomains = normalizeDomains(body.allowedDomains);
  const routePatterns = normalizeRoutePatterns(body.routePatterns);
  const excludedRoutePatterns = normalizeRoutePatterns(body.excludedRoutePatterns);
  const leadCaptureFields = normalizeLeadFields(body.leadCaptureFields);
  const botName = await getNextAgentName(serviceClient, membership.organization_id, template.label);

  const { data: bot, error: botError } = await serviceClient
    .from("bots")
    .insert({
      organization_id: membership.organization_id,
      name: botName,
      agent_type: agentType,
      description: template.defaultDescription,
      system_instructions: template.systemInstructions,
      handoff_instructions: template.handoffInstructions,
      greeting: getDefaultGreeting(agentType),
      fallback_message: "I do not have enough approved information to answer that yet, but I can collect your details for the team.",
      allowed_domains: allowedDomains,
      lead_capture_fields: leadCaptureFields,
      status: "active",
      is_default: false
    })
    .select("id")
    .single();

  if (botError || !bot) {
    return NextResponse.json({ error: botError?.message ?? "Could not create agent." }, { status: 500 });
  }

  const { error: themeError } = await serviceClient.from("widget_themes").insert({
    organization_id: membership.organization_id,
    bot_id: bot.id,
    accent,
    launcher_position: launcherPosition,
    title: botName,
    welcome_prompts: welcomePrompts
  });

  if (themeError) {
    return NextResponse.json({ error: themeError.message }, { status: 500 });
  }

  const routeError = await replaceWidgetRoutes(serviceClient, membership.organization_id, bot.id, routePatterns, excludedRoutePatterns);

  if (routeError) {
    return NextResponse.json({ error: routeError.message }, { status: 500 });
  }

  const agent = await getAgentResponse(serviceClient, membership.organization_id, bot.id);

  return NextResponse.json({
    botId: bot.id,
    agent,
    status: "created"
  });
}

async function archiveAgent(
  serviceClient: ReturnType<typeof createSupabaseServiceClient>,
  membership: WorkspaceMembership,
  botId: string | undefined
) {
  if (!botId) {
    return NextResponse.json({ error: "Choose an agent to archive." }, { status: 400 });
  }

  const activeAgents = await getActiveAgents(serviceClient, membership.organization_id);

  if (!activeAgents.some((agent) => agent.id === botId)) {
    return NextResponse.json({ error: "That agent was not found." }, { status: 404 });
  }

  if (activeAgents.length <= 1) {
    return NextResponse.json({ error: "Keep at least one active agent in the workspace." }, { status: 400 });
  }

  const archivedAgent = activeAgents.find((agent) => agent.id === botId);
  const nextDefault = activeAgents.find((agent) => agent.id !== botId);

  const { error } = await serviceClient
    .from("bots")
    .update({
      status: "archived",
      is_default: false,
      updated_at: new Date().toISOString()
    })
    .eq("id", botId)
    .eq("organization_id", membership.organization_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (archivedAgent?.is_default && nextDefault) {
    await setDefaultBot(serviceClient, membership.organization_id, nextDefault.id);
  }

  await serviceClient
    .from("widget_routes")
    .delete()
    .eq("organization_id", membership.organization_id)
    .eq("bot_id", botId);

  return NextResponse.json({ botId, status: "archived" });
}

async function setDefaultAgent(
  serviceClient: ReturnType<typeof createSupabaseServiceClient>,
  membership: WorkspaceMembership,
  botId: string | undefined
) {
  if (!botId) {
    return NextResponse.json({ error: "Choose an agent to make default." }, { status: 400 });
  }

  const { data: bot } = await serviceClient
    .from("bots")
    .select("id")
    .eq("id", botId)
    .eq("organization_id", membership.organization_id)
    .eq("status", "active")
    .maybeSingle();

  if (!bot) {
    return NextResponse.json({ error: "That active agent was not found." }, { status: 404 });
  }

  const error = await setDefaultBot(serviceClient, membership.organization_id, botId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ botId, status: "default_set" });
}

function parseAgentSettings(body: BuilderRequest): { settings: RequiredSettings } | { response: NextResponse } {
  const botName = cleanText(body.botName, 80);
  const agentType = normalizeAgentType(body.agentType);
  const description = cleanText(body.description, 180);
  const systemInstructions = cleanText(body.systemInstructions, 1200);
  const handoffInstructions = cleanText(body.handoffInstructions, 800);
  const widgetTitle = cleanText(body.widgetTitle, 80);
  const greeting = cleanText(body.greeting, 240);
  const fallbackMessage = cleanText(body.fallbackMessage, 240);
  const accent = body.accent?.trim();
  const launcherPosition = body.launcherPosition === "bottom-left" ? "bottom-left" : "bottom-right";
  const welcomePrompts = normalizePrompts(body.welcomePrompts);
  const allowedDomains = normalizeDomains(body.allowedDomains);
  const routePatterns = normalizeRoutePatterns(body.routePatterns);
  const excludedRoutePatterns = normalizeRoutePatterns(body.excludedRoutePatterns);
  const leadCaptureFields = normalizeLeadFields(body.leadCaptureFields);

  if (!botName || !description || !widgetTitle || !greeting || !fallbackMessage || !accent) {
    return { response: NextResponse.json({ error: "Agent identity and widget fields are required." }, { status: 400 }) };
  }

  if (!HEX_COLOR.test(accent)) {
    return { response: NextResponse.json({ error: "Accent color must be a valid hex color." }, { status: 400 }) };
  }

  if (welcomePrompts.length === 0) {
    return { response: NextResponse.json({ error: "Add at least one welcome prompt." }, { status: 400 }) };
  }

  return {
    settings: {
      botName,
      agentType,
      description,
      systemInstructions,
      handoffInstructions,
      widgetTitle,
      greeting,
      fallbackMessage,
      accent,
      launcherPosition,
      welcomePrompts,
      allowedDomains,
      routePatterns,
      excludedRoutePatterns,
      leadCaptureFields
    }
  };
}

type RequiredSettings = {
  botName: string;
  agentType: AgentType;
  description: string;
  systemInstructions: string;
  handoffInstructions: string;
  widgetTitle: string;
  greeting: string;
  fallbackMessage: string;
  accent: string;
  launcherPosition: "bottom-right" | "bottom-left";
  welcomePrompts: string[];
  allowedDomains: string[];
  routePatterns: string[];
  excludedRoutePatterns: string[];
  leadCaptureFields: LeadCaptureField[];
};

async function getActiveBotById(
  serviceClient: ReturnType<typeof createSupabaseServiceClient>,
  organizationId: string,
  botId: string
) {
  const { data: bot } = await serviceClient
    .from("bots")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .eq("id", botId)
    .maybeSingle();

  return bot;
}

async function getFallbackActiveBot(
  serviceClient: ReturnType<typeof createSupabaseServiceClient>,
  organizationId: string
) {
  const { data: bot } = await serviceClient
    .from("bots")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return bot;
}

async function getActiveAgents(
  serviceClient: ReturnType<typeof createSupabaseServiceClient>,
  organizationId: string
) {
  const { data } = await serviceClient
    .from("bots")
    .select("id, is_default")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  return data ?? [];
}

async function setDefaultBot(
  serviceClient: ReturnType<typeof createSupabaseServiceClient>,
  organizationId: string,
  botId: string
) {
  const { error: clearError } = await serviceClient
    .from("bots")
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq("organization_id", organizationId);

  if (clearError) {
    return clearError;
  }

  const { error: setError } = await serviceClient
    .from("bots")
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .eq("id", botId)
    .eq("status", "active");

  return setError;
}

async function getAgentCapacity(
  serviceClient: ReturnType<typeof createSupabaseServiceClient>,
  organizationId: string
) {
  const [{ data: billing }, { data: addOns }, { count }, { data: organization }] = await Promise.all([
    serviceClient
      .from("organization_billing")
      .select("plan_key, status")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    serviceClient
      .from("organization_add_ons")
      .select("add_on_key, enabled, quantity")
      .eq("organization_id", organizationId),
    serviceClient
      .from("bots")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    serviceClient
      .from("organizations")
      .select("metadata")
      .eq("id", organizationId)
      .maybeSingle()
  ]);

  if (isInternalWorkspaceMetadata(organization?.metadata)) {
    return {
      used: count ?? 0,
      limit: INTERNAL_WORKSPACE_AGENT_LIMIT
    };
  }

  const plan = getBillingPlan(typeof billing?.plan_key === "string" ? billing.plan_key : null);
  const extra = billing?.status === "active"
    ? ((addOns ?? []) as Array<{ add_on_key: AddOnKey; enabled: boolean; quantity: number }>)
      .filter((row) => row.add_on_key === "extra_agent" && row.enabled)
      .reduce((total, row) => total + Math.max(0, row.quantity ?? 0), 0)
    : 0;
  const limit = plan.includedAgents + extra;

  return {
    used: count ?? 0,
    limit
  };
}

async function getNextAgentName(
  serviceClient: ReturnType<typeof createSupabaseServiceClient>,
  organizationId: string,
  baseName: string
) {
  const { data } = await serviceClient
    .from("bots")
    .select("name")
    .eq("organization_id", organizationId)
    .ilike("name", `${baseName}%`);
  const usedNames = new Set((data ?? []).map((row) => row.name));

  if (!usedNames.has(baseName)) {
    return baseName;
  }

  for (let index = 2; index < 50; index += 1) {
    const name = `${baseName} ${index}`;

    if (!usedNames.has(name)) {
      return name;
    }
  }

  return `${baseName} ${Date.now()}`;
}

async function getAgentResponse(
  serviceClient: ReturnType<typeof createSupabaseServiceClient>,
  organizationId: string,
  botId: string
): Promise<AgentResponse | null> {
  let { data, error } = await serviceClient
    .from("bots")
    .select("id, name, agent_type, description, system_instructions, handoff_instructions, is_default, greeting, fallback_message, allowed_domains, lead_capture_fields, widget_themes(accent, launcher_position, title, welcome_prompts), widget_routes(pattern, priority, behavior)")
    .eq("organization_id", organizationId)
    .eq("id", botId)
    .maybeSingle();

  if (isMissingWidgetRouteBehaviorColumn(error)) {
    const fallback = await serviceClient
      .from("bots")
      .select("id, name, agent_type, description, system_instructions, handoff_instructions, is_default, greeting, fallback_message, allowed_domains, lead_capture_fields, widget_themes(accent, launcher_position, title, welcome_prompts), widget_routes(pattern, priority)")
      .eq("organization_id", organizationId)
      .eq("id", botId)
      .maybeSingle();

    data = fallback.data as unknown as typeof data;
    error = fallback.error;
  }

  if (!data) {
    return null;
  }

  const theme = normalizeTheme(data.widget_themes);

  return {
    id: data.id,
    botName: data.name,
    agentType: normalizeAgentType(data.agent_type),
    description: typeof data.description === "string" ? data.description : "",
    systemInstructions: typeof data.system_instructions === "string" ? data.system_instructions : "",
    handoffInstructions: typeof data.handoff_instructions === "string" ? data.handoff_instructions : "",
    widgetTitle: theme.title,
    greeting: data.greeting,
    fallbackMessage: data.fallback_message,
    accent: theme.accent,
    launcherPosition: theme.launcherPosition,
    welcomePrompts: theme.welcomePrompts,
    allowedDomains: Array.isArray(data.allowed_domains) ? data.allowed_domains : [],
    routePatterns: normalizeRouteRows(data.widget_routes),
    excludedRoutePatterns: normalizeRouteRows(data.widget_routes, "exclude"),
    leadCaptureFields: normalizeLeadFields(data.lead_capture_fields),
    isDefault: data.is_default === true
  };
}

async function replaceWidgetRoutes(
  serviceClient: ReturnType<typeof createSupabaseServiceClient>,
  organizationId: string,
  botId: string,
  routePatterns: string[],
  excludedRoutePatterns: string[] = []
) {
  const { error: deleteError } = await serviceClient
    .from("widget_routes")
    .delete()
    .eq("organization_id", organizationId)
    .eq("bot_id", botId);

  if (deleteError) {
    return deleteError;
  }

  if (routePatterns.length === 0 && excludedRoutePatterns.length === 0) {
    return null;
  }

  const now = new Date().toISOString();
  const rows = [
    ...routePatterns.map((pattern, index) => ({
      organization_id: organizationId,
      bot_id: botId,
      pattern,
      behavior: "include",
      priority: index + 1,
      updated_at: now
    })),
    ...excludedRoutePatterns.map((pattern, index) => ({
      organization_id: organizationId,
      bot_id: botId,
      pattern,
      behavior: "exclude",
      priority: index + 1,
      updated_at: now
    }))
  ];
  const { error } = await serviceClient
    .from("widget_routes")
    .insert(rows);

  if (isMissingWidgetRouteBehaviorColumn(error)) {
    if (excludedRoutePatterns.length > 0) {
      return {
        ...error,
        message: "Excluded routes need the latest database migration. Apply supabase/migrations/0032_widget_route_exclusions.sql, then save again."
      };
    }

    const fallback = await serviceClient
      .from("widget_routes")
      .insert(routePatterns.map((pattern, index) => ({
        organization_id: organizationId,
        bot_id: botId,
        pattern,
        priority: index + 1,
        updated_at: now
      })));

    return fallback.error;
  }

  return error;
}

function normalizeRouteRows(rows: unknown, behavior = "include") {
  const routeRows = Array.isArray(rows) ? rows : [];

  return routeRows
    .map((row) => row && typeof row === "object" ? row as Record<string, unknown> : null)
    .filter((row): row is Record<string, unknown> => Boolean(row))
    .filter((row) => (typeof row.behavior === "string" ? row.behavior : "include") === behavior)
    .sort((first, second) => Number(first.priority ?? 100) - Number(second.priority ?? 100))
    .map((row) => typeof row.pattern === "string" ? row.pattern : "")
    .filter(Boolean);
}

function isMissingWidgetRouteBehaviorColumn(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as { code?: unknown; message?: unknown };
  const message = typeof record.message === "string" ? record.message : "";

  return record.code === "PGRST204" || message.includes("'behavior' column of 'widget_routes'");
}

function normalizeTheme(theme: unknown): {
  accent: string;
  launcherPosition: "bottom-right" | "bottom-left";
  title: string;
  welcomePrompts: string[];
} {
  const rawTheme = Array.isArray(theme) ? theme[0] : theme;
  const themeRecord = rawTheme && typeof rawTheme === "object" ? rawTheme as Record<string, unknown> : {};
  const launcherPosition: "bottom-right" | "bottom-left" =
    themeRecord.launcher_position === "bottom-left" ? "bottom-left" : "bottom-right";
  const welcomePrompts = Array.isArray(themeRecord.welcome_prompts)
    ? themeRecord.welcome_prompts.filter((prompt): prompt is string => typeof prompt === "string" && prompt.trim().length > 0)
    : [];

  return {
    accent: typeof themeRecord.accent === "string" ? themeRecord.accent : "#087f95",
    launcherPosition,
    title: typeof themeRecord.title === "string" ? themeRecord.title : "Ask Harlo",
    welcomePrompts: welcomePrompts.length > 0 ? welcomePrompts : ["What services do you offer?", "How much does it cost?", "Can I book a demo?"]
  };
}

function resolveAction(action: unknown): BuilderAction {
  if (action === "create" || action === "archive" || action === "set_default") {
    return action;
  }

  return "save";
}

function cleanText(value: string | undefined, maxLength: number) {
  const text = value?.trim();

  if (!text) {
    return "";
  }

  return text.slice(0, maxLength);
}

function normalizePrompts(prompts: string[] | undefined) {
  return Array.from(new Set((prompts ?? []).map((prompt) => cleanText(prompt, 90)).filter(Boolean))).slice(0, 4);
}

function normalizeDomains(domains: string[] | undefined) {
  return Array.from(
    new Set(
      (domains ?? [])
        .map((domain) => normalizeDomain(domain))
        .filter((domain): domain is string => Boolean(domain))
    )
  ).slice(0, 10);
}

function normalizeDomain(value: string | undefined) {
  const raw = value?.trim().toLowerCase();

  if (!raw) {
    return null;
  }

  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).hostname;
  } catch {
    return null;
  }
}

function normalizeRoutePatterns(patterns: string[] | undefined) {
  return Array.from(
    new Set(
      (patterns ?? [])
        .map((pattern) => normalizeRoutePattern(pattern))
        .filter((pattern): pattern is string => Boolean(pattern))
    )
  ).slice(0, 8);
}

function normalizeRoutePattern(value: string | undefined) {
  const raw = value?.trim();

  if (!raw) {
    return null;
  }

  if (raw === "*") {
    return raw;
  }

  const prefixed = raw.startsWith("/") ? raw : `/${raw}`;

  return prefixed.replace(/\/{2,}/g, "/").slice(0, 240);
}

function getDefaultGreeting(agentType: AgentType) {
  if (agentType === "sales") {
    return "Hi, I can help with pricing, fit, and next steps. What are you looking for?";
  }

  if (agentType === "custom") {
    return "Hi, I can help answer questions and get you to the right next step.";
  }

  return "Hi, I can help answer questions about this business. What can I help you with?";
}
