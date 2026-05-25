export function BrandLogo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <div className={`flex items-center gap-2 ${tone === "light" ? "text-white" : "text-harlo-ink"}`}>
      <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg">
        <img src="/icon.png" alt="Harlo logo" className="h-full w-full object-contain" />
      </span>
      <span className="text-xl font-semibold tracking-tight">Harlo AI</span>
    </div>
  );
}
