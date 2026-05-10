import { MessageCircle, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  greeting = "Hi, I can answer questions about services, pricing, and availability.",
  accent = "#087f95",
  launcherPosition = "bottom-right",
  welcomePrompts = ["What services do you offer?", "How much does it cost?"],
  brandLogoUrl = null
}: ChatWidgetPreviewProps) {
  const accentText = getReadableTextColor(accent);

  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-lg border border-harlo-line bg-harlo-mist p-5">
      <div className="rounded-lg bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between border-b border-harlo-line pb-4">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-10 w-10 place-items-center overflow-hidden rounded-lg ${
                brandLogoUrl ? "bg-harlo-mist text-harlo-teal" : ""
              }`}
              style={brandLogoUrl ? undefined : { background: accent, color: accentText }}
            >
              {brandLogoUrl ? (
                <img
                  src={brandLogoUrl}
                  alt=""
                  className="h-full w-full object-contain p-1.5"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Sparkles size={18} />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold text-harlo-ink">{title}</p>
              <p className="text-xs text-harlo-muted">Usually replies instantly</p>
            </div>
          </div>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
        </div>

        <div className="space-y-3 py-5">
          <div className="max-w-[82%] rounded-lg bg-slate-100 p-3 text-sm text-harlo-ink">
            {greeting}
          </div>
          <div className="ml-auto max-w-[82%] rounded-lg p-3 text-sm" style={{ background: accent, color: accentText }}>
            {welcomePrompts[0] ?? "What services do you offer?"}
          </div>
          <div className="max-w-[86%] rounded-lg bg-slate-100 p-3 text-sm text-harlo-ink">
            Here is how the widget will look with this brand color.
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-harlo-line bg-harlo-canvas p-2">
          <span className="flex-1 px-2 text-sm text-harlo-muted">Ask about services...</span>
          <Button className="h-8 w-8 px-0" aria-label="Send message" style={{ background: accent, color: accentText }}>
            <Send size={15} />
          </Button>
        </div>
      </div>

      <button
        className={`absolute bottom-5 grid h-14 w-14 place-items-center rounded-full shadow-soft ${
          launcherPosition === "bottom-left" ? "left-5" : "right-5"
        }`}
        style={{ background: accent, color: accentText }}
      >
        <MessageCircle size={22} />
      </button>
    </div>
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
