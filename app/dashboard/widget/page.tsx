import { WidgetInstallPanel } from "@/components/settings/widget-install-panel";
import { Badge } from "@/components/ui/badge";
import { getWorkspaceOrRedirect } from "@/lib/harlo/data";

export default async function WidgetPage() {
  const workspace = await getWorkspaceOrRedirect();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Badge>Widget</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">Widget install</h1>
        <p className="mt-2 text-harlo-muted">Control allowed domains and copy the website embed snippet.</p>
      </div>
      <WidgetInstallPanel botId={workspace.bot.id} allowedDomains={workspace.bot.allowed_domains} />
    </div>
  );
}
