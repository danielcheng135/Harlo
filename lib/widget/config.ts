import type { BotConfig } from "@/lib/types";
import { isInternalWorkspaceMetadata } from "@/lib/internal-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export class WidgetRouteExcludedError extends Error {
  constructor() {
    super("Widget excluded on this page.");
    this.name = "WidgetRouteExcludedError";
  }
}

export async function getPublicBotConfig(botId: string): Promise<BotConfig> {
  return getPublicWidgetConfig({ botId });
}

export async function getPublicWidgetConfig({
  botId,
  organizationId,
  pageUrl
}: {
  botId?: string | null;
  organizationId?: string | null;
  pageUrl?: string | null;
}): Promise<BotConfig> {
  const supabase = createSupabaseServiceClient();
  const requestedBotId = botId?.trim() || null;
  const requestedOrganizationId = organizationId?.trim() || null;

  if (!requestedBotId && !requestedOrganizationId) {
    throw new Error("Chatbot not found.");
  }

  if (!requestedOrganizationId) {
    let { data: bot, error } = await supabase
      .from("bots")
      .select("id, organization_id, name, greeting, fallback_message, allowed_domains, organizations(name, brand_logo_url), widget_themes(accent, launcher_position, title, welcome_prompts), widget_routes(pattern, priority, behavior)")
      .eq("id", requestedBotId)
      .eq("status", "active")
      .single();

    if (isMissingWidgetRouteBehaviorColumn(error)) {
      const fallback = await supabase
        .from("bots")
        .select("id, organization_id, name, greeting, fallback_message, allowed_domains, organizations(name, brand_logo_url), widget_themes(accent, launcher_position, title, welcome_prompts), widget_routes(pattern, priority)")
        .eq("id", requestedBotId)
        .eq("status", "active")
        .single();

      bot = fallback.data as unknown as typeof bot;
      error = fallback.error;
    }

    if (error || !bot) {
      throw new Error("Chatbot not found.");
    }

    return buildBotConfig(bot);
  }

  let { data: bots, error } = await supabase
    .from("bots")
    .select("id, organization_id, name, greeting, fallback_message, allowed_domains, is_default, created_at, organizations(name, brand_logo_url), widget_themes(accent, launcher_position, title, welcome_prompts), widget_routes(pattern, priority, behavior)")
    .eq("organization_id", requestedOrganizationId)
    .eq("status", "active")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (isMissingWidgetRouteBehaviorColumn(error)) {
    const fallback = await supabase
      .from("bots")
      .select("id, organization_id, name, greeting, fallback_message, allowed_domains, is_default, created_at, organizations(name, brand_logo_url), widget_themes(accent, launcher_position, title, welcome_prompts), widget_routes(pattern, priority)")
      .eq("organization_id", requestedOrganizationId)
      .eq("status", "active")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });

    bots = fallback.data as unknown as typeof bots;
    error = fallback.error;
  }

  if (error || !bots || bots.length === 0) {
    throw new Error("Chatbot not found.");
  }

  const selectedBot = selectRoutedBot(bots, requestedBotId, pageUrl);

  return buildBotConfig(selectedBot);
}

async function buildBotConfig(bot: Record<string, unknown>): Promise<BotConfig> {
  const supabase = createSupabaseServiceClient();
  const theme = Array.isArray(bot.widget_themes) ? bot.widget_themes[0] : bot.widget_themes;
  const organization = Array.isArray(bot.organizations) ? bot.organizations[0] : bot.organizations;
  const [{ data: removeBrandingAddOn }, { data: billing }, { data: internalOrganization }] = await Promise.all([
    supabase
      .from("organization_add_ons")
      .select("enabled")
      .eq("organization_id", String(bot.organization_id))
      .eq("add_on_key", "remove_branding")
      .maybeSingle(),
    supabase
      .from("organization_billing")
      .select("status")
      .eq("organization_id", String(bot.organization_id))
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("metadata")
      .eq("id", String(bot.organization_id))
      .maybeSingle()
  ]);
  const isInternalWorkspace = isInternalWorkspaceMetadata(internalOrganization?.metadata);

  const themeRecord = theme && typeof theme === "object" ? theme as Record<string, unknown> : {};
  const organizationRecord = organization && typeof organization === "object" ? organization as Record<string, unknown> : {};
  const businessName = typeof organizationRecord.name === "string" ? organizationRecord.name : String(bot.name);

  return {
    id: String(bot.id),
    name: String(bot.name),
    organizationId: String(bot.organization_id),
    businessName,
    brandLogoUrl: typeof organizationRecord.brand_logo_url === "string" ? organizationRecord.brand_logo_url : null,
    greeting: getCustomerFacingGreeting(typeof bot.greeting === "string" ? bot.greeting : "", businessName),
    fallbackMessage: typeof bot.fallback_message === "string" ? bot.fallback_message : "I do not have enough information to answer that yet.",
    tone: "calm",
    allowedDomains: Array.isArray(bot.allowed_domains) ? bot.allowed_domains.filter((domain): domain is string => typeof domain === "string") : [],
    removeBranding: isInternalWorkspace || (billing?.status === "active" && removeBrandingAddOn?.enabled === true),
    theme: {
      accent: typeof themeRecord.accent === "string" ? themeRecord.accent : "#087f95",
      launcherPosition: themeRecord.launcher_position === "bottom-left" ? "bottom-left" : "bottom-right",
      title: typeof themeRecord.title === "string" ? themeRecord.title : "Ask Harlo",
      welcomePrompts: Array.isArray(themeRecord.welcome_prompts)
        ? themeRecord.welcome_prompts.filter((prompt): prompt is string => typeof prompt === "string")
        : ["What services do you offer?", "How much does it cost?", "Can I book a consultation?"]
    }
  };
}

