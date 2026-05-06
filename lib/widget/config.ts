import type { BotConfig } from "@/lib/types";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function getPublicBotConfig(botId: string): Promise<BotConfig> {
  const supabase = createSupabaseServiceClient();
  const { data: bot, error } = await supabase
    .from("bots")
    .select("id, organization_id, name, greeting, fallback_message, allowed_domains, organizations(name), widget_themes(accent, launcher_position, title, welcome_prompts)")
    .eq("id", botId)
    .single();

  if (error || !bot) {
    throw new Error("Chatbot not found.");
  }

  const theme = Array.isArray(bot.widget_themes) ? bot.widget_themes[0] : bot.widget_themes;
  const organization = Array.isArray(bot.organizations) ? bot.organizations[0] : bot.organizations;
  const { data: removeBrandingAddOn } = await supabase
    .from("organization_add_ons")
    .select("enabled")
    .eq("organization_id", bot.organization_id)
    .eq("add_on_key", "remove_branding")
    .maybeSingle();

  return {
    id: bot.id,
    name: bot.name,
    organizationId: bot.organization_id,
    businessName: organization?.name ?? bot.name,
    greeting: bot.greeting,
    fallbackMessage: bot.fallback_message,
    tone: "calm",
    allowedDomains: bot.allowed_domains ?? [],
    removeBranding: removeBrandingAddOn?.enabled === true,
    theme: {
      accent: theme?.accent ?? "#087f95",
      launcherPosition: theme?.launcher_position ?? "bottom-right",
      title: theme?.title ?? "Ask Harlo",
      welcomePrompts: theme?.welcome_prompts ?? ["What services do you offer?", "How much does it cost?", "Can I book a consultation?"]
    }
  };
}

export function isAllowedWidgetOrigin(config: BotConfig, origin: string | null) {
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
