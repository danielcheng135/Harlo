import { NextRequest, NextResponse } from "next/server";
import { getAgentTemplate, getAgentTypeForGoal } from "@/lib/agents";
import { createPendingUrlSource, reingestUrlSource } from "@/lib/knowledge/ingestion";
import { discoverWebsiteLogo, getFallbackLogoUrl, getWebsiteIdentity } from "@/lib/onboarding/website";
import { isBillingInterval, isBillingPlanKey } from "@/lib/billing/stripe";
import { isInternalAdminEmail, isInternalWorkspaceMetadata, withInternalWorkspaceMetadata } from "@/lib/internal-admin";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import type { BillingInterval, BillingPlanKey } from "@/lib/billing/plans";

type OnboardingRequest = {
  businessName?: string;
  websiteUrl?: string;
  botName?: string;
  primaryGoal?: "support" | "lead_capture" | "both";
  tone?: "professional" | "friendly" | "direct";
  accent?: string;
  planKey?: BillingPlanKey;
  interval?: BillingInterval;
};

const VALID_GOALS = new Set(["support", "lead_capture", "both"]);
const VALID_TONES = new Set(["professional", "friendly", "direct"]);
const ACCENT_PATTERN = /^#[0-9a-f]{6}$/i;
const LOGO_DISCOVERY_TIMEOUT_MS = 9000;

