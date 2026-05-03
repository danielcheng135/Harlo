const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

export type LeadDraft = {
  name?: string;
  email?: string;
  propertySize?: string;
  preferredDate?: string;
};

export function extractLeadDraft(messages: string[]) {
  return messages.reduce<LeadDraft>((current, message) => mergeLeadDraft(current, extractLeadFields(message)), {});
}

export function extractLeadDraftFromConversation(messages: Array<{ role: string; content: string }>) {
  const draft = messages.reduce<LeadDraft>((current, message, index) => {
    if (message.role !== "user") {
      return current;
    }

    const next = mergeLeadDraft(current, extractLeadFields(message.content));

    if (!next.name && isStandaloneName(message.content) && previousAssistantAskedForName(messages, index)) {
      next.name = message.content.trim();
    }

    return next;
  }, {});

  return draft;
}

function previousAssistantAskedForName(messages: Array<{ role: string; content: string }>, index: number) {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const message = messages[cursor];

    if (message.role === "user") {
      return false;
    }

    if (message.role === "assistant") {
      return /\b(?:share|provide|send|what is|what's)\b[\s\S]{0,80}\b(?:your\s+)?name\b/i.test(message.content);
    }
  }

  return false;
}

export function extractLeadFromMessage(message: string) {
  const draft = extractLeadFields(message);

  if (!draft.email) {
    return null;
  }

  return {
    name: draft.name ?? "Website visitor",
    email: draft.email,
    propertySize: draft.propertySize,
    preferredDate: draft.preferredDate
  };
}

