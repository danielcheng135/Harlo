import type { Metadata } from "next";
import { SlackLandingPage } from "@/components/landing/slack-landing-page";

export const metadata: Metadata = {
  title: {
    absolute: "Harlo Slack Integration | Send Website Leads to Slack"
  },
  description:
    "Connect Harlo to Slack so qualified website leads, visitor questions, and handoff context are sent to the channels your team already uses.",
  alternates: {
    canonical: "/slack"
  },
  openGraph: {
    title: "Harlo Slack Integration | Send Website Leads to Slack",
    description:
      "Connect Harlo to Slack so qualified website leads, visitor questions, and handoff context are sent to the channels your team already uses.",
    url: "/slack",
    siteName: "Harlo",
    images: [{ url: "/harlo-site-preview.svg", width: 1200, height: 760, alt: "Harlo AI website chatbot product preview" }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Harlo Slack Integration | Send Website Leads to Slack",
    description:
      "Connect Harlo to Slack so qualified website leads, visitor questions, and handoff context are sent to the channels your team already uses.",
    images: ["/harlo-site-preview.svg"]
  }
};

export default function SlackPage() {
  return <SlackLandingPage />;
}
