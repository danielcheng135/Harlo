import { NextRequest, NextResponse } from "next/server";
import { normalizeLeadFields, type LeadCaptureField } from "@/lib/lead-fields";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type BuilderRequest = {
  botName?: string;
  widgetTitle?: string;
  greeting?: string;
  fallbackMessage?: string;
  accent?: string;
  launcherPosition?: "bottom-right" | "bottom-left";
  welcomePrompts?: string[];
  allowedDomains?: string[];
  leadCaptureFields?: LeadCaptureField[];
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as BuilderRequest;
  const botName = cleanText(body.botName, 80);
  const widgetTitle = cleanText(body.widgetTitle, 80);
  const greeting = cleanText(body.greeting, 240);
  const fallbackMessage = cleanText(body.fallbackMessage, 240);
  const accent = body.accent?.trim();
  const launcherPosition = body.launcherPosition === "bottom-left" ? "bottom-left" : "bottom-right";
  const welcomePrompts = normalizePrompts(body.welcomePrompts);
  const allowedDomains = normalizeDomains(body.allowedDomains);
  const leadCaptureFields = normalizeLeadFields(body.leadCaptureFields);

  if (!botName || !widgetTitle || !greeting || !fallbackMessage || !accent) {
    return NextResponse.json({ error: "All widget fields are required." }, { status: 400 });
  }

  if (!HEX_COLOR.test(accent)) {
    return NextResponse.json({ error: "Accent color must be a valid hex color." }, { status: 400 });
  }

  if (welcomePrompts.length === 0) {
    return NextResponse.json({ error: "Add at least one welcome prompt." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Finish onboarding before editing the widget." }, { status: 409 });
  }

  const { data: bot } = await supabase
    .from("bots")
    .select("id")
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!bot) {
    return NextResponse.json({ error: "No chatbot found for this workspace." }, { status: 409 });
  }

  const serviceClient = createSupabaseServiceClient();
  const { error: botError } = await serviceClient
    .from("bots")
    .update({
      name: botName,
      greeting,
      fallback_message: fallbackMessage,
      allowed_domains: allowedDomains,
      lead_capture_fields: leadCaptureFields
    })
    .eq("id", bot.id)
    .eq("organization_id", membership.organization_id);

  if (botError) {
    return NextResponse.json({ error: botError.message }, { status: 500 });
  }

  const { error: themeError } = await serviceClient
    .from("widget_themes")
    .upsert(
      {
        organization_id: membership.organization_id,
        bot_id: bot.id,
        accent,
        launcher_position: launcherPosition,
        title: widgetTitle,
        welcome_prompts: welcomePrompts,
        updated_at: new Date().toISOString()
      },
      { onConflict: "bot_id" }
    );

  if (themeError) {
    return NextResponse.json({ error: themeError.message }, { status: 500 });
  }

  return NextResponse.json({
    botId: bot.id,
    status: "saved"
  });
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
