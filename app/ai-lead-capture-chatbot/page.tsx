import { SeoLandingPageTemplate } from "@/components/seo/seo-landing-page";
import { createNoIndexPageMetadata, seoLandingPages } from "@/lib/seo";

const page = seoLandingPages.aiLeadCaptureChatbot;

export const metadata = createNoIndexPageMetadata(page);

export default function AiLeadCaptureChatbotPage() {
  return <SeoLandingPageTemplate page={page} />;
}
