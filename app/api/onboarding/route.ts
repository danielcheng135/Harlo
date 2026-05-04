import { NextRequest, NextResponse } from "next/server";
import { TRIAL_CONFIG } from "@/lib/billing/plans";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type OnboardingRequest = {
  businessName?: string;
  websiteUrl?: string;
  botName?: string;
  accent?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as OnboardingRequest;

  if (!body.businessName || !body.websiteUrl || !body.botName || !body.accent) {
    return NextResponse.json({ error: "Missing onboarding fields." }, { status: 400 });
  }

  let websiteHostname: string;

  try {
    websiteHostname = new URL(body.websiteUrl).hostname;
  } catch {
    return NextResponse.json({ error: "Website URL must be valid." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "You must be signed in to finish onboarding." }, { status: 401 });
  }

  const serviceClient = createSupabaseServiceClient();
  const { data: organization, error: organizationError } = await serviceClient
    .from("organizations")
    .insert({
      name: body.businessName
    })
    .select("id")
    .single();

  if (organizationError || !organization) {
    return NextResponse.json({ error: organizationError?.message ?? "Could not create organization." }, { status: 500 });
  }

  const { data: bot, error: botError } = await serviceClient
    .from("bots")
    .insert({
      organization_id: organization.id,
      name: body.botName,
      greeting: "Hi, I can help answer questions about services, pricing, and availability.",
      fallback_message: "I can pass this to the team. What is the best email to reach you?",
      allowed_domains: [websiteHostname]
    })
    .select("id")
    .single();

  if (botError || !bot) {
    return NextResponse.json({ error: botError?.message ?? "Could not create chatbot." }, { status: 500 });
  }

  const { error: membershipError } = await serviceClient.from("memberships").insert({
    organization_id: organization.id,
    user_id: user.id,
    role: "owner"
  });

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  const trialStart = new Date();
  const trialEnd = new Date(trialStart);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_CONFIG.days);
  const { error: billingError } = await serviceClient.from("organization_billing").insert({
    organization_id: organization.id,
    plan_key: TRIAL_CONFIG.convertsToPlan,
    billing_interval: "monthly",
    status: "trialing",
    trial_start: trialStart.toISOString(),
    trial_end: trialEnd.toISOString(),
    current_period_start: trialStart.toISOString(),
    current_period_end: trialEnd.toISOString()
  });

  if (billingError) {
    return NextResponse.json({ error: billingError.message }, { status: 500 });
  }

  const { error: themeError } = await serviceClient.from("widget_themes").insert({
    organization_id: organization.id,
    bot_id: bot.id,
    accent: body.accent,
    launcher_position: "bottom-right",
    title: "Ask Harlo",
    welcome_prompts: ["What services do you offer?", "How much does it cost?", "Can I book a consultation?"]
  });

  if (themeError) {
    return NextResponse.json({ error: themeError.message }, { status: 500 });
  }

  const { error: sourceError } = await serviceClient.from("knowledge_sources").insert({
    organization_id: organization.id,
    bot_id: bot.id,
    name: body.websiteUrl,
    source_type: "url",
    status: "pending",
    metadata: {
      url: body.websiteUrl
    }
  });

  if (sourceError) {
    return NextResponse.json({ error: sourceError.message }, { status: 500 });
  }

  return NextResponse.json({
    organizationId: organization.id,
    botId: bot.id
  });
}
