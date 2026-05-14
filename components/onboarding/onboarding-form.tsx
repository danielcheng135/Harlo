"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Globe2,
  Loader2,
  Palette,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { TRIAL_CONFIG, formatPrice, getBillingPlan, type BillingInterval, type BillingPlanKey } from "@/lib/billing/plans";

type PrimaryGoal = "support" | "lead_capture" | "both";
type Tone = "professional" | "friendly" | "direct";
type PrepStatus = "pending" | "active" | "done";

const planKeys = new Set(["starter", "growth", "pro"]);
const intervals = new Set(["monthly", "annual"]);

const goals: Array<{ value: PrimaryGoal; label: string; description: string }> = [
  { value: "support", label: "Support", description: "Answer common questions from approved website knowledge." },
  { value: "lead_capture", label: "Lead capture", description: "Collect intent, contact details, and handoff context." },
  { value: "both", label: "Both", description: "Handle support questions and capture qualified leads." }
];

const tones: Array<{ value: Tone; label: string }> = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "direct", label: "Direct" }
];

const prepSteps = [
  "Finding your brand",
  "Creating your assistant",
  "Adding your website knowledge",
  "Preparing plan options"
];
const MIN_PREPARATION_MS = 12000;
const MIN_READY_DWELL_MS = 5500;
const STEP_REVEAL_DELAY_MS = 1100;

type OnboardingFormProps = {
  initialAssistantName?: string;
  initialBusinessName?: string;
  initialWebsiteUrl?: string;
};

