import { SeoLandingPageTemplate } from "@/components/seo/seo-landing-page";
import { createPageMetadata, seoLandingPages } from "@/lib/seo";

const page = seoLandingPages.aiLeadCaptureChatbot;

export const metadata = createPageMetadata(page);

export default function AiLeadCaptureChatbotPage() {
  return <SeoLandingPageTemplate page={page} />;
}
