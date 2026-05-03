export type LeadFieldType = "text" | "email" | "phone" | "date";

export type LeadCaptureField = {
  key: string;
  label: string;
  type: LeadFieldType;
  required: boolean;
  enabled: boolean;
  prompt: string;
};

export type LeadDraft = Record<string, string>;

export const DEFAULT_LEAD_FIELDS: LeadCaptureField[] = [
  {
    key: "name",
    label: "Name",
    type: "text",
    required: true,
    enabled: true,
    prompt: "What is your name?"
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    required: true,
    enabled: true,
    prompt: "What email should the team use to follow up?"
  },
  {
    key: "phone",
    label: "Phone",
    type: "phone",
    required: false,
    enabled: false,
    prompt: "What phone number should the team use?"
  },
  {
    key: "company",
    label: "Company",
    type: "text",
    required: false,
    enabled: false,
    prompt: "What company are you with?"
  },
  {
    key: "service_needed",
    label: "Service needed",
    type: "text",
    required: false,
    enabled: false,
    prompt: "What service are you interested in?"
  },
  {
    key: "property_size",
    label: "Property size",
    type: "text",
    required: true,
    enabled: true,
    prompt: "What is the property size?"
  },
  {
    key: "preferred_date",
    label: "Preferred date",
    type: "date",
    required: true,
    enabled: true,
    prompt: "What date works best?"
  },
  {
    key: "budget",
    label: "Budget",
    type: "text",
    required: false,
    enabled: false,
    prompt: "Do you have a budget range in mind?"
  }
];

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_PATTERN = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/;

export function normalizeLeadFields(value: unknown): LeadCaptureField[] {
  if (!Array.isArray(value)) {
    return DEFAULT_LEAD_FIELDS;
  }

  const fields = value
    .map((field): LeadCaptureField | null => {
      if (!field || typeof field !== "object") {
        return null;
      }

      const record = field as Record<string, unknown>;
      const key = typeof record.key === "string" ? normalizeKey(record.key) : "";
      const type = isLeadFieldType(record.type) ? record.type : "text";
      const label = cleanText(typeof record.label === "string" ? record.label : keyToLabel(key), 50);
      const prompt = cleanText(typeof record.prompt === "string" ? record.prompt : `Please share your ${label.toLowerCase()}.`, 120);

      if (!key || !label || !prompt) {
        return null;
      }

      return {
        key,
        label,
        type,
        required: record.required !== false,
        enabled: record.enabled !== false,
        prompt
      };
    })
    .filter((field): field is LeadCaptureField => Boolean(field));

  const unique = new Map<string, LeadCaptureField>();
  fields.forEach((field) => {
    if (!unique.has(field.key)) {
      unique.set(field.key, field);
    }
  });

  const normalized = Array.from(unique.values()).slice(0, 8);
  const enabledRequired = normalized.filter((field) => field.enabled && field.required);

  return enabledRequired.length > 0 ? normalized : DEFAULT_LEAD_FIELDS;
}

export function getRequiredLeadFields(fields: LeadCaptureField[]) {
  return fields.filter((field) => field.enabled && field.required);
}

export function extractLeadDraftFromMessages(messages: Array<{ role: string; content: string }>, fields: LeadCaptureField[]) {
  return messages.reduce<LeadDraft>((draft, message, index) => {
    if (message.role !== "user") {
      return draft;
    }

    return {
      ...draft,
      ...extractLeadFieldsFromMessage(message.content, fields, messages, index)
    };
  }, {});
}

export function extractLeadFieldsFromMessage(
  message: string,
  fields: LeadCaptureField[],
  messages: Array<{ role: string; content: string }> = [],
  index = messages.length
) {
  const draft: LeadDraft = {};

  fields.filter((field) => field.enabled).forEach((field) => {
    const value = extractValueForField(message, field, messages, index);

    if (value) {
      draft[field.key] = value;
    }
  });

  return draft;
}

export function getMissingConfiguredLeadFields(draft: LeadDraft, fields: LeadCaptureField[]) {
  return getRequiredLeadFields(fields).filter((field) => !draft[field.key]);
}

