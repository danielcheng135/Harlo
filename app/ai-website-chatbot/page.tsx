import { SeoLandingPageTemplate } from "@/components/seo/seo-landing-page";
import { createPageMetadata, seoLandingPages } from "@/lib/seo";

const page = seoLandingPages.aiWebsiteChatbot;

export const metadata = createPageMetadata(page);

export default function AiWebsiteChatbotPage() {
  return <SeoLandingPageTemplate page={page} />;
}
