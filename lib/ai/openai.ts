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

function getModelEnv(name: string, fallback: string) {
  const value = process.env[name];

  return value && value.trim() ? value.trim() : fallback;
}

export const HARLO_MODELS = {
  answer: getModelEnv("OPENAI_ANSWER_MODEL", "gpt-5.4-mini"),
  classify: getModelEnv("OPENAI_CLASSIFY_MODEL", "gpt-5.4-nano"),
  leadExtract: getModelEnv("OPENAI_LEAD_EXTRACT_MODEL", "gpt-5.4-nano"),
  planner: getModelEnv("OPENAI_PLANNER_MODEL", "gpt-5.4-mini"),
  embedding: getModelEnv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
};
