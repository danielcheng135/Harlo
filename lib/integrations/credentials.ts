import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getCredentialKey() {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("Missing integration credential encryption key.");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptIntegrationCredentials(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getCredentialKey(), iv);
  const plaintext = JSON.stringify(value ?? {});
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64")).join(".");
}

export function decryptIntegrationCredentials<T = Record<string, unknown>>(value: string): T {
  const [ivValue, tagValue, encryptedValue] = value.split(".");

  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Invalid encrypted integration credentials.");
  }

  const decipher = createDecipheriv(ALGORITHM, getCredentialKey(), Buffer.from(ivValue, "base64"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64")),
    decipher.final()
  ]).toString("utf8");

  return JSON.parse(decrypted) as T;
}
