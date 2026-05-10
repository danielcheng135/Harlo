export type BotConfig = {
  id: string;
  name: string;
  organizationId: string;
  businessName: string;
  brandLogoUrl: string | null;
  greeting: string;
  fallbackMessage: string;
  tone: "calm" | "friendly" | "concise";
  allowedDomains: string[];
  removeBranding: boolean;
  theme: {
    accent: string;
    launcherPosition: "bottom-right" | "bottom-left";
    title: string;
    welcomePrompts: string[];
  };
};

export type KnowledgeChunk = {
  id: string;
  botId: string;
  sourceId: string;
  sourceTitle: string;
  content: string;
  similarity?: number;
};

export type ChatRequest = {
  botId: string;
  conversationId?: string;
  message: string;
  visitor?: {
    anonymousId?: string;
    pageUrl?: string;
    referrer?: string;
  };
};

export type LeadCaptureRequest = {
  botId: string;
  conversationId?: string;
  name: string;
  email: string;
  question: string;
  pageUrl?: string;
};
