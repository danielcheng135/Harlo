"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Bot, Check, ClipboardList, Globe2, Loader2, MessageSquare, Palette, Plus, Route as RouteIcon, Sparkles, Trash2, type LucideIcon } from "lucide-react";
import { ChatWidgetPreview } from "@/components/chat-widget-preview";
import { Button } from "@/components/ui/button";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { AGENT_TEMPLATES, getAgentTemplate, type AgentType } from "@/lib/agents";
import { DEFAULT_LEAD_FIELDS, type LeadCaptureField, type LeadFieldType } from "@/lib/lead-fields";

type BuilderFormProps = {
  initial: {
    botName: string;
    agentType: AgentType;
    description: string;
    systemInstructions: string;
    handoffInstructions: string;
    widgetTitle: string;
    greeting: string;
    fallbackMessage: string;
    accent: string;
    launcherPosition: "bottom-right" | "bottom-left";
    welcomePrompts: string[];
    brandLogoUrl: string | null;
    allowedDomains: string[];
    routePatterns: string[];
    leadCaptureFields: LeadCaptureField[];
    agents: BuilderAgentDraft[];
    agentCapacity: {
      used: number;
      limit: number;
      remaining: number;
    };
  };
};

type BuilderInitial = BuilderFormProps["initial"];

type BuilderAgentDraft = {
  id: string;
  botName: string;
  agentType: AgentType;
  description: string;
  systemInstructions: string;
  handoffInstructions: string;
  widgetTitle: string;
  greeting: string;
  fallbackMessage: string;
  accent: string;
  launcherPosition: "bottom-right" | "bottom-left";
  welcomePrompts: string[];
  allowedDomains: string[];
  routePatterns: string[];
  leadCaptureFields: LeadCaptureField[];
  isDefault: boolean;
};

type SaveResult = {
  error?: string;
  status?: string;
  agent?: BuilderAgentDraft;
};

