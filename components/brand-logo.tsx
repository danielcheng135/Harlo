export function BrandLogo() {
  return (
    <div className="flex items-center gap-2 text-harlo-ink">
      <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg">
        <img src="/icon.png" alt="Harlo logo" className="h-full w-full object-contain" />
      </span>
      <span className="text-xl font-semibold tracking-tight">Harlo</span>
    </div>
  );
}
