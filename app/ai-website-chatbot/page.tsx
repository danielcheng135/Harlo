import { SeoLandingPageTemplate } from "@/components/seo/seo-landing-page";
import { createNoIndexPageMetadata, seoLandingPages } from "@/lib/seo";

const page = seoLandingPages.aiWebsiteChatbot;

export const metadata = createNoIndexPageMetadata(page);

export default function AiWebsiteChatbotPage() {
  return <SeoLandingPageTemplate page={page} />;
}
