import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star
} from "lucide-react";
import { getWorkspaceOrRedirect } from "@/lib/harlo/data";

export const metadata: Metadata = {
  title: "Widget Demo | Harlo",
  robots: {
    index: false,
    follow: false
  }
};

export default async function WidgetTestPage({
  searchParams
}: {
  searchParams?: Promise<{ botId?: string; path?: string }>;
}) {
  const workspace = await getWorkspaceOrRedirect();
  const params = await searchParams;
  const botId = params?.botId?.trim() || null;
  const testPath = normalizeTestPath(params?.path);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const simulatedPageUrl = `${appUrl}${testPath}`;
  const businessName = workspace.organization.name;
  const modeLabel = botId ? "Pinned agent" : "Automatic routing";
  const selectedBot = workspace.bots.find((bot) => bot.id === botId) ?? workspace.bot;
  const accent = selectedBot.widget_theme.accent;
  const accentText = getReadableTextColor(accent);
  const businessLogoUrl = workspace.organization.brand_logo_url;
  const demoTheme = {
    "--demo-accent": accent,
    "--demo-accent-text": accentText,
    "--demo-soft": `color-mix(in srgb, ${accent} 10%, white)`,
    "--demo-softer": `color-mix(in srgb, ${accent} 5%, white)`,
    "--demo-line": `color-mix(in srgb, ${accent} 20%, #dfe7e6)`,
    "--demo-deep": `color-mix(in srgb, ${accent} 58%, #082f37)`
  } as CSSProperties;

  return (
    <main className="min-h-screen bg-[var(--demo-softer)] text-[#102b31]" style={demoTheme}>
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#032832] px-4 py-3 text-white shadow-lg shadow-slate-950/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/builder"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/10 transition hover:bg-white/15"
              aria-label="Back to agent builder"
            >
              <ArrowLeft size={17} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-cyan-300" />
                <p className="text-sm font-semibold">Harlo widget demo</p>
              </div>
              <p className="mt-0.5 text-xs text-white/60">This preview is only visible to your workspace.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.07] px-3 text-white/75">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {modeLabel}
            </span>
            <span className="inline-flex h-8 max-w-[280px] items-center rounded-lg border border-white/10 bg-white/[0.07] px-3 text-white/75">
              <span className="truncate">{testPath}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <header className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-[var(--demo-accent)] text-[var(--demo-accent-text)]"
            >
              {businessLogoUrl ? (
                <img src={businessLogoUrl} alt={`${businessName} logo`} className="h-full w-full object-contain p-1.5" />
              ) : (
                <BadgeCheck size={20} />
              )}
            </span>
            <div>
              <p className="text-base font-bold tracking-normal">{businessName}</p>
              <p className="text-xs font-medium text-[#6e7f82]">Trusted local specialists</p>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#52666a] md:flex">
            <a href="#services" className="transition hover:text-[var(--demo-accent)]">Services</a>
            <a href="#process" className="transition hover:text-[var(--demo-accent)]">How it works</a>
            <a href="#about" className="transition hover:text-[var(--demo-accent)]">About</a>
          </nav>
          <button type="button" className="hidden h-10 items-center gap-2 rounded-lg bg-[var(--demo-accent)] px-4 text-sm font-semibold text-[var(--demo-accent-text)] sm:inline-flex">
            Get started
            <ArrowRight size={15} />
          </button>
        </header>
      </div>

      <section className="relative overflow-hidden border-y border-[var(--demo-line)] bg-[var(--demo-soft)]">
        <div
          className="absolute inset-0 opacity-45 [background-size:42px_42px]"
          style={{
            backgroundImage: `linear-gradient(color-mix(in srgb, ${accent} 18%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, ${accent} 18%, transparent) 1px, transparent 1px)`
          }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)] lg:items-center lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--demo-line)] bg-white/75 px-3 py-1.5 text-xs font-semibold text-[var(--demo-accent)]">
              <Star size={13} fill="currentColor" />
              Responsive help, right when you need it
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-normal text-[#092f35] sm:text-6xl">
              Expert help without the waiting.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#526b6f] sm:text-lg">
              Explore our services, get clear answers, and find the right next step for your needs. Our AI agent is ready to help in the corner of this page.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" className="inline-flex h-12 items-center gap-2 rounded-lg bg-[var(--demo-accent)] px-5 text-sm font-semibold text-[var(--demo-accent-text)] shadow-sm">
                Explore services
                <ArrowRight size={16} />
              </button>
              <button type="button" className="inline-flex h-12 items-center gap-2 rounded-lg border border-[var(--demo-line)] bg-white px-5 text-sm font-semibold text-[#173d42]">
                <MessageCircle size={16} />
                Ask a question
              </button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#536b6f]">
              {["Fast answers", "Clear next steps", "Friendly support"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--demo-soft)] text-[var(--demo-accent)]">
                    <Check size={12} />
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative min-h-[370px]">
            <div className="absolute inset-4 rounded-lg bg-[var(--demo-deep)]" />
            <div className="relative grid min-h-[370px] content-between overflow-hidden rounded-lg border border-white/70 bg-white p-6 shadow-[0_25px_70px_rgba(10,51,57,0.14)] sm:p-8">
              <div>
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-[var(--demo-soft)] text-[var(--demo-accent)]">
                  <MessageCircle size={23} />
                </span>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--demo-accent)]">Try the live experience</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal text-[#102f35]">Open the chat widget</h2>
                <p className="mt-3 text-sm leading-6 text-[#63777a]">
                  Ask about services, pricing, availability, or the next step. Replies use your agent’s current knowledge and settings.
                </p>
              </div>
              <div className="mt-8 rounded-lg border border-[var(--demo-line)] bg-[var(--demo-softer)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#183a40]">Live widget</p>
                    <p className="mt-1 text-xs text-[#6c7e81]">Look for the launcher near the bottom corner.</p>
                  </div>
                  <span className="h-3 w-3 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,.12)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--demo-accent)]">What we can help with</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-[#102f35]">Services built around your needs</h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-[#63777a]">
            These sample sections give you realistic page content for testing answers, routing rules, and the overall widget experience.
          </p>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {[
            { icon: Clock3, title: "Quick consultation", text: "Get answers and understand the best next step before committing." },
            { icon: ShieldCheck, title: "Complete service", text: "A reliable end-to-end option with clear expectations from the start." },
            { icon: MapPin, title: "Local support", text: "Connect with a team that understands your area and responds quickly." }
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="group rounded-lg border border-[var(--demo-line)] bg-white p-6 transition hover:-translate-y-0.5 hover:border-[var(--demo-accent)] hover:shadow-lg hover:shadow-[#123f45]/5">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--demo-soft)] text-[var(--demo-accent)]">
                <Icon size={19} />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#667a7d]">{text}</p>
              <button type="button" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--demo-accent)]">
                Learn more
                <ChevronRight size={15} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section id="process" className="border-t border-[var(--demo-line)] bg-[var(--demo-deep)] px-5 py-12 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white/75">Ready to test?</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal">Start a conversation with your AI agent.</h2>
            <p className="mt-2 text-sm text-white/65">The launcher uses your saved branding, prompts, knowledge, and routing configuration.</p>
          </div>
          <div className="inline-flex items-center gap-3 self-start rounded-lg border border-white/10 bg-white/[0.07] px-4 py-3 sm:self-auto">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--demo-accent)] text-[var(--demo-accent-text)]">
              <MessageCircle size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold">Widget is active</p>
              <p className="text-xs text-white/60">Open it from the bottom corner</p>
            </div>
          </div>
        </div>
      </section>

      {botId ? (
        <script src="/widget.js" data-harlo-bot={botId} data-harlo-page-url={simulatedPageUrl} async />
      ) : (
        <script src="/widget.js" data-harlo-organization={workspace.organization.id} data-harlo-page-url={simulatedPageUrl} async />
      )}
    </main>
  );
}

function normalizeTestPath(path: string | undefined) {
  const trimmed = path?.trim() || "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  return withSlash.length > 1 ? withSlash.replace(/\/+$/g, "") : "/";
}

function getReadableTextColor(hex: string) {
  const normalized = hex.replace("#", "");

  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return "#ffffff";
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.62 ? "#102b31" : "#ffffff";
}
