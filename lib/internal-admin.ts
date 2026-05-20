export const INTERNAL_WORKSPACE_CREDIT_LIMIT = 1_000_000;
export const INTERNAL_WORKSPACE_AGENT_LIMIT = 25;
export const INTERNAL_WORKSPACE_SEAT_LIMIT = 10;

const INTERNAL_WORKSPACE_METADATA_KEY = "harlo_internal_workspace";

export function isInternalAdminEmail(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return false;
  }

  return getInternalAdminEmails().has(normalizedEmail);
}

export function getInternalAdminEmails() {
  const rawEmails = process.env.HARLO_INTERNAL_ADMIN_EMAILS ?? process.env.HARLO_INTERNAL_ADMIN_EMAIL ?? "";

  return new Set(
    rawEmails
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isInternalWorkspaceMetadata(metadata: unknown) {
  return isRecord(metadata) && metadata[INTERNAL_WORKSPACE_METADATA_KEY] === true;
}

export function withInternalWorkspaceMetadata(metadata: unknown) {
  const base = isRecord(metadata) ? metadata : {};

  return {
    ...base,
    [INTERNAL_WORKSPACE_METADATA_KEY]: true
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
