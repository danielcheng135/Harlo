import type { ReactNode } from "react";
import { Send, Sparkles } from "lucide-react";

type ChatWidgetPreviewProps = {
  title?: string;
  greeting?: string;
  accent?: string;
  launcherPosition?: "bottom-right" | "bottom-left";
  welcomePrompts?: string[];
  brandLogoUrl?: string | null;
};

export function ChatWidgetPreview({
  title = "Harlo Assistant",
  greeting = "Hi, I can help answer questions and get you to the right next step.",
  accent = "#087f95",
  launcherPosition = "bottom-right",
  welcomePrompts = ["What services do you offer?", "How much does it cost?"],
  brandLogoUrl = null
}: ChatWidgetPreviewProps) {
  const accentText = getReadableTextColor(accent);
  const isLeft = launcherPosition === "bottom-left";
  const gradient = `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 82%, #111827))`;
  const accentShadow = `0 18px 38px color-mix(in srgb, ${accent} 28%, transparent), 0 6px 14px rgba(15,23,42,.12)`;

  return (
    <div className="relative min-h-[560px] overflow-hidden rounded-lg border border-harlo-line bg-[#f5f8fa] p-5">
      <div className="absolute inset-x-5 top-5 bottom-[92px] flex items-end justify-center">
        <div className="flex h-full w-full max-w-[410px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,.18),0_1px_0_rgba(255,255,255,.9)_inset]">
          <div className="flex min-h-[76px] items-center justify-between gap-3 px-[18px] py-[18px]" style={{ background: accent, color: accentText }}>
            <div className="flex min-w-0 items-center gap-3">
              <BrandMark brandLogoUrl={brandLogoUrl} accent={accent} accentText={accentText} />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-extrabold tracking-normal" style={{ color: accentText }}>
                  {title || "Ask Harlo"}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: `color-mix(in srgb, ${accentText} 82%, transparent)` }}>
                  Usually replies instantly
                </p>
              </div>
            </div>
            <span
              className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full"
              style={{ background: `color-mix(in srgb, ${accentText} 14%, transparent)`, color: accentText }}
              aria-hidden="true"
            >
              <span className="h-0.5 w-[18px] rounded-full" style={{ background: accentText }} />
            </span>
          </div>

          <div className="flex-1 overflow-hidden bg-gradient-to-b from-[#fbfdff] to-white p-[18px]">
            <div className="space-y-3">
              <AssistantMessage brandLogoUrl={brandLogoUrl} accent={accent}>
                {greeting}
              </AssistantMessage>

              <div className="flex flex-col items-end">
                <div
                  className="max-w-[86%] rounded-2xl rounded-tr-md px-[13px] py-3 text-sm leading-relaxed shadow-[0_12px_26px_rgba(15,23,42,.10)]"
                  style={{ background: gradient, color: accentText }}
                >
                  {welcomePrompts[0] ?? "What services do you offer?"}
                </div>
                <p className="mt-1 mr-0.5 text-[11px] text-[#7c8986]">Visitor · 10:24 AM</p>
              </div>

              <AssistantMessage brandLogoUrl={brandLogoUrl} accent={accent}>
                Here is how the live widget will look with this brand color.
              </AssistantMessage>
            </div>
          </div>

          <div className="flex gap-2 border-t border-[#edf2f5] bg-white px-[13px] py-3">
            <div className="flex min-h-11 flex-1 items-center rounded-[14px] border border-[#dbe5ea] bg-[#fbfdff] px-[13px] text-sm text-harlo-muted">
              Ask a question...
            </div>
            <span
              className="grid h-11 w-[46px] shrink-0 place-items-center rounded-[14px] shadow-[0_12px_22px_rgba(15,23,42,.10)]"
              style={{ background: gradient, color: "#fff" }}
              aria-hidden="true"
            >
              <Send size={18} />
            </span>
          </div>
          <div className="bg-white pb-[13px] text-center text-[11px] text-[#7c8986]">
            Powered by <span className="font-extrabold text-[#5f6876]">Harlo</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`absolute bottom-5 grid h-[58px] w-[58px] place-items-center rounded-full transition ${
          isLeft ? "left-5" : "right-5"
        }`}
        style={{ background: gradient, color: accentText, boxShadow: accentShadow }}
        aria-label="Open widget preview"
      >
        <LauncherIcon />
      </button>
    </div>
  );
}

function BrandMark({
  brandLogoUrl,
  accent,
  accentText
}: {
  brandLogoUrl: string | null;
  accent: string;
  accentText: string;
}) {
  if (brandLogoUrl) {
    return (
      <span className="grid h-[42px] w-[42px] shrink-0 place-items-center overflow-hidden rounded-[14px] bg-[#f4f4f4]">
        <img
          src={brandLogoUrl}
          alt=""
          className="h-full w-full object-contain p-1.5"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </span>
    );
  }

  return (
    <span
      className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[14px] border shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_10px_24px_rgba(15,23,42,.14)]"
      style={{
        background: `color-mix(in srgb, ${accentText} 16%, transparent)`,
        borderColor: `color-mix(in srgb, ${accentText} 35%, transparent)`,
        color: accentText
      }}
    >
      <Sparkles size={20} />
    </span>
  );
}

function AssistantMessage({
  brandLogoUrl,
  accent,
  children
}: {
  brandLogoUrl: string | null;
  accent: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex max-w-[94%] items-start gap-2.5">
        <span
          className={`grid h-[30px] w-[30px] shrink-0 place-items-center overflow-hidden rounded-[10px] ${
            brandLogoUrl ? "bg-[#f4f4f4]" : "text-white"
          }`}
          style={brandLogoUrl ? undefined : { background: accent }}
        >
          {brandLogoUrl ? (
            <img src={brandLogoUrl} alt="" className="h-full w-full object-contain p-1" loading="lazy" referrerPolicy="no-referrer" />
          ) : (
            <Sparkles size={15} />
          )}
        </span>
        <div className="max-w-[86%] rounded-2xl rounded-tl-md border border-[#e8edf1] bg-[#f4f4f4] px-[13px] py-3 text-sm leading-relaxed text-[#111827] shadow-[0_1px_0_rgba(15,23,42,.04)]">
          {children}
        </div>
      </div>
      <p className="mt-1 ml-10 text-[11px] text-[#7c8986]">Assistant · 10:24 AM</p>
    </div>
  );
}

function LauncherIcon() {
  return (
    <svg className="h-[31px] w-[31px]" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.6 8.6 0 0 1-7.7 4.7 8.7 8.7 0 0 1-4.1-1L3 20l1.3-4.5a8.4 8.4 0 0 1-.9-4 8.6 8.6 0 0 1 17.2 0Z" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
    </svg>
  );
}

function getReadableTextColor(color: string) {
  const normalized = color.replace("#", "");

  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return "#ffffff";
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.62 ? "#111827" : "#ffffff";
}