type LogoDiscovery = Awaited<ReturnType<typeof discoverWebsiteLogo>>;
type ServiceClient = ReturnType<typeof createSupabaseServiceClient>;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as OnboardingRequest;
  const businessName = body.businessName?.trim();
  const botName = body.botName?.trim();
  const primaryGoal = body.primaryGoal ?? "both";
  const tone = body.tone ?? "friendly";
  const accent = body.accent?.trim() ?? "#087f95";
  const planKey = isBillingPlanKey(body.planKey) ? body.planKey : "starter";
  const interval = isBillingInterval(body.interval) ? body.interval : "monthly";
  const agentType = getAgentTypeForGoal(primaryGoal);
  const agentTemplate = getAgentTemplate(agentType);

  if (!businessName || !body.websiteUrl || !botName) {
    return NextResponse.json({ error: "Add your business name, website, and assistant name." }, { status: 400 });
  }

  if (!VALID_GOALS.has(primaryGoal)) {
    return NextResponse.json({ error: "Choose a valid assistant goal." }, { status: 400 });
  }

  if (!VALID_TONES.has(tone)) {
    return NextResponse.json({ error: "Choose a valid assistant tone." }, { status: 400 });
  }

  if (!ACCENT_PATTERN.test(accent)) {
    return NextResponse.json({ error: "Choose a valid brand accent color." }, { status: 400 });
  }

  let website;
  let fallbackLogoUrl: string | null = null;

  try {
    website = getWebsiteIdentity(body.websiteUrl);
    fallbackLogoUrl = getFallbackLogoUrl(body.websiteUrl);
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
  const isInternalAdmin = isInternalAdminEmail(user.email);

  const serviceClient = createSupabaseServiceClient();
  const { data: existingMembership } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingMembership) {
    const { data: existingOrganization } = await serviceClient
      .from("organizations")
      .select("id, brand_logo_url, metadata")
      .eq("id", existingMembership.organization_id)
      .maybeSingle();

    if (!existingOrganization) {
      return NextResponse.json({ error: "Could not find your workspace. Please contact support." }, { status: 409 });
    }

    const logoUrl = existingOrganization.brand_logo_url ?? fallbackLogoUrl;
    const isInternalWorkspace = isInternalAdmin || isInternalWorkspaceMetadata(existingOrganization.metadata);

    await serviceClient
      .from("organizations")
      .update({
        name: businessName,
        website_url: website.normalizedUrl,
        brand_logo_url: logoUrl,
        metadata: buildOrganizationMetadata(existingOrganization.metadata, isInternalWorkspace, {
          onboarding: {
            goal: primaryGoal,
            tone,
            logo_discovery_status: existingOrganization.brand_logo_url ? "ready" : "fallback",
            logo_discovery_error: null
          }
        }),
        updated_at: new Date().toISOString()
      })
      .eq("id", existingMembership.organization_id);

    const { data: existingBot } = await serviceClient
      .from("bots")
      .select("id")
      .eq("organization_id", existingMembership.organization_id)
      .eq("status", "active")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    let botId = existingBot?.id ?? null;

    if (!botId) {
      const { data: repairedBot, error: repairedBotError } = await serviceClient
        .from("bots")
        .insert({
          organization_id: existingMembership.organization_id,
          name: botName,
          agent_type: agentType,
          description: agentTemplate.defaultDescription,
          system_instructions: agentTemplate.systemInstructions,
          handoff_instructions: agentTemplate.handoffInstructions,
          is_default: true,
          greeting: getGreeting(primaryGoal, tone),
          fallback_message: getFallbackMessage(primaryGoal),
          allowed_domains: [website.hostname],
          status: "active"
        })
        .select("id")
        .single();

      if (repairedBotError || !repairedBot) {
        return NextResponse.json({ error: repairedBotError?.message ?? "Could not repair chatbot setup." }, { status: 500 });
      }

      botId = repairedBot.id;
    }

    const { data: existingTheme } = await serviceClient
      .from("widget_themes")
      .select("id")
      .eq("bot_id", botId)
      .maybeSingle();

    if (!existingTheme) {
      const { error: themeRepairError } = await serviceClient.from("widget_themes").insert({
        organization_id: existingMembership.organization_id,
        bot_id: botId,
        accent,
        launcher_position: "bottom-right",
        title: botName,
        welcome_prompts: getWelcomePrompts(primaryGoal)
      });

      if (themeRepairError) {
        return NextResponse.json({ error: themeRepairError.message }, { status: 500 });
      }
    }

    const { data: existingBilling } = await serviceClient
      .from("organization_billing")
      .select("status")
      .eq("organization_id", existingMembership.organization_id)
      .maybeSingle();

    if (!existingBilling) {
      const { error: billingRepairError } = await serviceClient.from("organization_billing").insert({
        organization_id: existingMembership.organization_id,
        plan_key: isInternalWorkspace ? "pro" : planKey,
        billing_interval: isInternalWorkspace ? "monthly" : interval,
        status: isInternalWorkspace ? "active" : "incomplete"
      });

      if (billingRepairError) {
        return NextResponse.json({ error: billingRepairError.message }, { status: 500 });
      }
    } else if (isInternalWorkspace || (existingBilling.status !== "active" && existingBilling.status !== "trialing")) {
      await serviceClient
        .from("organization_billing")
        .update({
          plan_key: isInternalWorkspace ? "pro" : planKey,
          billing_interval: isInternalWorkspace ? "monthly" : interval,
          ...(isInternalWorkspace ? { status: "active" } : {}),
          updated_at: new Date().toISOString()
        })
        .eq("organization_id", existingMembership.organization_id);
    }

    const sourceId = await ensureInitialUrlSource({
      serviceClient,
      organizationId: existingMembership.organization_id,
      botId,
      url: website.normalizedUrl
    });

    return NextResponse.json({
      organizationId: existingMembership.organization_id,
      botId,
      sourceId,
      alreadyExists: true,
      logoUrl,
      websiteUrl: website.normalizedUrl,
      planKey,
      interval,
      nextPath: isInternalWorkspace ? "/dashboard?welcome=1" : "/onboarding/checkout"
    });
  }

  const logoDiscovery = discoverWebsiteLogo(website.normalizedUrl).catch((error): LogoDiscovery => ({
    normalizedUrl: website.normalizedUrl,
    origin: website.origin,
    hostname: website.hostname,
    logoUrl: null,
    error: error instanceof Error ? error.message : "Could not discover website logo."
  }));
  let logoDiscoveryTimedOut = false;
  const discoveredLogo = await Promise.race([
    logoDiscovery,
    wait(LOGO_DISCOVERY_TIMEOUT_MS).then(() => {
      logoDiscoveryTimedOut = true;
      return null;
    })
  ]);
  const initialLogoUrl = discoveredLogo?.logoUrl ?? fallbackLogoUrl;
  const logoDiscoveryStatus = discoveredLogo?.logoUrl ? "ready" : logoDiscoveryTimedOut ? "pending" : "fallback";
  const { data: organization, error: organizationError } = await serviceClient
    .from("organizations")
    .insert({
      name: businessName,
      website_url: website.normalizedUrl,
      brand_logo_url: initialLogoUrl,
      metadata: buildOrganizationMetadata(null, isInternalAdmin, {
        onboarding: {
          goal: primaryGoal,
          tone,
          logo_discovery_status: logoDiscoveryStatus,
          logo_discovery_error: discoveredLogo?.error ?? null
        }
      })
    })
    .select("id, brand_logo_url")
    .single();

  if (organizationError || !organization) {
    return NextResponse.json({ error: organizationError?.message ?? "Could not create organization." }, { status: 500 });
  }

  if (logoDiscoveryTimedOut || !discoveredLogo?.logoUrl) {
    void logoDiscovery
      .then(async (result) => {
        if (!result.logoUrl || result.logoUrl === initialLogoUrl) {
          return;
        }

        await serviceClient
          .from("organizations")
          .update({
            brand_logo_url: result.logoUrl,
            metadata: buildOrganizationMetadata(null, isInternalAdmin, {
              onboarding: {
                goal: primaryGoal,
                tone,
                logo_discovery_status: "ready",
                logo_discovery_error: null
              }
            }),
            updated_at: new Date().toISOString()
          })
          .eq("id", organization.id);
      })
      .catch(() => undefined);
  }

  const { data: bot, error: botError } = await serviceClient
    .from("bots")
    .insert({
      organization_id: organization.id,
      name: botName,
      agent_type: agentType,
      description: agentTemplate.defaultDescription,
      system_instructions: agentTemplate.systemInstructions,
      handoff_instructions: agentTemplate.handoffInstructions,
      is_default: true,
      greeting: getGreeting(primaryGoal, tone),
      fallback_message: getFallbackMessage(primaryGoal),
      allowed_domains: [website.hostname]
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

  const { error: billingError } = await serviceClient.from("organization_billing").insert({
    organization_id: organization.id,
    plan_key: isInternalAdmin ? "pro" : planKey,
    billing_interval: isInternalAdmin ? "monthly" : interval,
    status: isInternalAdmin ? "active" : "incomplete"
  });

  if (billingError) {
    return NextResponse.json({ error: billingError.message }, { status: 500 });
  }

  const { error: themeError } = await serviceClient.from("widget_themes").insert({
    organization_id: organization.id,
    bot_id: bot.id,
    accent,
    launcher_position: "bottom-right",
    title: botName,
    welcome_prompts: getWelcomePrompts(primaryGoal)
  });

  if (themeError) {
    return NextResponse.json({ error: themeError.message }, { status: 500 });
  }

  let sourceId: string | null = null;

  try {
    const source = await createPendingUrlSource({
      serviceClient,
      organizationId: organization.id,
      botId: bot.id,
      name: website.normalizedUrl,
      url: website.normalizedUrl,
      maxPages: 8
    });
    sourceId = source.sourceId;
    const createdSourceId = source.sourceId;

    void reingestUrlSource({
      serviceClient,
      organizationId: organization.id,
      botId: bot.id,
      sourceId: createdSourceId,
      name: website.normalizedUrl,
      url: website.normalizedUrl,
      maxPages: 8
    }).catch(() => undefined);
  } catch (error) {
    await serviceClient.from("knowledge_sources").insert({
      organization_id: organization.id,
      bot_id: bot.id,
      name: website.normalizedUrl,
      source_type: "url",
      status: "failed",
      metadata: {
        url: website.normalizedUrl,
        error: error instanceof Error ? error.message : "Could not start website crawl."
      }
    });
  }

  return NextResponse.json({
    organizationId: organization.id,
    botId: bot.id,
    sourceId,
    logoUrl: initialLogoUrl,
    websiteUrl: website.normalizedUrl,
    planKey,
    interval,
    nextPath: isInternalAdmin ? "/dashboard?welcome=1" : "/onboarding/checkout"
  });
}

function buildOrganizationMetadata(
  currentMetadata: unknown,
  internalWorkspace: boolean,
  updates: Record<string, unknown>
) {
  const base = currentMetadata && typeof currentMetadata === "object" && !Array.isArray(currentMetadata)
    ? currentMetadata as Record<string, unknown>
    : {};
  const merged = {
    ...base,
    ...updates
  };

  return internalWorkspace ? withInternalWorkspaceMetadata(merged) : merged;
}

function wait(milliseconds: number) {
  return new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), milliseconds);
  });
}

