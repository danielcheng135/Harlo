import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  body: string;
  className?: string;
};

export function EmptyState({ icon: Icon, title, body, className }: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-harlo-line bg-harlo-canvas/70 p-6 text-center", className)}>
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
        <Icon size={20} />
      </span>
      <h2 className="mt-4 text-base font-semibold text-harlo-ink">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-harlo-muted">{body}</p>
    </div>
  );
}
