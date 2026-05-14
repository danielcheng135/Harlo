import { WidgetInstallPanel } from "@/components/settings/widget-install-panel";
import { Badge } from "@/components/ui/badge";
import { getWorkspaceOrRedirect, requireWorkspaceAdmin } from "@/lib/harlo/data";

export default async function WidgetPage() {
  const workspace = await getWorkspaceOrRedirect();
  requireWorkspaceAdmin(workspace);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Badge>Widget</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">Widget install</h1>
        <p className="mt-2 text-harlo-muted">Control allowed domains and copy the website embed snippet.</p>
      </div>
      <WidgetInstallPanel
        brandLogoUrl={workspace.organization.brand_logo_url ?? null}
        organizationId={workspace.organization.id}
        allowedDomains={workspace.bot.allowed_domains}
        agents={workspace.bots.map((bot) => ({
          id: bot.id,
          name: bot.name,
          routePatterns: bot.route_patterns,
          isDefault: bot.is_default
        }))}
      />
    </div>
  );
}
