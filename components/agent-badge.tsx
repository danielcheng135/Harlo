import type { AgentType } from "@/lib/agents";
import { cn } from "@/lib/utils";

type AgentBadgeProps = {
  name?: string | null;
  type?: AgentType | string | null;
  accent?: string | null;
  compact?: boolean;
  className?: string;
};

export function AgentBadge({
  name = "Harlo",
  type = "support",
  accent = "#087f95",
  compact = false,
  className
}: AgentBadgeProps) {
  const safeType = typeof type === "string" && type.length > 0 ? type : "support";
  const label = safeType.charAt(0).toUpperCase() + safeType.slice(1);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border border-harlo-line bg-white px-2.5 py-1 text-xs font-semibold text-harlo-ink shadow-sm",
        className
      )}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accent ?? "#087f95" }} />
      <span className="truncate">{name || "Harlo"}</span>
      {!compact ? (
        <span className="rounded-full bg-harlo-canvas px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-harlo-muted">
          {label}
        </span>
      ) : null}
    </span>
  );
}
