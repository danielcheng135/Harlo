import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { IntegrationProviderKey } from "@/lib/integrations/types";

export type IntegrationOAuthState = {
  organizationId: string;
  userId: string;
  provider: IntegrationProviderKey;
  nonce: string;
  returnTo: string;
  exp: number;
};

function getStateSecret() {
  const secret = process.env.INTEGRATION_OAUTH_STATE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("Missing integration OAuth state secret.");
  }

  return secret;
}

export function createIntegrationOAuthState(input: Omit<IntegrationOAuthState, "nonce" | "exp">) {
  const state: IntegrationOAuthState = {
    ...input,
    nonce: randomBytes(16).toString("base64url"),
    exp: Math.floor(Date.now() / 1000) + 10 * 60
  };
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  const signature = signStatePayload(payload);

  return `${payload}.${signature}`;
}

export function verifyIntegrationOAuthState(value: string | null | undefined): IntegrationOAuthState | null {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = signStatePayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const state = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<IntegrationOAuthState>;

    if (!state.organizationId || !state.userId || !state.provider || !state.nonce || !state.returnTo || !state.exp) {
      return null;
    }

    if (state.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return state as IntegrationOAuthState;
  } catch {
    return null;
  }
}

function signStatePayload(payload: string) {
  return createHmac("sha256", getStateSecret()).update(payload).digest("base64url");
}
