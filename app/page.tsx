import type { Metadata } from "next";
import { RootHomepage } from "@/components/landing/root-homepage";
import { homeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: "Harlo | AI Agent for Website Answers and Qualified Leads"
  },
  description:
    "Harlo is an AI website chatbot that automates customer support, answers from approved knowledge, and captures qualified leads from every website conversation.",
  alternates: {
    canonical: "/"
  }
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeJsonLd())
        }}
      />
      <RootHomepage />
    </>
  );
}
