import { BuilderForm } from "@/components/builder/builder-form";
import { Badge } from "@/components/ui/badge";
import { getWorkspaceOrRedirect } from "@/lib/harlo/data";

export default async function BuilderPage() {
  const workspace = await getWorkspaceOrRedirect();

  return (
    <div className="space-y-6">
      <div>
        <Badge>Builder</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">Customize {workspace.bot.name}</h1>
        <p className="mt-2 text-harlo-muted">Edit widget branding, launcher behavior, greetings, prompts, and allowed websites.</p>
      </div>

      <BuilderForm
        initial={{
          botName: workspace.bot.name,
          widgetTitle: workspace.bot.widget_theme.title,
          greeting: workspace.bot.greeting,
          fallbackMessage: workspace.bot.fallback_message,
          accent: workspace.bot.widget_theme.accent,
          launcherPosition: workspace.bot.widget_theme.launcher_position,
          welcomePrompts: workspace.bot.widget_theme.welcome_prompts,
          allowedDomains: workspace.bot.allowed_domains,
          leadCaptureFields: workspace.bot.lead_capture_fields
        }}
      />
    </div>
  );
}
