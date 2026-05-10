import { KnowledgeWorkspace } from "@/components/knowledge/knowledge-workspace";
import { getKnowledgeSources, getWorkspaceOrRedirect, requireWorkspaceAdmin } from "@/lib/harlo/data";

export default async function KnowledgePage() {
  const workspace = await getWorkspaceOrRedirect();
  requireWorkspaceAdmin(workspace);
  const sources = await getKnowledgeSources(workspace);

  return <KnowledgeWorkspace sources={sources} brandLogoUrl={workspace.organization.brand_logo_url ?? null} />;
}
