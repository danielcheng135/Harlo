import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-harlo-teal focus:ring-offset-2",
        variant === "primary" &&
          "bg-harlo-ink text-white shadow-sm hover:bg-harlo-navy",
        variant === "secondary" &&
          "border border-harlo-line bg-white text-harlo-ink hover:border-harlo-teal hover:text-harlo-teal",
        variant === "ghost" &&
          "text-harlo-muted hover:bg-harlo-mist hover:text-harlo-ink",
        className
      )}
      {...props}
    />
  );
}
