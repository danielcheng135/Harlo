import type { Route } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Bot, Check, Code2, Library, Rocket } from "lucide-react";

type GettingStartedGuideProps = {
  agentConfigured: boolean;
  knowledgeConfigured: boolean;
  widgetLive: boolean;
};

type SetupStep = {
  title: string;
  description: string;
  action: string;
  href: Route;
  icon: LucideIcon;
  complete: boolean;
};

export function GettingStartedGuide({
  agentConfigured,
  knowledgeConfigured,
  widgetLive
}: GettingStartedGuideProps) {
  const steps: SetupStep[] = [
    {
      title: "Configure your AI agent",
      description: "Set its role, instructions, greeting, lead questions, and brand voice.",
      action: agentConfigured ? "Review agent" : "Configure agent",
      href: "/dashboard/builder",
      icon: Bot,
      complete: agentConfigured
    },
    {
      title: "Add business knowledge",
      description: "Train Harlo with your website, documents, FAQs, and approved answers.",
      action: knowledgeConfigured ? "Manage knowledge" : "Add knowledge",
      href: "/dashboard/knowledge",
      icon: Library,
      complete: knowledgeConfigured
    },
    {
      title: "Install your website widget",
      description: "Copy the embed code, add it to your site, and send a test message.",
      action: widgetLive ? "Manage widget" : "Install widget",
      href: "/dashboard/widget",
      icon: Code2,
      complete: widgetLive
    }
  ];
  const completedCount = steps.filter((step) => step.complete).length;
  const nextStepIndex = steps.findIndex((step) => !step.complete);
  const progress = Math.round((completedCount / steps.length) * 100);

  if (completedCount === steps.length) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm" aria-labelledby="getting-started-title">
      <div className="border-b border-harlo-line px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-harlo-ink text-white">
              <Rocket size={18} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-harlo-teal">Launch checklist</p>
              <h2 id="getting-started-title" className="mt-1 text-xl font-semibold tracking-tight text-harlo-ink">
                Get your AI agent ready for visitors
              </h2>
              <p className="mt-1 text-sm leading-6 text-harlo-muted">
                Complete these three steps to give Harlo the right answers and put it live on your website.
              </p>
            </div>
          </div>

          <div className="w-full shrink-0 sm:w-44">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-harlo-muted">Setup progress</span>
              <span className="text-harlo-ink">{completedCount} of {steps.length}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-harlo-teal transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid divide-y divide-harlo-line md:grid-cols-3 md:divide-x md:divide-y-0">
        {steps.map((step, index) => {
          const isNext = index === nextStepIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className={`relative flex min-h-64 flex-col px-5 py-6 sm:px-6 ${
                isNext ? "bg-harlo-mist/40" : "bg-white"
              }`}
            >
              {isNext ? <span className="absolute inset-x-0 top-0 h-0.5 bg-harlo-teal" /> : null}

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-harlo-muted">
                  Step {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    step.complete
                      ? "bg-emerald-50 text-emerald-700"
                      : isNext
                        ? "bg-harlo-ink text-white"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {step.complete ? <Check size={11} /> : null}
                  {step.complete ? "Complete" : isNext ? "Up next" : "Not started"}
                </span>
              </div>

              <span
                className={`mt-6 grid h-12 w-12 place-items-center rounded-lg ${
                  step.complete
                    ? "bg-emerald-50 text-emerald-700"
                    : isNext
                      ? "bg-harlo-teal text-white"
                      : "bg-slate-100 text-harlo-muted"
                }`}
              >
                <Icon size={21} />
              </span>

              <h3 className="mt-5 text-base font-semibold text-harlo-ink">{step.title}</h3>
              <p className="mb-8 mt-2 text-sm leading-6 text-harlo-muted">{step.description}</p>

              <Link
                href={step.href}
                className={`mt-auto inline-flex h-10 w-full items-center justify-between rounded-lg px-3.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-harlo-teal focus:ring-offset-2 ${
                  isNext
                    ? "bg-harlo-ink text-white hover:bg-harlo-navy"
                    : "border border-harlo-line bg-white text-harlo-ink hover:border-harlo-teal hover:text-harlo-teal"
                }`}
              >
                {step.action}
                <ArrowRight size={15} />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
