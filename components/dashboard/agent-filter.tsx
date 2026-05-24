import type { Route } from "next";
import { Bot } from "lucide-react";
import { FilterSubmitButton } from "@/components/analytics/filter-submit-button";
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

  const activeBot = bots.find((bot) => bot.id === activeAgentId);
  const selectedAgentLabel = activeBot ? activeBot.name : "All Agents";

  return (
    <div className="group relative shrink-0" tabIndex={0}>
      <div className="flex h-16 w-full cursor-default items-center justify-between gap-3 rounded-lg border border-harlo-line bg-white px-4 shadow-sm transition group-hover:border-harlo-teal group-focus-within:border-harlo-teal group-focus:outline-none group-focus:ring-2 group-focus:ring-harlo-mist sm:min-w-52">
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-harlo-teal">Agents</span>
          <span className="mt-0.5 block truncate text-sm font-semibold text-harlo-ink">{selectedAgentLabel}</span>
        </span>
        <span className="text-harlo-muted">
          <Bot size={14} />
        </span>
      </div>
      <form action={basePath} className="pointer-events-none absolute right-0 top-full z-30 w-[min(340px,calc(100vw-2rem))] translate-y-1 pt-2 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
      <div className="rounded-lg border border-harlo-line bg-white p-4 shadow-xl">
          <p className="text-sm font-semibold text-harlo-ink">Select agent</p>
          <div className="mt-3 space-y-2">
            <AgentFilterOption checked={!activeAgentId} count={allCount} label="All Agents" value="all" />
            {bots.map((bot) => (
              <AgentFilterOption
                key={bot.id}
                checked={activeAgentId === bot.id}
                count={counts[bot.id] ?? 0}
                label={bot.name}
                value={bot.id}
              />
            ))}
          </div>
          <FilterSubmitButton label="Apply agent" pendingLabel="Applying..." />
        </div>
      </form>
    </div>
  );
}

function AgentFilterOption({
  checked,
  count,
  label,
  value
}: {
  checked: boolean;
  count: number;
  label: string;
  value: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-harlo-line px-3 py-2.5 text-sm font-semibold text-harlo-ink transition hover:bg-harlo-mist">
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className={cn("rounded-full px-2 py-0.5 text-xs", checked ? "bg-harlo-mist text-harlo-teal" : "bg-harlo-canvas text-harlo-muted")}>
        {count}
      </span>
      <input className="h-4 w-4 shrink-0 accent-harlo-teal" defaultChecked={checked} name="agent" type="radio" value={value} />
    </label>
  );
}