function getCustomerFacingGreeting(greeting: string, businessName: string) {
  const trimmed = greeting.trim();

  if (!trimmed || isLegacyOwnerFacingGreeting(trimmed)) {
    return `Hi, I can help with questions about ${businessName}. What can I help you with today?`;
  }

  return trimmed;
}

function isLegacyOwnerFacingGreeting(greeting: string) {
  return [
    "Hi, I can answer questions, capture useful context, and help your team follow up.",
    "Hi, I can help answer questions and get the right details for follow-up.",
    "Hi, I can help with questions and route the right details to the team."
  ].includes(greeting);
}

function selectRoutedBot<T extends Record<string, unknown>>(bots: T[], requestedBotId: string | null, pageUrl: string | null | undefined) {
  if (requestedBotId) {
    const requestedBot = bots.find((bot) => String(bot.id) === requestedBotId);

    if (requestedBot) {
      return requestedBot;
    }
  }

  const path = getPagePath(pageUrl);
  const excludedRoute = findBestRoute(bots, path, "exclude");

  if (excludedRoute) {
    throw new WidgetRouteExcludedError();
  }

  const includedRoute = findBestRoute(bots, path, "include");

  if (includedRoute) {
    return includedRoute.bot;
  }

  return bots[0];
}

function findBestRoute<T extends Record<string, unknown>>(bots: T[], path: string, behavior: "include" | "exclude") {
  let bestMatch: { bot: T; score: number } | null = null;

  for (const bot of bots) {
    const routes = normalizeRouteRows(bot.widget_routes, behavior);

    for (const route of routes) {
      const score = getRouteScore(route.pattern, path, route.priority);

      if (score > (bestMatch?.score ?? 0)) {
        bestMatch = { bot, score };
      }
    }
  }

  return bestMatch;
}

function getPagePath(pageUrl: string | null | undefined) {
  if (!pageUrl) {
    return "/";
  }

  try {
    return normalizePath(new URL(pageUrl).pathname || "/");
  } catch {
    return "/";
  }
}

function normalizePath(path: string) {
  const trimmed = path.trim();
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  return withSlash.length > 1 ? withSlash.replace(/\/+$/g, "") : "/";
}

function normalizeRouteRows(rows: unknown, behavior: "include" | "exclude" = "include") {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => row && typeof row === "object" ? row as Record<string, unknown> : null)
    .filter((row): row is Record<string, unknown> => Boolean(row))
    .filter((row) => (typeof row.behavior === "string" ? row.behavior : "include") === behavior)
    .map((row) => ({
      pattern: typeof row.pattern === "string" ? normalizeRoutePattern(row.pattern) : "",
      priority: Number(row.priority ?? 100)
    }))
    .filter((row) => row.pattern.length > 0);
}

function normalizeRoutePattern(pattern: string) {
  const trimmed = pattern.trim();

  if (trimmed === "*") {
    return trimmed;
  }

  if (trimmed.endsWith("/*")) {
    const prefix = normalizePath(trimmed.slice(0, -2) || "/");

    return prefix === "/" ? "/*" : `${prefix}/*`;
  }

  return normalizePath(trimmed);
}

function getRouteScore(pattern: string, path: string, priority: number) {
  const priorityScore = Math.max(0, 100 - Math.min(priority, 100));

  if (pattern === "*") {
    return 1 + priorityScore;
  }

  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2) || "/";
    const matches = path === prefix || path.startsWith(`${prefix}/`);

    return matches ? 5000 + prefix.length + priorityScore : 0;
  }

  return path === pattern ? 10000 + pattern.length + priorityScore : 0;
}

export function isAllowedWidgetOrigin(config: Pick<BotConfig, "allowedDomains">, origin: string | null) {
  if (!origin) {
    return true;
  }

  try {
    const hostname = new URL(origin).hostname;
    return ["localhost", "127.0.0.1"].includes(hostname) || config.allowedDomains.includes(hostname);
  } catch {
    return false;
  }
}

function isMissingWidgetRouteBehaviorColumn(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as { code?: unknown; message?: unknown };
  const message = typeof record.message === "string" ? record.message : "";

  return record.code === "PGRST204" || message.includes("'behavior' column of 'widget_routes'");
}