export function extractLeadFields(message: string): LeadDraft {
  const email = message.match(EMAIL_PATTERN)?.[0];
  const explicitName =
    message.match(/\bname\s*:\s*([a-z][a-z .'-]{1,70})(?=\s+(?:email|size|date)\s*:|$)/i)?.[1] ??
    message.match(/\b(?:my name is|name is|i am|i'm|this is)\s+([a-z][a-z .'-]{1,70})(?=\s+(?:and\s+)?(?:my\s+)?(?:email|e-mail)\b|$)/i)?.[1];
  const beforeEmail = message
    .slice(0, email ? message.indexOf(email) : message.length)
    .replace(/\b(?:and\s+)?(?:my\s+)?(?:email|e-mail)(?:\s+address)?\s+(?:is|:)?\s*$/i, "")
    .trim();
  const fallbackNameMatch =
    beforeEmail.match(/(?:my name is|name is|i am|i'm|this is)\s+([a-z][a-z .'-]{1,58})(?:\s+and)?$/i) ??
    (email ? beforeEmail.match(/^([a-z][a-z .'-]{1,60})$/i) : null);
  const name =
    (explicitName ?? fallbackNameMatch?.[1])
      ?.replace(/\b(?:and\s+)?(?:my\s+)?(?:email|e-mail)(?:\s+address)?\s+(?:is|:)?\s*$/i, "")
      .replace(/[,.\s]+$/g, "")
      .trim();
  const propertySize =
    message.match(/\b(?:property\s*)?size\s*:\s*([^,\n]+?)(?=\s+(?:date|preferred date|email|name)\s*:|$)/i)?.[1]?.trim() ??
    message.match(/\b(?:property\s*)?size\s+(?:is|=)\s*([^,\n]+?)(?=\s+(?:and\s+)?(?:preferred\s+)?date\s+(?:is|=)|$)/i)?.[1]?.trim() ??
    message.match(/\b(\d{2,5}\s*(?:sq\s*ft|sqft|square feet|sf))\b/i)?.[1]?.trim();
  const preferredDate =
    message.match(/\b(?:preferred\s*)?date\s*:\s*([^,\n]+?)(?=\s+(?:email|name|size)\s*:|$)/i)?.[1]?.trim() ??
    message.match(/\b(?:preferred\s*)?date\s+(?:is|=)\s*([^,\n]+?)(?=\s+(?:email|name|(?:property\s*)?size)\s+(?:is|=)|$)/i)?.[1]?.trim() ??
    message.match(/\b((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,)?\s+\d{2,4})\b/i)?.[1]?.trim() ??
    message.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/)?.[1]?.trim();

  return {
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
    ...(propertySize ? { propertySize } : {}),
    ...(preferredDate ? { preferredDate } : {})
  };
}

export function mergeLeadDraft(current: LeadDraft, next: LeadDraft): LeadDraft {
  return {
    name: next.name ?? current.name,
    email: next.email ?? current.email,
    propertySize: next.propertySize ?? current.propertySize,
    preferredDate: next.preferredDate ?? current.preferredDate
  };
}

export function getMissingLeadFields(draft: LeadDraft) {
  return [
    !draft.name ? "your name" : null,
    !draft.email ? "your email" : null,
    !draft.propertySize ? "property size" : null,
    !draft.preferredDate ? "preferred date" : null
  ].filter(Boolean) as string[];
}

export function isLeadDraftComplete(draft: LeadDraft, requireQuoteDetails = false) {
  if (!draft.name || !draft.email) {
    return false;
  }

  if (requireQuoteDetails) {
    return Boolean(draft.propertySize && draft.preferredDate);
  }

  return true;
}

export function buildLeadCaptureReply(draft: LeadDraft, requireQuoteDetails = false) {
  const missing = requireQuoteDetails
    ? getMissingLeadFields(draft)
    : [!draft.name ? "your name" : null, !draft.email ? "your email" : null].filter(Boolean) as string[];

  if (missing.length === 0 && isLeadDraftComplete(draft, requireQuoteDetails)) {
    return `Thanks, ${draft.name ?? "there"}. I shared your request with the team, and they can follow up at ${draft.email}.`;
  }

  const hasAnyDetails = Boolean(draft.name || draft.email || draft.propertySize || draft.preferredDate);
  const prefix = hasAnyDetails ? `Got it${draft.name ? `, ${draft.name}` : ""}.` : "I can help with a quote.";

  return `${prefix} Please share ${formatMissingFields(missing)}.`;
}

export function isLikelyContactFollowUp(message: string) {
  if (isDeclineOnly(message)) {
    return false;
  }

  const fields = extractLeadFields(message);
  return Boolean(
    fields.name ||
      fields.email ||
      fields.propertySize ||
      fields.preferredDate ||
      mentionsEmail(message) ||
      (isStandaloneName(message) && !isConfirmationOnly(message))
  );
}

export function isLeadCollectionContinuation(message: string) {
  const trimmed = message.trim();

  if (isConfirmationOnly(trimmed) || isDeclineOnly(trimmed)) {
    return false;
  }

  if (isLikelyContactFollowUp(trimmed)) {
    return true;
  }

  if (/[?]/.test(trimmed)) {
    return false;
  }

  if (/\b(?:service|services|price|pricing|cost|hours|open|available|offer|offers)\b/i.test(trimmed)) {
    return false;
  }

  return trimmed.split(/\s+/).length <= 10;
}

export function isHandoffConfirmation(message: string) {
  return isConfirmationOnly(message);
}

export function isHandoffDecline(message: string) {
  return isDeclineOnly(message);
}

export function assistantOfferedSpecificFollowUp(messages: Array<{ role: string; content: string }>) {
  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");

  if (!lastAssistant) {
    return false;
  }

  return /\b(?:i can also|if you want|would you like|i can share|i can show|i can help with|i can help you|do you want)\b/i.test(
    lastAssistant.content
  );
}

export function buildLeadHandoffReply(draft: LeadDraft) {
  const missing = [!draft.name ? "your name" : null, !draft.email ? "your email" : null].filter(Boolean) as string[];

  if (missing.length === 0 && draft.email) {
    return `Thanks, ${draft.name ?? "there"}. I shared your request with the team, and they can follow up at ${draft.email}.`;
  }

  return `I can have the team follow up with you. Please share ${formatMissingFields(missing)}.`;
}

export function isLeadCollectionContext(messages: Array<{ role: string; content: string }>) {
  return messages.some((message) => {
    const content = message.content.toLowerCase();
    return (
      (message.role === "assistant" && content.includes("please share") && content.includes("email")) ||
      (message.role === "user" && /\bquote\b/.test(content))
    );
  });
}

export function isQuoteLeadCollectionContext(messages: Array<{ role: string; content: string }>) {
  return messages.some((message) => {
    const content = message.content.toLowerCase();

    return (
      /\bquote\b/.test(content) ||
      (content.includes("property size") && (content.includes("preferred date") || content.includes("date")))
    );
  });
}

export function getInvalidEmailReply(message: string) {
  if (!mentionsEmail(message) || EMAIL_PATTERN.test(message)) {
    return null;
  }

  return "That email does not look valid yet. Please share a full email address, like name@example.com.";
}

function formatMissingFields(fields: string[]) {
  if (fields.length === 1) {
    return fields[0];
  }

  if (fields.length === 2) {
    return `${fields[0]} and ${fields[1]}`;
  }

  return `${fields.slice(0, -1).join(", ")}, and ${fields[fields.length - 1]}`;
}

function mentionsEmail(message: string) {
  return /\b(?:email|e-mail)\b/i.test(message);
}

function isStandaloneName(message: string) {
  const trimmed = message.trim();

  return (
    /^[a-z][a-z .'-]{1,60}$/i.test(trimmed) &&
    !mentionsEmail(trimmed) &&
    !isConfirmationOnly(trimmed) &&
    !isDeclineOnly(trimmed) &&
    !/\d|@|:|\b(?:quote|price|service|size|date|property|cleaning|sure|please|that|do|ok|okay|yes|no|thanks|thank|alright|fine|good|help|show|tell)\b/i.test(trimmed)
  );
}

function isConfirmationOnly(message: string) {
  return /^(?:yes|yeah|yep|sure|ok|okay|please|yes please|yeah please|sure please|do that|yes do that|yes please do that|please do that|that sounds good|sounds good|go ahead|show me|show me that|tell me|tell me more)$/i.test(
    message.trim().replace(/[.!]+$/g, "")
  );
}

function isDeclineOnly(message: string) {
  return /^(?:no|nope|nah|no thanks|no thank you|not now|not right now|i'm good|im good|all good|that's all|thats all)$/i.test(
    message.trim().replace(/[.!]+$/g, "")
  );
}

export function leadMetadataFromDraft(draft: LeadDraft) {
  return {
    ...(draft.propertySize ? { property_size: draft.propertySize } : {}),
    ...(draft.preferredDate ? { preferred_date: draft.preferredDate } : {})
  };
}

export function leadQuestionFromMessages(messages: string[], email?: string) {
  return (
    messages.find((message) => {
      const fields = extractLeadFields(message);
      return message !== email && !fields.email && !fields.name && !fields.propertySize && !fields.preferredDate;
    }) ?? messages[0] ?? "Website inquiry"
  );
}
