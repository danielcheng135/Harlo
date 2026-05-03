import Link from "next/link";
import { ArrowRight, CheckCircle2, Code2, Database, MessageSquare, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ChatWidgetPreview } from "@/components/chat-widget-preview";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

const features = [
  { title: "Train from your website", body: "Crawl pages and upload documents so Harlo answers from business-approved knowledge.", icon: Database },
  { title: "Customize the widget", body: "Match brand colors, tone, greeting, and lead capture behavior from one dashboard.", icon: Sparkles },
  { title: "Capture better leads", body: "When the answer needs a person, Harlo collects contact details and conversation context.", icon: MessageSquare },
  { title: "Install with one snippet", body: "Paste a small script on any website and launch a polished popup chatbot.", icon: Code2 }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$39",
    description: "For owner-led sites that need reliable answers and lead capture.",
    features: ["1 AI chatbot", "1,000 AI conversations/month", "Up to 100 knowledge pages", "Lead capture and basic analytics"],
    cta: "Start Starter"
  },
  {
    name: "Growth",
    price: "$89",
    description: "For growing teams that want more volume, integrations, and freshness.",
    features: ["2 AI chatbots", "5,000 AI conversations/month", "Up to 1,000 knowledge pages", "Monthly auto-refresh and Slack alerts"],
    cta: "Start Growth",
    highlighted: true
  },
  {
    name: "Pro",
    price: "$249",
    description: "For multi-location or high-intent sites turning chat into pipeline.",
    features: ["5 AI chatbots", "20,000 AI conversations/month", "Up to 10,000 knowledge pages", "Custom domain, API access, and priority support"],
    cta: "Start Pro"
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For teams with security, compliance, or custom workflow needs.",
    features: ["Custom conversation volume", "Advanced roles and permissions", "Dedicated onboarding", "SLA, DPA, and custom integrations"],
    cta: "Talk to sales"
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-harlo-canvas">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <BrandLogo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-harlo-muted md:flex">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#demo">Demo</a>
        </nav>
        <Link href="/dashboard">
          <Button>Open dashboard</Button>
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-16 pt-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-harlo-line bg-white px-3 py-1 text-sm font-medium text-harlo-teal">
            <Sparkles size={15} />
            AI support for SMB websites
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-harlo-ink md:text-6xl">
            Harlo answers customer questions from your business knowledge.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-harlo-muted">
            Add a modern AI chatbot to any website, train it on pages and files, customize the widget, and turn unanswered questions into qualified leads.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard">
              <Button className="w-full sm:w-auto">
                Start building <ArrowRight size={16} />
              </Button>
            </Link>
            <a href="#demo">
              <Button variant="secondary" className="w-full sm:w-auto">View demo</Button>
            </a>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-harlo-muted sm:grid-cols-3">
            {["Website + file knowledge", "Lead capture fallback", "Simple widget install"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-harlo-teal" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div id="demo">
          <ChatWidgetPreview />
        </div>
      </section>

      <section id="features" className="border-y border-harlo-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-14 md:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-none">
              <CardBody>
                <feature.icon size={22} className="text-harlo-teal" />
                <h2 className="mt-5 text-base font-semibold text-harlo-ink">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-harlo-muted">{feature.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-harlo-ink">Pricing that scales with real conversations.</h2>
            <p className="mt-3 text-harlo-muted">
              Harlo starts in the same range as lightweight AI chatbot tools, then scales by conversation volume, knowledge size, and support workflow depth.
            </p>
          </div>
          <p className="max-w-sm text-sm leading-6 text-harlo-muted md:text-right">
            Annual plans should include 2 months free. Extra AI conversations can be sold at $20 per 1,000.
          </p>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {pricingPlans.map((plan) => (
            <Card key={plan.name} className={plan.highlighted ? "border-harlo-teal shadow-soft" : ""}>
              <CardBody className="flex h-full flex-col">
                <div className="flex min-h-8 items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-harlo-teal">{plan.name}</p>
                  {plan.highlighted && (
                    <span className="rounded-full bg-harlo-mist px-2.5 py-1 text-xs font-semibold text-harlo-teal">
                      Best fit
                    </span>
                  )}
                </div>
                <p className="mt-4 text-3xl font-semibold text-harlo-ink">{plan.price}</p>
                <p className="mt-2 text-sm text-harlo-muted">{plan.price === "Custom" ? "tailored contract" : "per month"}</p>
                <p className="mt-4 min-h-16 text-sm leading-6 text-harlo-muted">{plan.description}</p>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-harlo-ink">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <CheckCircle2 size={16} className="mt-1 shrink-0 text-harlo-teal" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant={plan.highlighted ? "primary" : "secondary"}>{plan.cta}</Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