async function ensureInitialUrlSource({
  serviceClient,
  organizationId,
  botId,
  url
}: {
  serviceClient: ServiceClient;
  organizationId: string;
  botId: string;
  url: string;
}) {
  const { data: existingSources } = await serviceClient
    .from("knowledge_sources")
    .select("id, name, metadata")
    .eq("organization_id", organizationId)
    .eq("source_type", "url")
    .limit(25);
  const existingSource = existingSources?.find((source) => {
    const metadataUrl = isRecord(source.metadata) && typeof source.metadata.url === "string" ? source.metadata.url : null;

    return metadataUrl === url || source.name === url;
  });

  if (existingSource) {
    return existingSource.id;
  }

  try {
    const source = await createPendingUrlSource({
      serviceClient,
      organizationId,
      botId,
      name: url,
      url,
      maxPages: 8
    });
    const createdSourceId = source.sourceId;

    void reingestUrlSource({
      serviceClient,
      organizationId,
      botId,
      sourceId: createdSourceId,
      name: url,
      url,
      maxPages: 8
    }).catch(() => undefined);

    return createdSourceId;
  } catch (error) {
    const { data: failedSource } = await serviceClient
      .from("knowledge_sources")
      .insert({
        organization_id: organizationId,
        bot_id: botId,
        name: url,
        source_type: "url",
        status: "failed",
        metadata: {
          url,
          error: error instanceof Error ? error.message : "Could not start website crawl."
        }
      })
      .select("id")
      .single();

    return failedSource?.id ?? null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getGreeting(goal: string, tone: string) {
  if (goal === "lead_capture") {
    return tone === "direct"
      ? "Tell me what you need help with, and I can point you in the right direction."
      : "Hi, I can help answer questions and collect details if you need a follow-up.";
  }

  if (goal === "support") {
    return "Hi, I can help answer questions about this business. What can I help you with?";
  }

  return "Hi, I can help answer questions and get you to the right next step.";
}

function getFallbackMessage(goal: string) {
  if (goal === "support") {
    return "I do not want to guess. Share your email and the team can follow up with the right answer.";
  }

  return "I can pass this to the team. What is the best email to reach you?";
}

function getWelcomePrompts(goal: string) {
  if (goal === "support") {
    return ["What services do you offer?", "How does this work?", "What should I know before getting started?"];
  }

  if (goal === "lead_capture") {
    return ["Can someone follow up?", "Which plan is right for me?", "Can I book a demo?"];
  }

  return ["What services do you offer?", "How much does it cost?", "Can someone follow up?"];
}
