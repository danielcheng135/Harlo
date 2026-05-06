import { TeamWorkspace } from "@/components/team/team-workspace";
import { Badge } from "@/components/ui/badge";
import { getBillingOverview, getTeamOverview, getWorkspaceOrRedirect, requireWorkspaceAdmin } from "@/lib/harlo/data";

export default async function TeamPage() {
  const workspace = await getWorkspaceOrRedirect();
  requireWorkspaceAdmin(workspace);
  const billing = await getBillingOverview(workspace);
  const team = await getTeamOverview(workspace, billing);

  return (
    <div className="space-y-6">
      <div>
        <Badge>Team</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-harlo-ink">Team</h1>
        <p className="mt-2 text-harlo-muted">Invite teammates, manage workspace access, and track seat usage.</p>
      </div>

      <TeamWorkspace team={team} />
    </div>
  );
}
