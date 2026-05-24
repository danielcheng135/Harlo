import { BuilderForm } from "@/components/builder/builder-form";
import { Badge } from "@/components/ui/badge";
import { getBillingOverview, getWorkspaceOrRedirect, requireWorkspaceAdmin } from "@/lib/harlo/data";

export default async function BuilderPage() {
  const workspace = await getWorkspaceOrRedirect();
  requireWorkspaceAdmin(workspace);
  const billing = await getBillingOverview(workspace);

  return (
    <div className="space-y-6">
      <div>
        <Badge>Agent builder</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-harlo-ink sm:text-3xl">Customize {workspace.bot.name}</h1>
        <p className="mt-2 text-harlo-muted">Tune the agent role, instructions, widget branding, page routing, prompts, and allowed websites.</p>
      </div>

      <BuilderForm
        initial={{
          botName: workspace.bot.name,
          agentType: workspace.bot.agent_type,
          description: workspace.bot.description,
          systemInstructions: workspace.bot.system_instructions,
          handoffInstructions: workspace.bot.handoff_instructions,
          widgetTitle: workspace.bot.widget_theme.title,
          greeting: workspace.bot.greeting,
          fallbackMessage: workspace.bot.fallback_message,
          accent: workspace.bot.widget_theme.accent,
          launcherPosition: workspace.bot.widget_theme.launcher_position,
          welcomePrompts: workspace.bot.widget_theme.welcome_prompts,
          brandLogoUrl: workspace.organization.brand_logo_url ?? null,
          allowedDomains: workspace.bot.allowed_domains,
          routePatterns: workspace.bot.route_patterns,
          excludedRoutePatterns: workspace.bot.excluded_route_patterns,
          leadCaptureFields: workspace.bot.lead_capture_fields,
          agents: workspace.bots.map((bot) => ({
            id: bot.id,
            botName: bot.name,
            agentType: bot.agent_type,
            description: bot.description,
            systemInstructions: bot.system_instructions,
            handoffInstructions: bot.handoff_instructions,
            widgetTitle: bot.widget_theme.title,
            greeting: bot.greeting,
            fallbackMessage: bot.fallback_message,
            accent: bot.widget_theme.accent,
            launcherPosition: bot.widget_theme.launcher_position,
            welcomePrompts: bot.widget_theme.welcome_prompts,
            allowedDomains: bot.allowed_domains,
            routePatterns: bot.route_patterns,
            excludedRoutePatterns: bot.excluded_route_patterns,
            leadCaptureFields: bot.lead_capture_fields,
            isDefault: bot.is_default
          })),
          agentCapacity: billing.capacity.agents
        }}
      />
    </div>
  );
}
