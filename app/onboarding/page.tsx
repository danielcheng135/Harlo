import { CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ChatWidgetPreview } from "@/components/chat-widget-preview";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-harlo-canvas">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <BrandLogo />
      </header>
      <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-12 lg:grid-cols-[0.8fr_1fr]">
        <div>
          <p className="text-sm font-semibold text-harlo-teal">Workspace setup</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-harlo-ink">
            Create your first Harlo chatbot.
          </h1>
          <p className="mt-4 text-harlo-muted">
            This creates the organization, default bot, widget style, and first website source record.
          </p>
          <div className="mt-8 rounded-lg border border-harlo-line bg-white p-6 shadow-sm">
            <OnboardingForm />
          </div>
        </div>
        <aside className="space-y-5">
          <ChatWidgetPreview />
          <div className="grid gap-3 rounded-lg border border-harlo-line bg-white p-5 text-sm text-harlo-muted">
            {["Train from website knowledge", "Customize widget styling", "Capture leads when context is missing"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-harlo-teal" />
                {item}
              </span>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
