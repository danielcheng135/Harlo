import { IntegrationsWorkspace } from "@/components/integrations/integrations-workspace";
import {
  getBillingOverview,
  getIntegrationOverview,
  getWorkspaceOrRedirect,
  requireWorkspaceAdmin
} from "@/lib/harlo/data";
import { parseIntegrationProviderParam } from "@/lib/integrations/oauth";

type IntegrationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function IntegrationsPage({ searchParams }: IntegrationsPageProps) {
  const workspace = await getWorkspaceOrRedirect();
  requireWorkspaceAdmin(workspace);
  const billing = await getBillingOverview(workspace);
  const overview = await getIntegrationOverview(workspace, billing);
  const params = await searchParams;
  const rawTab = firstParam(params?.tab);
  const rawStatus = firstParam(params?.status);
  const rawIntegration = firstParam(params?.integration);

  return (
    <IntegrationsWorkspace
      initialTab={rawTab === "connected" || rawTab === "disconnected" ? rawTab : "all"}
      integrationStatus={rawStatus ?? null}
      statusProvider={parseIntegrationProviderParam(rawIntegration)}
      overview={overview}
    />
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
