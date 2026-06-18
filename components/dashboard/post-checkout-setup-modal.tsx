"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookOpenText, CheckCircle2, Code2, Globe2, Loader2, MousePointerClick, Sparkles, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PostCheckoutSetupModalProps = {
  organizationId: string;
  enabled: boolean;
  hasSeen: boolean;
};

const steps = [
  {
    title: "AI agent created",
    eyebrow: "Builder",
    status: "Completed",
    description: "Your first Harlo AI agent is already created from onboarding. You can always tune its name, greeting, lead capture questions, handoff message, tone, and brand details later.",
    href: "/dashboard/builder",
    icon: WandSparkles,
    visual: "builder"
  },
  {
    title: "Knowledge added",
    eyebrow: "Knowledge",
    status: "Completed",
    description: "Harlo has already started with the website knowledge from setup. Add more answers, pages, and source material later to make responses sharper.",
    href: "/dashboard/knowledge",
    icon: BookOpenText,
    visual: "knowledge"
  },
  {
    title: "Install the website widget",
    eyebrow: "Widget",
    status: "Next",
    description: "The last launch step is installing Harlo on your website. Copy the snippet from the Widget page, add your allowed domains, and place it on your site.",
    href: "/dashboard/widget",
    icon: Code2,
    visual: "widget"
  }
];

export function PostCheckoutSetupModal({ organizationId, enabled, hasSeen }: PostCheckoutSetupModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldOpen = enabled && !hasSeen && searchParams.get("post_checkout_setup") === "1";
  const [isOpen, setIsOpen] = useState(shouldOpen);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (shouldOpen) {
      setIsOpen(true);
    }
  }, [shouldOpen]);

  const currentStep = steps[activeStep];
  const CurrentIcon = currentStep.icon;
  const isFinalStep = activeStep === steps.length - 1;

  if (!isOpen) {
    return null;
  }

  async function finishSetup() {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/dashboard/post-checkout-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ organizationId })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Could not save setup progress.");
      }

      startTransition(() => {
        router.replace("/dashboard/widget");
        router.refresh();
      });
      setIsOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save setup progress.");
      setIsSaving(false);
    }
  }

  function goNext() {
    setError(null);

    if (!isFinalStep) {
      setActiveStep((step) => step + 1);
      return;
    }

    void finishSetup();
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#031820]/70 px-4 py-6 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-checkout-setup-title"
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-white shadow-[0_28px_90px_rgba(1,15,20,0.38)]"
      >
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_20%_20%,rgba(9,155,180,0.28),transparent_34%),linear-gradient(135deg,#032832,#075566)]" />
        <div className="relative p-5 sm:p-7">
          <div className="rounded-2xl border border-white/15 bg-[#031820] p-5 text-white shadow-xl shadow-harlo-teal/10 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  <CheckCircle2 size={14} />
                  Checkout complete
                </p>
                <h2 id="post-checkout-setup-title" className="mt-4 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
                  You are almost ready to launch.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                  Your AI agent and starter knowledge are already set up. The only remaining step is installing the widget on your website.
                </p>
              </div>
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-harlo-teal to-cyan-400 text-white shadow-lg shadow-harlo-teal/25">
                <CurrentIcon size={25} />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              const isDone = index < activeStep;

              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    isActive
                      ? "border-harlo-teal bg-harlo-mist shadow-sm shadow-harlo-teal/15"
                      : "border-harlo-line bg-white hover:border-harlo-teal/60 hover:bg-cyan-50/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn(
                      "grid h-10 w-10 place-items-center rounded-xl",
                      index < 2 || isActive || isDone ? "bg-harlo-teal text-white" : "bg-slate-100 text-harlo-muted"
                    )}>
                      {index < 2 || isDone ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                    </span>
                    <span className={cn(
                      "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                      index < 2 ? "bg-emerald-50 text-emerald-700" : "bg-cyan-50 text-harlo-teal"
                    )}>
                      {step.status}
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-harlo-teal">{step.eyebrow}</p>
                  <p className="mt-1 text-base font-semibold text-harlo-ink">{step.title}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-harlo-line bg-gradient-to-br from-white via-white to-cyan-50/70 p-5 sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-harlo-teal">{currentStep.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-harlo-ink">{currentStep.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-harlo-muted">{currentStep.description}</p>
                <p className="mt-4 rounded-xl border border-harlo-line bg-white px-4 py-3 text-sm font-medium text-harlo-ink shadow-sm">
                  {activeStep < 2 ? "Already completed. You can revisit it any time at " : "Next destination: "}
                  <span className="text-harlo-teal">{currentStep.href}</span>.
                </p>
              </div>
              <StepVisual type={currentStep.visual} />
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-harlo-muted">
              This intro appears once after checkout. Completing it sends you to Widget install.
            </p>
            <Button
              type="button"
              onClick={goNext}
              disabled={isSaving || isPending}
              className="h-11 rounded-xl bg-gradient-to-r from-harlo-teal to-cyan-500 px-5 shadow-lg shadow-harlo-teal/20 hover:from-harlo-teal hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving || isPending ? <Loader2 size={17} className="animate-spin" /> : null}
              {isFinalStep ? "Go to widget install" : "Next step"}
              {!isSaving && !isPending ? <ArrowRight size={17} /> : null}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepVisual({ type }: { type: string }) {
  if (type === "builder") {
    return (
      <div className="overflow-hidden rounded-2xl border border-harlo-line bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-harlo-teal text-white">
            <WandSparkles size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-harlo-ink">Agent ready</p>
            <p className="text-xs font-medium text-harlo-muted">Harlo AI Agent</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {["Greeting", "Lead questions", "Brand color"].map((item, index) => (
            <div key={item} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <span className="text-xs font-semibold text-harlo-muted">{item}</span>
              <span className={cn("h-2 rounded-full", index === 0 ? "w-16 bg-harlo-teal" : index === 1 ? "w-20 bg-cyan-400" : "w-12 bg-slate-300")} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "knowledge") {
    return (
      <div className="overflow-hidden rounded-2xl border border-harlo-line bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#032832] text-cyan-200">
            <BookOpenText size={18} />
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Synced</span>
        </div>
        <div className="mt-4 rounded-xl bg-harlo-mist p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-harlo-ink">
            <Globe2 size={14} className="text-harlo-teal" />
            Website knowledge
          </div>
          <div className="mt-3 space-y-2">
            <span className="block h-2 w-full rounded-full bg-white" />
            <span className="block h-2 w-10/12 rounded-full bg-white" />
            <span className="block h-2 w-7/12 rounded-full bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-harlo-line bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-harlo-teal to-cyan-500 text-white">
          <Code2 size={18} />
        </span>
        <div>
          <p className="text-sm font-bold text-harlo-ink">Install widget</p>
          <p className="text-xs font-medium text-harlo-muted">One website snippet</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-[#031820] p-3 font-mono text-[11px] leading-5 text-cyan-100">
        <p>&lt;script</p>
        <p className="pl-3 text-cyan-300">src=&quot;harloai.co/widget.js&quot;</p>
        <p>&gt;&lt;/script&gt;</p>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-semibold text-harlo-ink">
        <MousePointerClick size={14} className="text-harlo-teal" />
        Copy, paste, launch
      </div>
    </div>
  );
}
