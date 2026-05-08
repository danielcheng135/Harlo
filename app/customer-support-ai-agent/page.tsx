import { SeoLandingPageTemplate } from "@/components/seo/seo-landing-page";
import { createPageMetadata, seoLandingPages } from "@/lib/seo";

const page = seoLandingPages.customerSupportAiAgent;

export const metadata = createPageMetadata(page);

export default function CustomerSupportAiAgentPage() {
  return <SeoLandingPageTemplate page={page} />;
}