export function BuilderForm({ initial }: BuilderFormProps) {
  const router = useRouter();
  const seedAgents = initial.agents.length > 0 ? initial.agents : [makeAgentFromInitial(initial)];
  const [agents, setAgents] = useState(seedAgents);
  const [selectedAgentId, setSelectedAgentId] = useState(seedAgents[0]?.id ?? "");
  const firstAgent = seedAgents[0] ?? makeAgentFromInitial(initial);
  const [botName, setBotName] = useState(firstAgent.botName);
  const [agentType, setAgentType] = useState<AgentType>(firstAgent.agentType);
  const [description, setDescription] = useState(firstAgent.description || getAgentTemplate(firstAgent.agentType).defaultDescription);
  const [systemInstructions, setSystemInstructions] = useState(firstAgent.systemInstructions);
  const [handoffInstructions, setHandoffInstructions] = useState(firstAgent.handoffInstructions);
  const [widgetTitle, setWidgetTitle] = useState(firstAgent.widgetTitle);
  const [greeting, setGreeting] = useState(firstAgent.greeting);
  const [fallbackMessage, setFallbackMessage] = useState(firstAgent.fallbackMessage);
  const [accent, setAccent] = useState(firstAgent.accent);
  const [launcherPosition, setLauncherPosition] = useState(firstAgent.launcherPosition);
  const [welcomePrompts, setWelcomePrompts] = useState(padPrompts(firstAgent.welcomePrompts));
  const [allowedDomains, setAllowedDomains] = useState(padDomains(firstAgent.allowedDomains));
  const [routePatterns, setRoutePatterns] = useState(padRoutePatterns(firstAgent.routePatterns));
  const [leadCaptureFields, setLeadCaptureFields] = useState(padLeadFields(firstAgent.leadCaptureFields));
  const [isSaving, setIsSaving] = useState(false);
  const [agentMutation, setAgentMutation] = useState<string | null>(null);
  const { toast, showToast, dismissToast } = useToast();

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? firstAgent;
  const agentLimit = Math.max(initial.agentCapacity.limit, agents.length);
  const canCreateAgent = agents.length < agentLimit;
  const cleanPrompts = useMemo(() => welcomePrompts.map((prompt) => prompt.trim()).filter(Boolean), [welcomePrompts]);
  const cleanDomains = useMemo(() => allowedDomains.map((domain) => domain.trim()).filter(Boolean), [allowedDomains]);
  const cleanRoutePatterns = useMemo(() => normalizeRoutePatternsClient(routePatterns), [routePatterns]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const response = await fetch("/api/builder", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        action: "save",
        botId: selectedAgent.id,
        botName,
        agentType,
        description,
        systemInstructions,
        handoffInstructions,
        widgetTitle,
        greeting,
        fallbackMessage,
        accent,
        launcherPosition,
        welcomePrompts: cleanPrompts,
        allowedDomains: cleanDomains,
        routePatterns: cleanRoutePatterns,
        leadCaptureFields: leadCaptureFields.filter((field) => field.enabled || isLockedLeadField(field.key))
      })
    });
    const result = (await response.json().catch(() => null)) as SaveResult | null;

    if (!response.ok) {
      showToast("error", result?.error ?? "Could not save widget settings.");
      setIsSaving(false);
      return;
    }

    showToast("success", "Agent settings saved.");
    const nextAgent = result?.agent ?? snapshotCurrentAgent();
    setAgents((current) => current.map((agent) => agent.id === nextAgent.id ? nextAgent : agent));
    setIsSaving(false);
    router.refresh();
  }

  function snapshotCurrentAgent(): BuilderAgentDraft {
    return {
      ...selectedAgent,
      id: selectedAgent.id,
      botName,
      agentType,
      description,
      systemInstructions,
      handoffInstructions,
      widgetTitle,
      greeting,
      fallbackMessage,
      accent,
      launcherPosition,
      welcomePrompts: cleanPrompts,
      allowedDomains: cleanDomains,
      routePatterns: cleanRoutePatterns,
      leadCaptureFields: leadCaptureFields.filter((field) => field.enabled || isLockedLeadField(field.key))
    };
  }

  function loadAgent(agent: BuilderAgentDraft) {
    setSelectedAgentId(agent.id);
    setBotName(agent.botName);
    setAgentType(agent.agentType);
    setDescription(agent.description || getAgentTemplate(agent.agentType).defaultDescription);
    setSystemInstructions(agent.systemInstructions);
    setHandoffInstructions(agent.handoffInstructions);
    setWidgetTitle(agent.widgetTitle);
    setGreeting(agent.greeting);
    setFallbackMessage(agent.fallbackMessage);
    setAccent(agent.accent);
    setLauncherPosition(agent.launcherPosition);
    setWelcomePrompts(padPrompts(agent.welcomePrompts));
    setAllowedDomains(padDomains(agent.allowedDomains));
    setRoutePatterns(padRoutePatterns(agent.routePatterns));
    setLeadCaptureFields(padLeadFields(agent.leadCaptureFields));
  }

  function selectAgent(agent: BuilderAgentDraft) {
    const currentDraft = snapshotCurrentAgent();
    setAgents((current) => current.map((item) => item.id === currentDraft.id ? currentDraft : item));
    loadAgent(agent);
  }

  async function handleCreateAgent(nextType: AgentType) {
    if (!canCreateAgent) {
      showToast("error", "Add an extra agent from Billing before creating another agent.");
      return;
    }

    setAgentMutation(`create-${nextType}`);
    const currentDraft = snapshotCurrentAgent();
    setAgents((current) => current.map((agent) => agent.id === currentDraft.id ? currentDraft : agent));

    const response = await fetch("/api/builder", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        action: "create",
        agentType: nextType,
        accent,
        launcherPosition,
        welcomePrompts: cleanPrompts,
        allowedDomains: cleanDomains,
        routePatterns: [],
        leadCaptureFields: leadCaptureFields.filter((field) => field.enabled || isLockedLeadField(field.key))
      })
    });
    const result = (await response.json().catch(() => null)) as SaveResult | null;

    setAgentMutation(null);

    if (!response.ok || !result?.agent) {
      showToast("error", result?.error ?? "Could not create that agent.");
      return;
    }

    setAgents((current) => [...current.filter((agent) => agent.id !== result.agent!.id), result.agent!]);
    loadAgent(result.agent);
    showToast("success", `${getAgentTemplate(nextType).label} created.`);
    router.refresh();
  }

  async function handleSetDefault() {
    if (selectedAgent.isDefault) {
      return;
    }

    setAgentMutation("default");
    const response = await fetch("/api/builder", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        action: "set_default",
        botId: selectedAgent.id
      })
    });
    const result = (await response.json().catch(() => null)) as SaveResult | null;
    setAgentMutation(null);

    if (!response.ok) {
      showToast("error", result?.error ?? "Could not set the default agent.");
      return;
    }

    setAgents((current) => current.map((agent) => ({ ...agent, isDefault: agent.id === selectedAgent.id })));
    showToast("success", `${botName} is now the default website agent.`);
    router.refresh();
  }

  async function handleArchiveAgent() {
    if (agents.length <= 1) {
      showToast("error", "Keep at least one active agent in the workspace.");
      return;
    }

    setAgentMutation("archive");
    const response = await fetch("/api/builder", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        action: "archive",
        botId: selectedAgent.id
      })
    });
    const result = (await response.json().catch(() => null)) as SaveResult | null;
    setAgentMutation(null);

    if (!response.ok) {
      showToast("error", result?.error ?? "Could not archive that agent.");
      return;
    }

    const remainingAgents = agents.filter((agent) => agent.id !== selectedAgent.id);
    setAgents(remainingAgents);
    loadAgent(remainingAgents[0]);
    showToast("success", `${botName} archived.`);
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

  function updateRoutePattern(index: number, value: string) {
    setRoutePatterns((current) => current.map((pattern, patternIndex) => patternIndex === index ? value : pattern));
  }

  function removeRoutePattern(index: number) {
    setRoutePatterns((current) => current.filter((_, patternIndex) => patternIndex !== index));
  }

  function addRoutePattern(pattern: string) {
    setRoutePatterns((current) => {
      const normalizedPattern = normalizeRoutePatternClient(pattern);

      if (!normalizedPattern || current.some((item) => normalizeRoutePatternClient(item) === normalizedPattern)) {
        return current;
      }

      const next = current.filter((item) => item.trim()).concat(normalizedPattern);
      return next.length > 0 ? next.slice(0, 8) : [normalizedPattern];
    });
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

  function applyAgentType(nextType: AgentType) {
    const nextTemplate = getAgentTemplate(nextType);
    const currentTemplate = getAgentTemplate(agentType);

    setAgentType(nextType);

    if (!description.trim() || description === currentTemplate.defaultDescription) {
      setDescription(nextTemplate.defaultDescription);
    }

    if (!systemInstructions.trim() || systemInstructions === currentTemplate.systemInstructions) {
      setSystemInstructions(nextTemplate.systemInstructions);
    }

    if (!handoffInstructions.trim() || handoffInstructions === currentTemplate.handoffInstructions) {
      setHandoffInstructions(nextTemplate.handoffInstructions);
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
      <ToastViewport toast={toast} onDismiss={dismissToast} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="overflow-hidden rounded-lg border border-harlo-line bg-white">
          <div className="flex flex-col gap-3 border-b border-harlo-line p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-harlo-ink">Agents</h2>
              <p className="mt-1 text-sm text-harlo-muted">Create focused agents for support, sales, or custom visitor workflows.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-harlo-line bg-harlo-canvas px-3 py-1 text-sm font-semibold text-harlo-muted">
              <span className="h-2 w-2 rounded-full bg-harlo-teal" />
              {agents.length} / {agentLimit} active
            </span>
          </div>
          <div className="space-y-5 p-5">
            <div className="grid gap-3 lg:grid-cols-2">
              {agents.map((agent, index) => {
                const template = getAgentTemplate(agent.agentType);
                const isActive = agent.id === selectedAgent.id;

                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => selectAgent(agent)}
                    className={`group rounded-lg border p-4 text-left transition ${
                      isActive
                        ? "border-harlo-teal bg-harlo-teal-soft shadow-soft"
                        : "border-harlo-line bg-white hover:border-harlo-teal/40 hover:bg-harlo-canvas"
                    }`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="flex items-center gap-3">
                        <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ${isActive ? "bg-harlo-teal text-white" : "bg-harlo-teal-soft text-harlo-teal"}`}>
                          {index + 1}
                        </span>
                        <span>
                          <span className="block text-base font-semibold text-harlo-ink">{agent.botName}</span>
                          <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.14em] text-harlo-teal">{template.badge}</span>
                        </span>
                      </span>
                      <span className="flex flex-wrap justify-end gap-2">
                        {agent.routePatterns.length > 0 ? (
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-harlo-muted shadow-sm">
                            {agent.routePatterns.length} route{agent.routePatterns.length === 1 ? "" : "s"}
                          </span>
                        ) : null}
                        {agent.isDefault ? (
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-harlo-teal shadow-sm">Default</span>
                        ) : null}
                      </span>
                    </span>
                    <span className="mt-3 block text-sm leading-6 text-harlo-muted">{agent.description || template.defaultDescription}</span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-lg border border-dashed border-harlo-line bg-harlo-canvas p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-harlo-ink">Add another agent</p>
                  <p className="mt-1 text-sm text-harlo-muted">
                    {canCreateAgent ? "Use a template, then tune the behavior and widget copy." : "Enable the Extra agent add-on in Billing to unlock more agents."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AGENT_TEMPLATES.map((template) => (
                    <Button
                      key={template.type}
                      type="button"
                      variant="secondary"
                      disabled={!canCreateAgent || agentMutation === `create-${template.type}`}
                      onClick={() => handleCreateAgent(template.type)}
                    >
                      {agentMutation === `create-${template.type}` ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                      {template.badge}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-harlo-line bg-white">
          <div className="flex flex-col gap-3 border-b border-harlo-line p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-harlo-ink">Agent role</h2>
              <p className="mt-1 text-sm text-harlo-muted">Choose how {botName || "this agent"} should behave before tuning the widget surface.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={selectedAgent.isDefault || agentMutation === "default"} onClick={handleSetDefault}>
                {agentMutation === "default" ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                {selectedAgent.isDefault ? "Default agent" : "Make default"}
              </Button>
              <Button type="button" variant="ghost" disabled={agents.length <= 1 || agentMutation === "archive"} onClick={handleArchiveAgent}>
                {agentMutation === "archive" ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                Archive
              </Button>
            </div>
          </div>
          <div className="space-y-5 p-5">
            <div className="grid gap-3 md:grid-cols-3">
              {AGENT_TEMPLATES.map((template) => {
                const isActive = agentType === template.type;

                return (
                  <button
                    key={template.type}
                    type="button"
                    onClick={() => applyAgentType(template.type)}
                    className={`rounded-lg border p-4 text-left transition ${
                      isActive
                        ? "border-harlo-teal bg-harlo-teal-soft shadow-soft"
                        : "border-harlo-line bg-white hover:border-harlo-teal/40 hover:bg-harlo-canvas"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 rounded-full border border-harlo-line bg-white px-3 py-1 text-xs font-semibold text-harlo-teal">
                      <span className="h-2 w-2 rounded-full bg-harlo-teal" />
                      {template.badge}
                    </span>
                    <span className="mt-3 block text-base font-semibold text-harlo-ink">{template.label}</span>
                    <span className="mt-2 block text-sm leading-6 text-harlo-muted">{template.description}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field icon={Bot} label="Agent description">
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  maxLength={180}
                  rows={3}
                  className={textareaClass}
                  placeholder="What this agent is responsible for."
                />
              </Field>
              <Field icon={MessageSquare} label="Handoff instructions">
                <textarea
                  value={handoffInstructions}
                  onChange={(event) => setHandoffInstructions(event.target.value)}
                  maxLength={800}
                  rows={3}
                  className={textareaClass}
                  placeholder="What context should the team receive when this agent captures a lead?"
                />
              </Field>
              <Field icon={Sparkles} label="Agent instructions" className="md:col-span-2">
                <textarea
                  value={systemInstructions}
                  onChange={(event) => setSystemInstructions(event.target.value)}
                  maxLength={1200}
                  rows={5}
                  className={textareaClass}
                  placeholder="How this agent should answer, qualify, and route visitors."
                />
              </Field>
            </div>
          </div>
        </section>

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
              <h2 className="text-lg font-semibold text-harlo-ink">Page routing</h2>
              <p className="mt-1 text-sm text-harlo-muted">Match website paths to this agent. The default agent handles unmatched pages.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRoutePatterns((current) => [...current, ""])}
              disabled={routePatterns.length >= 8}
            >
              <Plus size={16} />
              Add
            </Button>
          </div>
          <div className="space-y-5 p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-lg border border-harlo-line bg-harlo-canvas p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-harlo-teal shadow-sm">
                    <RouteIcon size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-harlo-ink">
                      {cleanRoutePatterns.length > 0 ? `${botName || "This agent"} opens on selected pages` : selectedAgent.isDefault ? "Default coverage" : "Pinned or routed"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-harlo-muted">
                      {cleanRoutePatterns.length > 0
                        ? "The workspace snippet will choose this agent when a visitor lands on any matching path."
                        : selectedAgent.isDefault
                          ? "This agent answers every page that does not match another route."
                          : "Add route rules below, or use this agent's pinned snippet on the Widget page."}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <RouteSummary patterns={cleanRoutePatterns} fallbackLabel={selectedAgent.isDefault ? "All unmatched pages" : "No route rules yet"} />
                      {cleanRoutePatterns.length > 0 ? (
                        <a
                          href={`/widget-test?path=${encodeURIComponent(getExampleRoutePath(cleanRoutePatterns[0]))}`}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-harlo-line bg-white px-3 text-xs font-semibold text-harlo-ink shadow-sm transition hover:border-harlo-teal hover:text-harlo-teal"
                        >
                          Test route
                          <ArrowUpRight size={13} />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-harlo-line bg-white p-4">
                <p className="text-sm font-semibold text-harlo-ink">Quick routes</p>
                <p className="mt-1 text-xs leading-5 text-harlo-muted">Use exact pages or wildcard groups.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ROUTE_EXAMPLES.map((pattern) => (
                    <button
                      key={pattern}
                      type="button"
                      onClick={() => addRoutePattern(pattern)}
                      className="rounded-full border border-harlo-line bg-harlo-canvas px-3 py-1.5 text-xs font-semibold text-harlo-muted transition hover:border-harlo-teal hover:text-harlo-teal"
                    >
                      {pattern}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {routePatterns.map((pattern, index) => (
              <div key={index} className="flex gap-2">
                <span className="grid h-11 w-11 place-items-center rounded-lg border border-harlo-line bg-harlo-canvas text-harlo-muted">
                  <RouteIcon size={16} />
                </span>
                <input
                  value={pattern}
                  onChange={(event) => updateRoutePattern(index, event.target.value)}
                  className={inputClass}
                  placeholder="/pricing, /services/*, or *"
                />
                <Button type="button" variant="ghost" className="px-3" onClick={() => removeRoutePattern(index)} aria-label="Remove route pattern">
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            <p className="text-xs leading-5 text-harlo-muted">
              Use exact paths like /pricing or wildcard paths like /services/*. Route order is preserved from top to bottom.
            </p>
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
            Save agent settings
          </Button>
        </div>
      </form>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <ChatWidgetPreview
          title={widgetTitle}
          greeting={greeting}
          accent={accent}
          launcherPosition={launcherPosition}
          welcomePrompts={cleanPrompts}
          brandLogoUrl={initial.brandLogoUrl}
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
  icon: LucideIcon;
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

function RouteSummary({ patterns, fallbackLabel }: { patterns: string[]; fallbackLabel: string }) {
  const visiblePatterns = patterns.slice(0, 5);
  const overflow = Math.max(0, patterns.length - visiblePatterns.length);

  return (
    <div className="flex flex-wrap gap-2">
      {visiblePatterns.length > 0 ? (
        <>
          {visiblePatterns.map((pattern) => (
            <span key={pattern} className="rounded-full border border-harlo-line bg-white px-2.5 py-1 text-xs font-semibold text-harlo-muted shadow-sm">
              {pattern}
            </span>
          ))}
          {overflow > 0 ? (
            <span className="rounded-full border border-harlo-line bg-white px-2.5 py-1 text-xs font-semibold text-harlo-muted shadow-sm">
              +{overflow} more
            </span>
          ) : null}
        </>
      ) : (
        <span className="rounded-full border border-harlo-line bg-white px-2.5 py-1 text-xs font-semibold text-harlo-muted shadow-sm">
          {fallbackLabel}
        </span>
      )}
    </div>
  );
}

function makeAgentFromInitial(initial: BuilderInitial): BuilderAgentDraft {
  return {
    id: "default",
    botName: initial.botName,
    agentType: initial.agentType,
    description: initial.description,
    systemInstructions: initial.systemInstructions,
    handoffInstructions: initial.handoffInstructions,
    widgetTitle: initial.widgetTitle,
    greeting: initial.greeting,
    fallbackMessage: initial.fallbackMessage,
    accent: initial.accent,
    launcherPosition: initial.launcherPosition,
    welcomePrompts: initial.welcomePrompts,
    allowedDomains: initial.allowedDomains,
    routePatterns: initial.routePatterns,
    leadCaptureFields: initial.leadCaptureFields,
    isDefault: true
  };
}

function padPrompts(prompts: string[]) {
  return prompts.length > 0 ? prompts : ["What services do you offer?", "How much does it cost?", "Can I book a consultation?"];
}

function padDomains(domains: string[]) {
  return domains.length > 0 ? domains : [""];
}

function padRoutePatterns(patterns: string[]) {
  return patterns.length > 0 ? patterns : [""];
}

function normalizeRoutePatternsClient(patterns: string[]) {
  return Array.from(
    new Set(
      patterns
        .map((pattern) => normalizeRoutePatternClient(pattern))
        .filter((pattern): pattern is string => Boolean(pattern))
    )
  ).slice(0, 8);
}

function normalizeRoutePatternClient(value: string | undefined) {
  const raw = value?.trim();

  if (!raw) {
    return null;
  }

  if (raw === "*") {
    return raw;
  }

  const prefixed = raw.startsWith("/") ? raw : `/${raw}`;

  return prefixed.replace(/\/{2,}/g, "/").slice(0, 240);
}

function getExampleRoutePath(pattern: string | undefined) {
  const normalized = normalizeRoutePatternClient(pattern) ?? "/";

  if (normalized === "*") {
    return "/";
  }

  if (normalized.endsWith("/*")) {
    return `${normalized.slice(0, -2)}/example`;
  }

  return normalized.length > 1 ? normalized.replace(/\/+$/g, "") : "/";
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
const ROUTE_EXAMPLES = ["/pricing", "/contact", "/services/*", "/support/*"];
