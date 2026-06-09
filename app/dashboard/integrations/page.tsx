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
  const params = await searchParams;
  const rawTab = firstParam(params?.tab);
  const rawStatus = firstParam(params?.status);
  const rawIntegration = firstParam(params?.integration);
  const initialTab = rawTab === "connected" || rawTab === "disconnected" || rawTab === "history"
    ? rawTab
    : "all";
  const historyPage = parsePage(firstParam(params?.page));
  const overview = await getIntegrationOverview(workspace, billing, {
    includeHistory: initialTab === "history",
    historyPage
  });

  return (
    <IntegrationsWorkspace
      initialTab={initialTab}
      integrationStatus={rawStatus ?? null}
      statusProvider={parseIntegrationProviderParam(rawIntegration)}
      overview={overview}
    />
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}