export function isConfiguredLeadComplete(draft: LeadDraft, fields: LeadCaptureField[]) {
  return getMissingConfiguredLeadFields(draft, fields).length === 0;
}

export function buildConfiguredLeadReply(draft: LeadDraft, fields: LeadCaptureField[]) {
  const missing = getMissingConfiguredLeadFields(draft, fields);

  if (missing.length === 0) {
    const name = draft.name ? `, ${draft.name}` : "";
    const email = draft.email ? ` at ${draft.email}` : "";
    return `Thanks${name}. I shared your request with the team, and they can follow up${email}.`;
  }

  const nextField = missing[0];
  const prefix = Object.keys(draft).length > 0 ? "Got it. " : "";

  return `${prefix}${nextField.prompt}`;
}

export function configuredLeadMetadata(draft: LeadDraft, fields: LeadCaptureField[]) {
  const enabledFields = fields.filter((field) => field.enabled);

  return enabledFields.reduce<Record<string, unknown>>((metadata, field) => {
    const value = draft[field.key];

    if (!value || field.key === "name" || field.key === "email") {
      return metadata;
    }

    metadata[field.key] = value;
    metadata[`${field.key}_label`] = field.label;
    metadata[`${field.key}_type`] = field.type;
    return metadata;
  }, {});
}

export function normalizeLeadMetadata(metadata: Record<string, unknown>, fields: LeadCaptureField[]) {
  const enabledFields = fields.filter((field) => field.enabled);

  return enabledFields.reduce<Record<string, unknown>>((current, field) => {
    const rawValue = current[field.key];

    if (typeof rawValue !== "string") {
      return current;
    }

    const normalized = normalizeFieldValue(rawValue, field.type);
    current[field.key] = normalized ?? rawValue;
    current[`${field.key}_label`] = field.label;
    current[`${field.key}_type`] = field.type;
    return current;
  }, { ...metadata });
}

export function normalizeDateValue(value: string) {
  const trimmed = value.trim().replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, "$1");
  const numeric = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);

  if (numeric) {
    const month = Number(numeric[1]);
    const day = Number(numeric[2]);
    const year = normalizeYear(Number(numeric[3]));
    return formatDateParts(month, day, year);
  }

  const monthName = trimmed.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:,)?\s+(\d{2}|\d{4})\b/i
  );

  if (monthName) {
    const month = monthNameToNumber(monthName[1]);
    const day = Number(monthName[2]);
    const year = normalizeYear(Number(monthName[3]));
    return formatDateParts(month, day, year);
  }

  return null;
}

function extractValueForField(message: string, field: LeadCaptureField, messages: Array<{ role: string; content: string }>, index: number) {
  if (field.type === "email" || field.key === "email") {
    return message.match(EMAIL_PATTERN)?.[0]?.toLowerCase() ?? null;
  }

  if (field.type === "phone" || field.key === "phone") {
    return message.match(PHONE_PATTERN)?.[0]?.replace(/[^\d+]/g, "") ?? null;
  }

  if (field.type === "date" || field.key.includes("date")) {
    const explicit = extractLabeledValue(message, field);
    const date = normalizeDateValue(explicit ?? message);
    return date;
  }

  if (field.key === "name") {
    return extractName(message, messages, index);
  }

  if (field.key === "property_size") {
    return (
      extractLabeledValue(message, field) ??
      message.match(/\b(?:property\s*)?size\s+(?:is|=)\s*([^,\n]+?)(?=\s+(?:and\s+)?(?:preferred\s+)?date\s+(?:is|=)|$)/i)?.[1]?.trim() ??
      message.match(/\b(\d{2,5}\s*(?:sq\s*ft|sqft|square feet|sf))\b/i)?.[1]?.trim() ??
      null
    );
  }

  return extractLabeledValue(message, field) ?? null;
}

