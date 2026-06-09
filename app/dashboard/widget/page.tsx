import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { WidgetInstallPanel } from "@/components/settings/widget-install-panel";
import { Badge } from "@/components/ui/badge";
import { getWorkspaceOrRedirect, requireWorkspaceAdmin } from "@/lib/harlo/data";

export default async function WidgetPage() {
  const workspace = await getWorkspaceOrRedirect();
  requireWorkspaceAdmin(workspace);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge>Widget</Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-harlo-ink sm:text-3xl">Widget install</h1>
          <p className="mt-2 text-harlo-muted">Control allowed domains and copy the website embed snippet.</p>
        </div>
        <Link
          href={`/widget-test?botId=${workspace.bot.id}`}
          target="_blank"
          className="inline-flex h-10 w-fit shrink-0 items-center justify-center gap-2 rounded-lg border border-harlo-line bg-white px-4 text-sm font-semibold text-harlo-ink transition hover:border-harlo-teal hover:text-harlo-teal"
        >
          Preview demo
          <ExternalLink size={15} />
        </Link>
      </div>
      <WidgetInstallPanel
        brandLogoUrl={workspace.organization.brand_logo_url ?? null}
        organizationId={workspace.organization.id}
        allowedDomains={workspace.bot.allowed_domains}
        agents={workspace.bots.map((bot) => ({
          id: bot.id,
          name: bot.name,
          routePatterns: bot.route_patterns,
          excludedRoutePatterns: bot.excluded_route_patterns,
          isDefault: bot.is_default
        }))}
      />
    </div>
  );
}
