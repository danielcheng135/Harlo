export function CurvedLineBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-16 h-[34rem] overflow-hidden">
      <svg className="h-full w-full" viewBox="0 0 1440 540" fill="none" preserveAspectRatio="none">
        <path d="M-140 270C250 72 1190 72 1580 270" stroke="#d8e0e8" strokeWidth="1.5" />
        <path d="M-140 365C250 167 1190 167 1580 365" stroke="#d8e0e8" strokeWidth="1.5" />
        <path d="M-140 460C250 262 1190 262 1580 460" stroke="#d8e0e8" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