function extractName(message: string, messages: Array<{ role: string; content: string }>, index: number) {
  const email = message.match(EMAIL_PATTERN)?.[0];
  const explicitName =
    message.match(/\bname\s*:\s*([a-z][a-z .'-]{1,70})(?=\s+(?:email|size|date|phone|company)\s*:|$)/i)?.[1] ??
    message.match(/\b(?:my name is|name is|i am|i'm|this is)\s+([a-z][a-z .'-]{1,70})(?=\s+(?:and\s+)?(?:my\s+)?(?:email|e-mail|phone)\b|$)/i)?.[1];
  const beforeEmail = message
    .slice(0, email ? message.indexOf(email) : message.length)
    .replace(/\b(?:and\s+)?(?:my\s+)?(?:email|e-mail)(?:\s+address)?\s+(?:is|:)?\s*$/i, "")
    .trim();
  const fallbackNameMatch =
    beforeEmail.match(/(?:my name is|name is|i am|i'm|this is)\s+([a-z][a-z .'-]{1,58})(?:\s+and)?$/i) ??
    (email ? beforeEmail.match(/^([a-z][a-z .'-]{1,60})$/i) : null);
  const standaloneName = previousAssistantAskedForField(messages, index, "name") && isStandaloneName(message) ? message.trim() : null;

  return cleanName(explicitName ?? fallbackNameMatch?.[1] ?? standaloneName);
}

function extractLabeledValue(message: string, field: LeadCaptureField) {
  const labels = [field.key.replace(/_/g, "\\s+"), escapeRegExp(field.label).replace(/\\ /g, "\\s+")];
  const pattern = new RegExp(`\\b(?:${labels.join("|")})\\s*(?::|is|=)\\s*([^,\\n]+?)(?=\\s+(?:email|name|phone|date|preferred\\s+date|property\\s+size|company|service|budget)\\s*(?::|is|=)|$)`, "i");

  return message.match(pattern)?.[1]?.trim() ?? null;
}

function normalizeFieldValue(value: string, type: LeadFieldType) {
  if (type === "date") {
    return normalizeDateValue(value);
  }

  if (type === "email") {
    return value.match(EMAIL_PATTERN)?.[0]?.toLowerCase() ?? null;
  }

  if (type === "phone") {
    return value.match(PHONE_PATTERN)?.[0]?.replace(/[^\d+]/g, "") ?? null;
  }

  return cleanText(value, 120);
}

function previousAssistantAskedForField(messages: Array<{ role: string; content: string }>, index: number, fieldKey: string) {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const message = messages[cursor];

    if (message.role === "user") {
      return false;
    }

    if (message.role === "assistant") {
      return new RegExp(`\\b(?:share|provide|send|what is|what's)\\b[\\s\\S]{0,80}\\b(?:your\\s+)?${escapeRegExp(fieldKey.replace(/_/g, " "))}\\b`, "i").test(message.content);
    }
  }

  return false;
}

function isStandaloneName(message: string) {
  const trimmed = message.trim();

  return (
    /^[a-z][a-z .'-]{1,60}$/i.test(trimmed) &&
    !EMAIL_PATTERN.test(trimmed) &&
    !/\d|@|:|\b(?:quote|price|service|size|date|property|cleaning|sure|please|that|do|ok|okay|yes|no|thanks|thank|alright|fine|good|help|show|tell)\b/i.test(trimmed)
  );
}

function cleanName(value: string | null | undefined) {
  return value
    ?.replace(/\b(?:and\s+)?(?:my\s+)?(?:email|e-mail)(?:\s+address)?\s+(?:is|:)?\s*$/i, "")
    .replace(/[,.\s]+$/g, "")
    .trim();
}

function cleanText(value: string | undefined, maxLength: number) {
  const text = value?.trim();

  return text ? text.slice(0, maxLength) : "";
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
}

function keyToLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isLeadFieldType(value: unknown): value is LeadFieldType {
  return value === "text" || value === "email" || value === "phone" || value === "date";
}

function normalizeYear(year: number) {
  return year < 100 ? 2000 + year : year;
}

function formatDateParts(month: number, day: number, year: number) {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
    return null;
  }

  return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
}

function monthNameToNumber(month: string) {
  return ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].findIndex((prefix) =>
    month.toLowerCase().startsWith(prefix)
  ) + 1;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
