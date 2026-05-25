"use client";

import { Check } from "lucide-react";
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <span className="relative inline-grid h-4 w-4 shrink-0 place-items-center">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "peer h-4 w-4 appearance-none rounded border border-slate-300 bg-white transition",
          "checked:border-harlo-teal checked:bg-harlo-teal",
          "focus:outline-none focus:ring-2 focus:ring-harlo-teal/30 focus:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      <Check className="pointer-events-none absolute hidden h-3 w-3 text-white peer-checked:block" strokeWidth={3} />
    </span>
  )
);

Checkbox.displayName = "Checkbox";
