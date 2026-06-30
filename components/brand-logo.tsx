export function BrandLogo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <div className={`flex items-center gap-1.5 ${tone === "light" ? "text-white" : "text-harlo-ink"}`}>
      <span className="grid h-5 w-5 place-items-center overflow-hidden rounded-[4px]">
        <img src="/icon.png" alt="Harlo logo" className="h-full w-full object-contain" />
      </span>
      <span className="text-xl font-bold tracking-[-0.03em]">Harlo</span>
    </div>
  );
}
