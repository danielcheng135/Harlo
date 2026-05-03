import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-harlo-line bg-harlo-mist px-2.5 py-1 text-xs font-medium text-harlo-teal",
        className
      )}
      {...props}
    />
  );
}
