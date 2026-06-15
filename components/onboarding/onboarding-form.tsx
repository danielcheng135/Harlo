"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Globe2,
  Headphones,
  Loader2,
  MessageSquareText,
  Palette,
  ShieldCheck,
  Sparkles,
  Target,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TRIAL_CONFIG, formatPrice, getBillingPlan, type BillingInterval, type BillingPlanKey } from "@/lib/billing/plans";

type PrimaryGoal = "support" | "lead_capture" | "both";
type Tone = "professional" | "friendly" | "direct";
type PrepStatus = "pending" | "active" | "done";
type FormStep = 0 | 1 | 2;

const planKeys = new Set(["starter", "growth", "pro"]);
const intervals = new Set(["monthly", "annual"]);

const formSteps = [
  { label: "Business", description: "Your website and brand" },
  { label: "AI agent", description: "Behavior and voice" },
  { label: "Review", description: "Confirm your setup" }
] as const;

const goals: Array<{ value: PrimaryGoal; label: string; description: string; icon: LucideIcon }> = [
  {
    value: "support",
    label: "Answer questions",
    description: "Give visitors clear answers from your approved website knowledge.",
    icon: Headphones
  },
  {
    value: "lead_capture",
    label: "Capture leads",
    description: "Collect buying intent, contact details, and useful handoff context.",
    icon: Target
  },
  {
    value: "both",
    label: "Do both",
    description: "Answer questions first, then capture qualified opportunities.",
    icon: Sparkles
  }
];

const tones: Array<{ value: Tone; label: string; description: string }> = [
  { value: "professional", label: "Professional", description: "Polished and precise" },
  { value: "friendly", label: "Friendly", description: "Warm and conversational" },
  { value: "direct", label: "Direct", description: "Brief and action-oriented" }
];

