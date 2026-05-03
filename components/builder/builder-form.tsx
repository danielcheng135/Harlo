"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Check, ClipboardList, Globe2, Loader2, MessageSquare, Palette, Plus, Sparkles, Trash2 } from "lucide-react";
import { ChatWidgetPreview } from "@/components/chat-widget-preview";
import { Button } from "@/components/ui/button";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { DEFAULT_LEAD_FIELDS, type LeadCaptureField, type LeadFieldType } from "@/lib/lead-fields";

type BuilderFormProps = {
  initial: {
    botName: string;
    widgetTitle: string;
    greeting: string;
    fallbackMessage: string;
    accent: string;
    launcherPosition: "bottom-right" | "bottom-left";
    welcomePrompts: string[];
    allowedDomains: string[];
    leadCaptureFields: LeadCaptureField[];
  };
};

type SaveResult = {
  error?: string;
  status?: string;
};

export function BuilderForm({ initial }: BuilderFormProps) {
  const router = useRouter();
  const [botName, setBotName] = useState(initial.botName);
  const [widgetTitle, setWidgetTitle] = useState(initial.widgetTitle);
  const [greeting, setGreeting] = useState(initial.greeting);
  const [fallbackMessage, setFallbackMessage] = useState(initial.fallbackMessage);
  const [accent, setAccent] = useState(initial.accent);
  const [launcherPosition, setLauncherPosition] = useState(initial.launcherPosition);
  const [welcomePrompts, setWelcomePrompts] = useState(padPrompts(initial.welcomePrompts));
  const [allowedDomains, setAllowedDomains] = useState(padDomains(initial.allowedDomains));
  const [leadCaptureFields, setLeadCaptureFields] = useState(padLeadFields(initial.leadCaptureFields));
  const [isSaving, setIsSaving] = useState(false);
  const { toast, showToast, dismissToast } = useToast();

  const cleanPrompts = useMemo(() => welcomePrompts.map((prompt) => prompt.trim()).filter(Boolean), [welcomePrompts]);
  const cleanDomains = useMemo(() => allowedDomains.map((domain) => domain.trim()).filter(Boolean), [allowedDomains]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const response = await fetch("/api/builder", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        botName,
        widgetTitle,
        greeting,
        fallbackMessage,
        accent,
        launcherPosition,
        welcomePrompts: cleanPrompts,
        allowedDomains: cleanDomains,
        leadCaptureFields: leadCaptureFields.filter((field) => field.enabled || isLockedLeadField(field.key))
      })
    });
    const result = (await response.json().catch(() => null)) as SaveResult | null;

    if (!response.ok) {
      showToast("error", result?.error ?? "Could not save widget settings.");
      setIsSaving(false);
      return;
    }

    showToast("success", "Widget settings saved.");
    setIsSaving(false);
    router.refresh();
  }

  function updatePrompt(index: number, value: string) {
    setWelcomePrompts((current) => current.map((prompt, promptIndex) => promptIndex === index ? value : prompt));
  }

  function removePrompt(index: number) {
    setWelcomePrompts((current) => current.filter((_, promptIndex) => promptIndex !== index));
  }

  function updateDomain(index: number, value: string) {
    setAllowedDomains((current) => current.map((domain, domainIndex) => domainIndex === index ? value : domain));
  }

  function removeDomain(index: number) {
    setAllowedDomains((current) => current.filter((_, domainIndex) => domainIndex !== index));
  }

  function updateLeadField(index: number, updates: Partial<LeadCaptureField>) {
    setLeadCaptureFields((current) =>
      current.map((field, fieldIndex) => {
        if (fieldIndex !== index) {
          return field;
        }

        const next = { ...field, ...updates };

        if (isLockedLeadField(next.key)) {
          next.enabled = true;
          next.required = true;
        }

        return next;
      })
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_460px]">
      <ToastViewport toast={toast} onDismiss={dismissToast} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-lg border border-harlo-line bg-white">
          <div className="border-b border-harlo-line p-5">
            <h2 className="text-lg font-semibold text-harlo-ink">Widget identity</h2>
            <p className="mt-1 text-sm text-harlo-muted">Control what customers see when the chat opens.</p>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <Field icon={Bot} label="Bot name">
              <input
                value={botName}
                onChange={(event) => setBotName(event.target.value)}
                required
                maxLength={80}
                className={inputClass}
              />
            </Field>
            <Field icon={Sparkles} label="Widget title">
              <input
                value={widgetTitle}
                onChange={(event) => setWidgetTitle(event.target.value)}
                required
                maxLength={80}
                className={inputClass}
              />
            </Field>
            <Field icon={MessageSquare} label="Greeting" className="md:col-span-2">
              <textarea
                value={greeting}
                onChange={(event) => setGreeting(event.target.value)}
                required
                maxLength={240}
                rows={3}
                className={textareaClass}
              />
            </Field>
            <Field icon={MessageSquare} label="Default fallback" className="md:col-span-2">
              <textarea
                value={fallbackMessage}
                onChange={(event) => setFallbackMessage(event.target.value)}
                required
                maxLength={240}
                rows={3}
                className={textareaClass}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-harlo-line bg-white">
          <div className="border-b border-harlo-line p-5">
            <h2 className="text-lg font-semibold text-harlo-ink">Lead capture questions</h2>
            <p className="mt-1 text-sm text-harlo-muted">Choose what {botName || "your chatbot"} asks before handing a visitor to the team.</p>
          </div>
          <div className="space-y-3 p-5">
            {leadCaptureFields.map((field, index) => (
              <div key={field.key} className="grid gap-3 rounded-lg border border-harlo-line bg-harlo-canvas p-3 lg:grid-cols-[160px_120px_1fr]">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    disabled={isLockedLeadField(field.key)}
                    onChange={(event) => updateLeadField(index, { enabled: event.target.checked, required: event.target.checked ? field.required : false })}
                    className="h-4 w-4 accent-harlo-teal"
                    aria-label={`Enable ${field.label}`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-harlo-ink">{field.label}</p>
                    <p className="text-xs text-harlo-muted">{isLockedLeadField(field.key) ? "Required" : "Optional"}</p>
                  </div>
                </div>
                <select
                  value={field.type}
                  disabled={isLockedLeadField(field.key)}
                  onChange={(event) => updateLeadField(index, { type: event.target.value as LeadFieldType })}
                  className="h-10 rounded-lg border border-harlo-line bg-white px-3 text-sm text-harlo-ink outline-none focus:border-harlo-teal disabled:text-harlo-muted"
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="date">Date</option>
                </select>
                <div className="flex gap-2">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-harlo-line bg-white text-harlo-teal">
                    <ClipboardList size={16} />
                  </span>
                  <input
                    value={field.prompt}
                    onChange={(event) => updateLeadField(index, { prompt: event.target.value })}
                    disabled={!field.enabled}
                    maxLength={120}
                    className="h-10 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm text-harlo-ink outline-none transition placeholder:text-harlo-muted focus:border-harlo-teal disabled:bg-harlo-canvas disabled:text-harlo-muted"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-harlo-line bg-white">
          <div className="border-b border-harlo-line p-5">
            <h2 className="text-lg font-semibold text-harlo-ink">Brand styling</h2>
            <p className="mt-1 text-sm text-harlo-muted">Match the widget to the business website.</p>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <Field icon={Palette} label="Accent color">
              <div className="flex gap-3">
                <input
                  type="color"
                  value={accent}
                  onChange={(event) => setAccent(event.target.value)}
                  className="h-11 w-14 rounded-lg border border-harlo-line bg-white p-1"
                  aria-label="Accent color picker"
                />
                <input
                  value={accent}
                  onChange={(event) => setAccent(event.target.value)}
                  required
                  pattern="#[0-9a-fA-F]{6}"
                  className={inputClass}
                />
              </div>
            </Field>
            <Field icon={Sparkles} label="Launcher position">
              <div className="grid grid-cols-2 rounded-lg border border-harlo-line bg-harlo-canvas p-1">
                {(["bottom-right", "bottom-left"] as const).map((position) => (
                  <button
                    key={position}
                    type="button"
                    onClick={() => setLauncherPosition(position)}
                    className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                      launcherPosition === position ? "bg-white text-harlo-ink shadow-sm" : "text-harlo-muted hover:text-harlo-ink"
                    }`}
                  >
                    {position === "bottom-right" ? "Right" : "Left"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-harlo-line bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-harlo-line p-5">
            <div>
              <h2 className="text-lg font-semibold text-harlo-ink">Welcome prompts</h2>
              <p className="mt-1 text-sm text-harlo-muted">Quick-start questions customers can tap when the widget opens.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setWelcomePrompts((current) => [...current, ""])}
              disabled={welcomePrompts.length >= 4}
            >
              <Plus size={16} />
              Add
            </Button>
          </div>
          <div className="space-y-3 p-5">
            {welcomePrompts.map((prompt, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={prompt}
                  onChange={(event) => updatePrompt(index, event.target.value)}
                  maxLength={90}
                  className={inputClass}
                  placeholder="What services do you offer?"
                />
                <Button type="button" variant="ghost" className="px-3" onClick={() => removePrompt(index)} aria-label="Remove prompt">
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-harlo-line bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-harlo-line p-5">
            <div>
              <h2 className="text-lg font-semibold text-harlo-ink">Allowed domains</h2>
              <p className="mt-1 text-sm text-harlo-muted">Only these websites can load this bot. Localhost stays allowed for testing.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAllowedDomains((current) => [...current, ""])}
              disabled={allowedDomains.length >= 10}
            >
              <Plus size={16} />
              Add
            </Button>
          </div>
          <div className="space-y-3 p-5">
            {allowedDomains.map((domain, index) => (
              <div key={index} className="flex gap-2">
                <span className="grid h-11 w-11 place-items-center rounded-lg border border-harlo-line bg-harlo-canvas text-harlo-muted">
                  <Globe2 size={16} />
                </span>
                <input
                  value={domain}
                  onChange={(event) => updateDomain(index, event.target.value)}
                  className={inputClass}
                  placeholder="example.com"
                />
                <Button type="button" variant="ghost" className="px-3" onClick={() => removeDomain(index)} aria-label="Remove domain">
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="shadow-soft">
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
            Save widget settings
          </Button>
        </div>
      </form>

      <aside className="xl:sticky xl:top-20 xl:self-start">
        <ChatWidgetPreview
          title={widgetTitle}
          greeting={greeting}
          accent={accent}
          launcherPosition={launcherPosition}
          welcomePrompts={cleanPrompts}
        />
      </aside>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  className,
  children
}: {
  icon: typeof Bot;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-harlo-ink">
        <Icon size={16} className="text-harlo-teal" />
        {label}
      </span>
      {children}
    </label>
  );
}

function padPrompts(prompts: string[]) {
  return prompts.length > 0 ? prompts : ["What services do you offer?", "How much does it cost?", "Can I book a consultation?"];
}

function padDomains(domains: string[]) {
  return domains.length > 0 ? domains : [""];
}

function padLeadFields(fields: LeadCaptureField[]) {
  const byKey = new Map(fields.map((field) => [field.key, field]));

  return DEFAULT_LEAD_FIELDS.map((field) => ({
    ...field,
    ...byKey.get(field.key)
  }));
}

function isLockedLeadField(key: string) {
  return key === "name" || key === "email";
}

const inputClass = "h-11 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm text-harlo-ink outline-none transition placeholder:text-harlo-muted focus:border-harlo-teal";
const textareaClass = "w-full resize-y rounded-lg border border-harlo-line bg-white px-3 py-3 text-sm leading-6 text-harlo-ink outline-none transition placeholder:text-harlo-muted focus:border-harlo-teal";
