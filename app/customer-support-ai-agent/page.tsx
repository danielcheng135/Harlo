import { SeoLandingPageTemplate } from "@/components/seo/seo-landing-page";
import { createNoIndexPageMetadata, seoLandingPages } from "@/lib/seo";

const page = seoLandingPages.customerSupportAiAgent;

export const metadata = createNoIndexPageMetadata(page);

export default function CustomerSupportAiAgentPage() {
  return <SeoLandingPageTemplate page={page} />;
}
