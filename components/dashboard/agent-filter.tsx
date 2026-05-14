import Link from "next/link";
import type { Route } from "next";
import { AgentBadge } from "@/components/agent-badge";
import type { WorkspaceBot } from "@/lib/harlo/data";
import { cn } from "@/lib/utils";

type AgentFilterProps = {
  basePath: Route;
  bots: WorkspaceBot[];
  activeAgentId?: string;
  counts?: Record<string, number>;
  allCount: number;
};

export function AgentFilter({ basePath, bots, activeAgentId, counts = {}, allCount }: AgentFilterProps) {
  if (bots.length <= 1) {
    return null;
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-2 rounded-lg border border-harlo-line bg-white p-2 shadow-sm">
      <Link
        href={basePath}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
          !activeAgentId
            ? "bg-harlo-ink text-white"
            : "text-harlo-muted hover:bg-harlo-canvas hover:text-harlo-ink"
        )}
      >
        All agents
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs",
            !activeAgentId ? "bg-white/15 text-white" : "bg-harlo-canvas text-harlo-muted"
          )}
        >
          {allCount}
        </span>
      </Link>
      {bots.map((bot) => {
        const active = activeAgentId === bot.id;

        return (
          <Link
          key={bot.id}
          href={{ pathname: basePath, query: { agent: bot.id } }}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
              active
                ? "bg-harlo-mist text-harlo-teal ring-1 ring-harlo-teal/30"
                : "text-harlo-muted hover:bg-harlo-canvas hover:text-harlo-ink"
            )}
          >
            <AgentBadge
              compact
              name={bot.name}
              type={bot.agent_type}
              accent={bot.widget_theme.accent}
              className="border-transparent bg-transparent p-0 shadow-none"
            />
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                active ? "bg-white text-harlo-teal" : "bg-harlo-canvas text-harlo-muted"
              )}
            >
              {counts[bot.id] ?? 0}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
