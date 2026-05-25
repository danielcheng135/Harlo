import type {
  IntegrationActionPayload,
  IntegrationActionResult,
  IntegrationActionType,
  IntegrationProviderKey
} from "@/lib/integrations/types";

type RunIntegrationActionInput = {
  provider: IntegrationProviderKey;
  actionType: IntegrationActionType;
  payload: IntegrationActionPayload;
};

export async function runIntegrationAction({
  provider,
  actionType,
  payload
}: RunIntegrationActionInput): Promise<IntegrationActionResult> {
  // Provider API calls land here as each integration is connected.
  // The first dashboard slice uses this shared contract without sending data externally yet.
  return {
    ok: false,
    status: "skipped",
    message: `${provider}:${actionType} is not connected yet.`,
    externalRecordId: null,
    externalUrl: null,
    error: null
  };
}