const prepSteps = [
  "Finding your brand",
  "Creating your AI agent",
  "Adding website knowledge",
  "Preparing checkout"
];

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
  const [botName, setBotName] = useState(cleanInitialAssistantName || getDefaultAgentName(cleanInitialBusinessName));
  const [botNameCustomized, setBotNameCustomized] = useState(Boolean(cleanInitialAssistantName));
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>("both");
  const [tone, setTone] = useState<Tone>("friendly");
  const [accent, setAccent] = useState("#087f95");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<FormStep>(0);
  const [phase, setPhase] = useState<"form" | "preparing">("form");
  const [activePrepStep, setActivePrepStep] = useState(0);
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);
  const plan = getBillingPlan(initialPlanKey);
  const price = initialInterval === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;

  const preparationChecklist = useMemo(() => {
    return prepSteps.map((label, index): { label: string; status: PrepStatus } => ({
      label,
      status: index < activePrepStep ? "done" : index === activePrepStep ? "active" : "pending"
    }));
  }, [activePrepStep]);

  function goForward() {
    const validationError = validateStep(step, { businessName, websiteUrl, botName });

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setStep((current) => Math.min(current + 1, 2) as FormStep);
  }

  function goBack() {
    setError(null);
    setStep((current) => Math.max(current - 1, 0) as FormStep);
  }

  function handleBusinessNameChange(value: string) {
    const previousDefaultName = getDefaultAgentName(businessName);
    setBusinessName(value);

    if (!botNameCustomized || botName === previousDefaultName) {
      setBotName(getDefaultAgentName(value));
    }
  }

  function handleBotNameChange(value: string) {
    setBotName(value);
    setBotNameCustomized(value !== getDefaultAgentName(businessName));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step < 2) {
      goForward();
      return;
    }

    const validationError =
      validateStep(0, { businessName, websiteUrl, botName })
      ?? validateStep(1, { businessName, websiteUrl, botName });

    if (validationError) {
      setError(validationError);
      return;
    }

    setPhase("preparing");
    setActivePrepStep(0);
    setError(null);
    setBrandLogoUrl(null);

    const progressTimer = window.setInterval(() => {
      setActivePrepStep((current) => Math.min(current + 1, prepSteps.length - 1));
    }, 900);

    try {
      const onboardingResponse = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          businessName: businessName.trim(),
          websiteUrl: websiteUrl.trim(),
          botName: botName.trim(),
          primaryGoal,
          tone,
          accent,
          planKey: initialPlanKey,
          interval: initialInterval
        })
      });
      const onboardingResult = (await onboardingResponse.json().catch(() => null)) as {
        logoUrl?: string | null;
        nextPath?: string;
        error?: string;
      } | null;

      if (!onboardingResponse.ok) {
        throw new Error(onboardingResult?.error ?? "Could not finish onboarding.");
      }

      window.clearInterval(progressTimer);
      const detectedLogoUrl = onboardingResult?.logoUrl ?? null;

      if (detectedLogoUrl) {
        await preloadImage(detectedLogoUrl);
      }

      setBrandLogoUrl(detectedLogoUrl);
      setActivePrepStep(prepSteps.length);
      await sleep(detectedLogoUrl ? 2200 : 1200);
      window.location.assign(onboardingResult?.nextPath ?? "/onboarding/checkout");
    } catch (caughtError) {
      window.clearInterval(progressTimer);
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
      setPhase("form");
    }
  }

  if (phase === "preparing") {
    return (
      <div className="grid min-h-[560px] overflow-hidden rounded-lg border border-white/10 bg-white shadow-[0_32px_100px_rgba(0,0,0,0.28)] lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
        <div className="relative flex flex-col justify-between overflow-hidden bg-[#07111a] p-6 text-white sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(13,143,170,0.36),transparent_38%),linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:auto,56px_56px,56px_56px]" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold uppercase text-white/75">
              <Loader2 className="animate-spin text-harlo-blue" size={14} />
              Building your workspace
            </span>
            <h2 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.04] tracking-tight sm:text-5xl">
              Your AI agent is almost ready.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Harlo is using your website and preferences to prepare a useful first version. You will continue automatically.
            </p>
          </div>

          <div className="relative mt-10 flex items-center gap-4 border-t border-white/10 pt-6">
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/15 bg-white/10">
              {brandLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brandLogoUrl}
                  alt={`${businessName} logo`}
                  className="h-full w-full object-contain p-2"
                  onError={() => setBrandLogoUrl(null)}
                />
              ) : (
                <Sparkles className="text-harlo-blue" size={23} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-white/50">Workspace</p>
              <p className="mt-1 truncate text-lg font-semibold text-white">{businessName || "Your business"}</p>
              <p className="mt-1 text-sm text-slate-400">{websiteUrl}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center bg-white p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase text-harlo-teal">Setup progress</p>
          <div className="mt-6 grid gap-2">
            {preparationChecklist.map((item) => (
              <div key={item.label} className="flex min-h-14 items-center gap-3 border-b border-harlo-line py-3 last:border-0">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                    item.status === "done"
                      ? "bg-harlo-teal text-white"
                      : item.status === "active"
                        ? "bg-harlo-mist text-harlo-teal"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {item.status === "done" ? (
                    <Check size={15} />
                  ) : item.status === "active" ? (
                    <Loader2 className="animate-spin" size={15} />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </span>
                <span className={`text-sm font-semibold ${item.status === "pending" ? "text-harlo-muted" : "text-harlo-ink"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-harlo-line pt-6">
            <p className="text-sm font-semibold text-harlo-ink">{plan.name} plan</p>
            <p className="mt-1 text-sm text-harlo-muted">
              {formatPrice(price)}/month{initialInterval === "annual" ? ", billed annually" : ""}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="overflow-hidden rounded-lg border border-white/10 bg-white shadow-[0_32px_100px_rgba(0,0,0,0.28)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 p-5 sm:p-8 lg:p-10">
            <StepNavigation currentStep={step} onStepChange={setStep} />

            <div className="mt-8 min-h-[390px]">
              {step === 0 ? (
                <BusinessStep
                  businessName={businessName}
                  websiteUrl={websiteUrl}
                  onBusinessNameChange={handleBusinessNameChange}
                  onWebsiteUrlChange={setWebsiteUrl}
                />
              ) : null}

              {step === 1 ? (
                <AgentStep
                  botName={botName}
                  primaryGoal={primaryGoal}
                  tone={tone}
                  accent={accent}
                  onBotNameChange={handleBotNameChange}
                  onGoalChange={setPrimaryGoal}
                  onToneChange={setTone}
                  onAccentChange={setAccent}
                />
              ) : null}

              {step === 2 ? (
                <ReviewStep
                  businessName={businessName}
                  websiteUrl={websiteUrl}
                  botName={botName}
                  primaryGoal={primaryGoal}
                  tone={tone}
                  accent={accent}
                />
              ) : null}
            </div>

            {error ? (
              <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-7 flex items-center justify-between gap-3 border-t border-harlo-line pt-5">
              {step > 0 ? (
                <Button type="button" variant="ghost" onClick={goBack} className="px-2 sm:px-4">
                  <ArrowLeft size={16} />
                  Back
                </Button>
              ) : (
                <p className="hidden text-xs font-medium text-harlo-muted sm:block">Takes about 2 minutes</p>
              )}

              <Button type="submit" className="h-11 min-w-36 bg-harlo-blue px-5 hover:bg-harlo-teal">
                {step === 2 ? "Create workspace" : "Continue"}
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>

          <SetupSummary
            planName={plan.name}
            price={price}
            interval={initialInterval}
            isTrial={initialPlanKey === "starter"}
            businessName={businessName}
            botName={botName}
            accent={accent}
          />
        </div>
      </div>
    </form>
  );
}

function StepNavigation({
  currentStep,
  onStepChange
}: {
  currentStep: FormStep;
  onStepChange: (step: FormStep) => void;
}) {
  return (
    <nav aria-label="Onboarding progress">
      <ol className="grid grid-cols-3 gap-2 sm:gap-3">
        {formSteps.map((item, index) => {
          const isCurrent = currentStep === index;
          const isComplete = currentStep > index;
          const isAvailable = index <= currentStep;

          return (
            <li key={item.label}>
              <button
                type="button"
                disabled={!isAvailable}
                onClick={() => onStepChange(index as FormStep)}
                aria-current={isCurrent ? "step" : undefined}
                className={`w-full border-t-2 pt-3 text-left transition ${
                  isCurrent || isComplete ? "border-harlo-teal" : "border-harlo-line"
                } ${isAvailable ? "cursor-pointer" : "cursor-default"}`}
              >
                <span className={`block text-xs font-semibold ${isCurrent || isComplete ? "text-harlo-teal" : "text-slate-400"}`}>
                  0{index + 1}
                </span>
                <span className={`mt-1 block text-sm font-semibold ${isCurrent ? "text-harlo-ink" : "text-harlo-muted"}`}>
                  {item.label}
                </span>
                <span className="mt-0.5 hidden text-xs text-harlo-muted sm:block">{item.description}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function BusinessStep({
  businessName,
  websiteUrl,
  onBusinessNameChange,
  onWebsiteUrlChange
}: {
  businessName: string;
  websiteUrl: string;
  onBusinessNameChange: (value: string) => void;
  onWebsiteUrlChange: (value: string) => void;
}) {
  return (
    <section aria-labelledby="business-step-title">
      <StepHeading
        eyebrow="Tell us about your business"
        title="Start with your website."
        description="Harlo uses this to discover your brand and create the first knowledge source for your AI agent."
      />
      <div className="mt-7 grid gap-5">
        <Field label="Business name" icon={Users}>
          <input
            value={businessName}
            onChange={(event) => onBusinessNameChange(event.target.value)}
            autoComplete="organization"
            required
            autoFocus
            className={inputClassName}
            placeholder="Acme Services"
          />
        </Field>
        <Field label="Website URL" icon={Globe2} hint="Use your main public website.">
          <input
            value={websiteUrl}
            onChange={(event) => onWebsiteUrlChange(event.target.value)}
            autoComplete="url"
            inputMode="url"
            required
            type="url"
            className={inputClassName}
            placeholder="https://acmeservices.com"
          />
        </Field>
      </div>
      <div className="mt-7 flex items-start gap-3 rounded-lg bg-harlo-mist/70 px-4 py-3.5">
        <ShieldCheck className="mt-0.5 shrink-0 text-harlo-teal" size={17} />
        <p className="text-sm leading-6 text-harlo-muted">
          Harlo only uses publicly available website content during setup. You can review or remove the source later.
        </p>
      </div>
    </section>
  );
}

function AgentStep({
  botName,
  primaryGoal,
  tone,
  accent,
  onBotNameChange,
  onGoalChange,
  onToneChange,
  onAccentChange
}: {
  botName: string;
  primaryGoal: PrimaryGoal;
  tone: Tone;
  accent: string;
  onBotNameChange: (value: string) => void;
  onGoalChange: (value: PrimaryGoal) => void;
  onToneChange: (value: Tone) => void;
  onAccentChange: (value: string) => void;
}) {
  return (
    <section aria-labelledby="agent-step-title">
      <StepHeading
        eyebrow="Shape the experience"
        title="Make the agent feel like your team."
        description="Choose the job it should prioritize and the tone visitors will hear."
      />

      <div className="mt-7">
        <Field label="AI agent name" icon={Bot}>
          <input
            value={botName}
            onChange={(event) => onBotNameChange(event.target.value)}
            required
            autoFocus
            className={inputClassName}
            placeholder="Acme Services AI Agent"
          />
        </Field>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-harlo-ink">Primary goal</legend>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {goals.map((goal) => {
            const Icon = goal.icon;
            const selected = primaryGoal === goal.value;

            return (
              <button
                key={goal.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onGoalChange(goal.value)}
                className={`min-h-40 border p-4 text-left transition ${
                  selected
                    ? "border-harlo-teal bg-harlo-mist/70"
                    : "border-harlo-line bg-white hover:border-harlo-teal/60"
                } rounded-lg`}
              >
                <span className={`grid h-9 w-9 place-items-center rounded-lg ${selected ? "bg-harlo-teal text-white" : "bg-slate-100 text-harlo-muted"}`}>
                  <Icon size={17} />
                </span>
                <span className="mt-4 block text-sm font-semibold text-harlo-ink">{goal.label}</span>
                <span className="mt-1.5 block text-xs leading-5 text-harlo-muted">{goal.description}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-[minmax(0,1fr)_190px]">
        <fieldset>
          <legend className="text-sm font-semibold text-harlo-ink">Voice</legend>
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
            {tones.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={tone === item.value}
                onClick={() => onToneChange(item.value)}
                title={item.description}
                className={`min-h-11 rounded-md px-2 text-xs font-semibold transition sm:text-sm ${
                  tone === item.value ? "bg-harlo-ink text-white" : "text-harlo-muted hover:bg-white hover:text-harlo-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <Field label="Brand accent" icon={Palette}>
          <div className="flex h-12 items-center gap-2 rounded-lg border border-harlo-line bg-white p-1.5 focus-within:border-harlo-teal focus-within:ring-4 focus-within:ring-harlo-mist">
            <input
              value={accent}
              onChange={(event) => onAccentChange(event.target.value)}
              type="color"
              className="h-9 w-10 cursor-pointer rounded-md border-0 bg-transparent p-0"
              aria-label="Choose accent color"
            />
            <input
              value={accent}
              onChange={(event) => onAccentChange(event.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent px-1 text-sm font-medium uppercase text-harlo-ink outline-none"
              aria-label="Accent color hex value"
            />
          </div>
        </Field>
      </div>
    </section>
  );
}

function ReviewStep({
  businessName,
  websiteUrl,
  botName,
  primaryGoal,
  tone,
  accent
}: {
  businessName: string;
  websiteUrl: string;
  botName: string;
  primaryGoal: PrimaryGoal;
  tone: Tone;
  accent: string;
}) {
  const goal = goals.find((item) => item.value === primaryGoal);

  return (
    <section aria-labelledby="review-step-title">
      <StepHeading
        eyebrow="Ready to build"
        title="Review your first version."
        description="Harlo will create the workspace and add your website as a knowledge source. Everything remains editable."
      />

      <dl className="mt-7 divide-y divide-harlo-line border-y border-harlo-line">
        <ReviewRow icon={Globe2} label="Business" value={businessName} detail={websiteUrl} />
        <ReviewRow icon={Bot} label="AI agent" value={botName} detail={`${goal?.label ?? "Do both"} · ${capitalize(tone)} voice`} />
        <ReviewRow icon={Palette} label="Widget accent" value={accent.toUpperCase()}>
          <span className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: accent }} />
        </ReviewRow>
      </dl>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Sparkles, label: "Brand discovered" },
          { icon: MessageSquareText, label: "Agent prepared" },
          { icon: Globe2, label: "Website added" }
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-3 text-xs font-semibold text-harlo-muted">
              <Icon size={15} className="shrink-0 text-harlo-teal" />
              {item.label}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SetupSummary({
  planName,
  price,
  interval,
  isTrial,
  businessName,
  botName,
  accent
}: {
  planName: string;
  price: number;
  interval: BillingInterval;
  isTrial: boolean;
  businessName: string;
  botName: string;
  accent: string;
}) {
  return (
    <aside className="relative overflow-hidden bg-[#07111a] p-6 text-white sm:p-8 lg:min-h-[650px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(13,143,170,0.38),transparent_38%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:auto,48px_48px,48px_48px]" />
      <div className="relative flex h-full flex-col">
        <div>
          <p className="text-xs font-semibold uppercase text-white/50">Your setup</p>
          <div className="mt-5 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: accent }}>
              <Bot size={20} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{botName || getDefaultAgentName(businessName)}</p>
              <p className="mt-0.5 truncate text-sm text-slate-400">{businessName || "Your business"}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{planName}</p>
              <p className="mt-1 text-xs text-slate-400">{interval === "annual" ? "Annual billing" : "Monthly billing"}</p>
            </div>
            <p className="text-right text-2xl font-semibold">
              {formatPrice(price)}
              <span className="block text-xs font-medium text-slate-400">per month</span>
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-3 text-sm text-slate-300">
          {[
            isTrial ? `${TRIAL_CONFIG.days}-day free trial` : "Plan starts after checkout",
            "Secure card checkout next",
            "Edit every setting later"
          ].map((item) => (
            <span key={item} className="flex items-center gap-2.5">
              <CheckCircle2 size={15} className="shrink-0 text-harlo-blue" />
              {item}
            </span>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4 lg:mt-auto">
          <p className="text-sm font-semibold text-white">What happens next?</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            We prepare the workspace, then send you to secure checkout. Your setup is kept if you need to return later.
          </p>
        </div>
      </div>
    </aside>
  );
}

function StepHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-harlo-teal">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold text-harlo-ink sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-harlo-muted sm:text-base">{description}</p>
    </div>
  );
}

function ReviewRow({
  icon: Icon,
  label,
  value,
  detail,
  children
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
        <Icon size={16} />
      </span>
      <dt className="w-20 shrink-0 text-xs font-semibold uppercase text-harlo-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-right">
        <span className="flex items-center justify-end gap-2 text-sm font-semibold text-harlo-ink">
          {children}
          <span className="truncate">{value}</span>
        </span>
        {detail ? <span className="mt-0.5 block truncate text-xs text-harlo-muted">{detail}</span> : null}
      </dd>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  hint,
  children
}: {
  label: string;
  icon: LucideIcon;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-harlo-ink">
          <Icon size={15} className="text-harlo-teal" />
          {label}
        </span>
        {hint ? <span className="hidden text-xs text-harlo-muted sm:block">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

const inputClassName =
  "h-12 w-full rounded-lg border border-harlo-line bg-white px-3.5 text-base text-harlo-ink outline-none transition placeholder:text-slate-400 focus:border-harlo-teal focus:ring-4 focus:ring-harlo-mist";

function validateStep(
  step: FormStep,
  values: { businessName: string; websiteUrl: string; botName: string }
) {
  if (step === 0) {
    if (!values.businessName.trim()) {
      return "Enter your business name to continue.";
    }

    if (!isValidPublicUrl(values.websiteUrl)) {
      return "Enter a complete website URL, including https://.";
    }
  }

  if (step === 1 && !values.botName.trim()) {
    return "Give your AI agent a name to continue.";
  }

  return null;
}

function isValidPublicUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function preloadImage(url: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    const timeout = window.setTimeout(resolve, 2500);

    image.onload = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    image.src = url;
  });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getDefaultAgentName(businessName: string) {
  const name = businessName.trim();
  return `${name || "Your business"} AI Agent`;
}

function normalizePlanKey(value: string | null): BillingPlanKey {
  return planKeys.has(value ?? "") ? value as BillingPlanKey : "starter";
}

function normalizeInterval(value: string | null): BillingInterval {
  return intervals.has(value ?? "") ? value as BillingInterval : "monthly";
}
