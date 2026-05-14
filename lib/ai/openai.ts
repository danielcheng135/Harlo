import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  client ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  return client;
}

export const HARLO_MODELS = {
  answer: process.env.OPENAI_ANSWER_MODEL ?? "gpt-5.4-mini",
  classify: process.env.OPENAI_CLASSIFY_MODEL ?? "gpt-5.4-nano",
  leadExtract: process.env.OPENAI_LEAD_EXTRACT_MODEL ?? "gpt-5.4-nano",
  embedding: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small"
};
