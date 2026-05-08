import { SeoLandingPageTemplate } from "@/components/seo/seo-landing-page";
import { createPageMetadata, seoLandingPages } from "@/lib/seo";

const page = seoLandingPages.smallBusinessWebsiteChatbot;

export const metadata = createPageMetadata(page);

export default function WebsiteChatbotForSmallBusinessPage() {
  return <SeoLandingPageTemplate page={page} />;
}
