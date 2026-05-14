import { HARLO_MODELS, getOpenAIClient } from "@/lib/ai/openai";
import {
  extractLeadDraftFromMessages,
  type LeadCaptureField,
  type LeadDraft,
  normalizeLeadDraftValue
} from "@/lib/lead-fields";

type LeadMessage = {
  role: string;
  content: string;
};

export async function extractLeadDraftWithModel(messages: LeadMessage[], fields: LeadCaptureField[]) {
  const fallbackDraft = extractLeadDraftFromMessages(messages, fields);
  const enabledFields = fields.filter((field) => field.enabled);

  if (enabledFields.length === 0) {
    return fallbackDraft;
  }

  try {
    const openai = getOpenAIClient();
    const response = await openai.responses.create({
      model: HARLO_MODELS.leadExtract,
      instructions: [
        "Extract lead capture fields for a business website chatbot from the full conversation.",
        "Return only JSON with this shape: {\"fields\":{\"field_key\":\"value or null\"}}.",
        "Return every field key you were given. Use null when the visitor has not supplied a usable value.",
        "Use the latest visitor correction when the visitor says things like actually, sorry, I mean, or correction.",
        "Do not treat filler words, apologies, articles, or acknowledgements as a name.",
        "Never output a single common word such as the, sorry, actually, hi, hello, yes, or no as a name.",
        "If the visitor corrects their name, output only the corrected name.",
        "Combine related short replies across turns. For example, if a visitor said June 10 and later says 2026, output the date as 06/10/2026.",
        "For date fields, output MM/DD/YYYY only when month, day, and year are known. If the year is unknown, return null for that field.",
        "Do not infer the year from today's date. Ask for it later if the visitor did not provide it.",
        "Do not invent missing values. Do not output placeholder names like Website visitor.",
        `Today is ${getTodayIsoDate()}.`
      ].join("\n"),
      input: [
        "Lead fields:",
        enabledFields.map((field) => `- ${field.key}: ${field.label} (${field.type})`).join("\n"),
        "",
        "Conversation:",
        messages
          .map((message) => `${message.role === "assistant" ? "Assistant" : "Visitor"}: ${message.content}`)
          .join("\n")
      ].join("\n"),
      max_output_tokens: 300
    });

    const modelValues = parseModelDraft(response.output_text);
    const modelDraft = sanitizeModelDraft(modelValues, enabledFields);

    return mergeWithModelAuthority(fallbackDraft, modelDraft, modelValues, enabledFields);
  } catch (error) {
    console.error("Lead extraction model failed", error);
    return fallbackDraft;
  }
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseModelDraft(value: string) {
  try {
    const parsed = JSON.parse(value) as { fields?: Record<string, unknown> };
    return parsed.fields && typeof parsed.fields === "object" ? parsed.fields : {};
  } catch {
    return {};
  }
}

function sanitizeModelDraft(values: Record<string, unknown>, fields: LeadCaptureField[]) {
  const fieldByKey = new Map(fields.map((field) => [field.key, field]));

  return Object.entries(values).reduce<LeadDraft>((draft, [key, value]) => {
    const field = fieldByKey.get(key);

    if (!field || typeof value !== "string") {
      return draft;
    }

    const normalized = normalizeLeadDraftValue(value, field);

    if (normalized) {
      draft[key] = normalized;
    }

    return draft;
  }, {});
}

function mergeWithModelAuthority(
  fallbackDraft: LeadDraft,
  modelDraft: LeadDraft,
  modelValues: Record<string, unknown>,
  fields: LeadCaptureField[]
) {
  const modelKeys = new Set(Object.keys(modelValues));

  if (modelKeys.size === 0) {
    return {
      ...fallbackDraft,
      ...modelDraft
    };
  }

  return fields.reduce<LeadDraft>(
    (draft, field) => {
      if (!modelKeys.has(field.key)) {
        return draft;
      }

      const modelValue = modelDraft[field.key];

      if (modelValue) {
        draft[field.key] = modelValue;
      } else if (fallbackDraft[field.key] && shouldKeepFallbackWhenModelNull(field)) {
        draft[field.key] = fallbackDraft[field.key];
      } else {
        delete draft[field.key];
      }

      return draft;
    },
    { ...fallbackDraft }
  );
}

function shouldKeepFallbackWhenModelNull(field: LeadCaptureField) {
  return field.type === "date" || field.type === "email" || field.type === "phone";
}