export function OnboardingForm({
  initialAssistantName = "",
  initialBusinessName = "",
  initialWebsiteUrl = ""
}: OnboardingFormProps) {
  const searchParams = useSearchParams();
  const initialPlanKey = normalizePlanKey(searchParams.get("plan"));
  const initialInterval = normalizeInterval(searchParams.get("interval"));
  const cleanInitialBusinessName = initialBusinessName.trim();
  const cleanInitialAssistantName = initialAssistantName.trim();
  const [businessName, setBusinessName] = useState(cleanInitialBusinessName);
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl.trim());
  const [botName, setBotName] = useState(cleanInitialAssistantName || (cleanInitialBusinessName ? `${cleanInitialBusinessName} Assistant` : "Harlo Assistant"));
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>("both");
  const [tone, setTone] = useState<Tone>("friendly");
  const [accent, setAccent] = useState("#087f95");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "preparing">("form");
  const [activeStep, setActiveStep] = useState(0);
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);
  const plan = getBillingPlan(initialPlanKey);
  const price = initialInterval === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;

  const checklist = useMemo(() => {
    return prepSteps.map((step, index): { label: string; status: PrepStatus } => ({
      label: step,
      status: index < activeStep ? "done" : index === activeStep ? "active" : "pending"
    }));
  }, [activeStep]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPhase("preparing");
    setActiveStep(0);
    setError(null);
    setBrandLogoUrl(null);
    const preparationStartedAt = Date.now();

    try {
      const onboardingResponse = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          businessName,
          websiteUrl,
          botName,
          primaryGoal,
          tone,
          accent,
          planKey: initialPlanKey,
          interval: initialInterval
        })
      });
      const onboardingResult = (await onboardingResponse.json().catch(() => null)) as { logoUrl?: string | null; error?: string } | null;

      if (!onboardingResponse.ok) {
        throw new Error(onboardingResult?.error ?? "Could not finish onboarding.");
      }

      setBrandLogoUrl(onboardingResult?.logoUrl ?? null);
      const workspaceReadyAt = Date.now();
      setActiveStep(1);
      await sleep(STEP_REVEAL_DELAY_MS);
      setActiveStep(2);
      await sleep(STEP_REVEAL_DELAY_MS);
      setActiveStep(3);

      const elapsed = Date.now() - preparationStartedAt;
      const readyElapsed = Date.now() - workspaceReadyAt;
      await sleep(Math.max(0, MIN_PREPARATION_MS - elapsed, MIN_READY_DWELL_MS - readyElapsed));
      setActiveStep(4);
      await sleep(650);
      window.location.assign("/onboarding/checkout");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
      setPhase("form");
    }
  }

  if (phase === "preparing") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-harlo-line bg-white p-6 shadow-soft sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(8,127,149,0.14),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(34,197,94,0.12),transparent_28%),linear-gradient(90deg,rgba(17,24,39,0.045)_1px,transparent_1px),linear-gradient(rgba(17,24,39,0.045)_1px,transparent_1px)] bg-[size:auto,auto,46px_46px,46px_46px]" />
        <div className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <BrandLogo />
            <h2 className="mt-8 text-4xl font-semibold leading-tight tracking-tight text-harlo-ink sm:text-5xl">
              Preparing your Harlo workspace.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-harlo-muted">
              We are setting up your assistant, checking your website brand, and preparing your plan options. You will move automatically when everything is ready.
            </p>
            <div className="mt-8 flex items-center gap-4 rounded-xl border border-harlo-line bg-white/85 p-4 shadow-sm">
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-harlo-line bg-harlo-mist">
                {brandLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brandLogoUrl}
                    alt={`${businessName} logo`}
                    className="h-full w-full object-contain p-2"
                    onError={() => setBrandLogoUrl(null)}
                  />
                ) : (
                  <Sparkles className="text-harlo-teal" size={26} />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-harlo-muted">Detected workspace</p>
                <p className="mt-1 text-xl font-semibold text-harlo-ink">{businessName || "Your business"}</p>
                <p className="mt-1 text-sm text-harlo-muted">
                  {brandLogoUrl ? "Brand logo found" : "Looking for your website logo"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-harlo-line bg-white/90 p-4 shadow-sm sm:p-5">
            <div className="rounded-xl bg-harlo-ink p-5 text-white">
              <p className="text-sm font-semibold text-white/70">Plan selection next</p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold">{plan.name}</p>
                  <p className="mt-1 text-sm text-white/70">
                    {initialPlanKey === "starter" ? `${TRIAL_CONFIG.days}-day trial, card required` : "Subscription starts after checkout"}
                  </p>
                </div>
                <p className="text-3xl font-semibold">{formatPrice(price)}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {checklist.map((step) => (
                <div
                  key={step.label}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                    step.status === "done"
                      ? "border-harlo-teal/20 bg-harlo-mist"
                      : step.status === "active"
                        ? "border-harlo-teal bg-white shadow-sm"
                        : "border-harlo-line bg-white/70 text-harlo-muted"
                  }`}
                >
                  <span className={`grid h-8 w-8 place-items-center rounded-full ${
                    step.status === "done" ? "bg-harlo-teal text-white" : step.status === "active" ? "bg-harlo-mist text-harlo-teal" : "bg-[#eef3f2] text-harlo-muted"
                  }`}>
                    {step.status === "done" ? <CheckCircle2 size={16} /> : step.status === "active" ? <Loader2 className="animate-spin" size={16} /> : <span className="h-2 w-2 rounded-full bg-current" />}
                  </span>
                  <p className="font-semibold text-harlo-ink">{step.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-harlo-line bg-harlo-mist p-4">
        <p className="text-sm font-semibold text-harlo-ink">{plan.name} checkout</p>
        <p className="mt-1 text-sm leading-6 text-harlo-muted">
          {initialPlanKey === "starter"
            ? `Starter includes a ${TRIAL_CONFIG.days}-day trial with card required.`
            : `${formatPrice(price)} per month, ${initialInterval} billing.`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name" icon={Globe2}>
          <input
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            required
            className="h-11 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none focus:border-harlo-teal"
            placeholder="Acme Services"
          />
        </Field>
        <Field label="Website URL" icon={ShieldCheck}>
          <input
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            required
            type="url"
            className="h-11 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none focus:border-harlo-teal"
            placeholder="https://acmeservices.com"
          />
        </Field>
      </div>

      <Field label="Assistant name" icon={Bot}>
        <input
          value={botName}
          onChange={(event) => setBotName(event.target.value)}
          required
          className="h-11 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none focus:border-harlo-teal"
          placeholder="Harlo Assistant"
        />
      </Field>

      <div>
        <p className="text-sm font-medium text-harlo-ink">Primary goal</p>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          {goals.map((goal) => (
            <button
              key={goal.value}
              type="button"
              onClick={() => setPrimaryGoal(goal.value)}
              className={`rounded-lg border p-4 text-left transition ${
                primaryGoal === goal.value ? "border-harlo-teal bg-harlo-mist shadow-sm" : "border-harlo-line bg-white hover:border-harlo-teal/70"
              }`}
            >
              <p className="font-semibold text-harlo-ink">{goal.label}</p>
              <p className="mt-1 text-sm leading-5 text-harlo-muted">{goal.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="text-sm font-medium text-harlo-ink">Tone</p>
          <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg border border-harlo-line bg-white p-1">
            {tones.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTone(item.value)}
                className={`h-10 rounded-md text-sm font-semibold transition ${
                  tone === item.value ? "bg-harlo-ink text-white" : "text-harlo-muted hover:bg-harlo-mist hover:text-harlo-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <Field label="Brand accent" icon={Palette}>
          <div className="flex gap-3">
            <input
              value={accent}
              onChange={(event) => setAccent(event.target.value)}
              type="color"
              className="h-11 w-14 rounded-lg border border-harlo-line bg-white p-1"
              aria-label="Accent color"
            />
            <input
              value={accent}
              onChange={(event) => setAccent(event.target.value)}
              className="h-11 min-w-0 flex-1 rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none focus:border-harlo-teal"
            />
          </div>
        </Field>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Button className="w-full">
        Prepare workspace
        <ArrowRight size={16} />
      </Button>
    </form>
  );
}

function Field({
  label,
  icon: Icon,
  children
}: {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-harlo-ink">
        <Icon size={15} className="text-harlo-teal" />
        {label}
      </span>
      {children}
    </label>
  );
}

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function normalizePlanKey(value: string | null): BillingPlanKey {
  return planKeys.has(value ?? "") ? value as BillingPlanKey : "starter";
}

function normalizeInterval(value: string | null): BillingInterval {
  return intervals.has(value ?? "") ? value as BillingInterval : "monthly";
}
