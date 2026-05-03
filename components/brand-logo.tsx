import { Sparkles } from "lucide-react";

export function BrandLogo() {
  return (
    <div className="flex items-center gap-2 text-harlo-ink">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-harlo-teal text-white">
        <Sparkles size={18} />
      </span>
      <span className="text-xl font-semibold tracking-tight">Harlo</span>
    </div>
  );
}
