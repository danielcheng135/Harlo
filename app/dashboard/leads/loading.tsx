export default function LeadsLoading() {
  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-5 overflow-hidden">
      <header className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="h-9 w-24 animate-pulse rounded-md bg-harlo-line" />
          <div className="mt-3 h-5 w-full max-w-xl animate-pulse rounded-md bg-harlo-line" />
        </div>
        <div className="h-14 w-52 animate-pulse rounded-lg border border-harlo-line bg-white" />
      </header>

      <div className="h-11 shrink-0 animate-pulse rounded-lg bg-harlo-line/70" />
      <div className="h-16 shrink-0 animate-pulse rounded-lg border border-harlo-line bg-white" />

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm">
          <div className="h-12 shrink-0 border-b border-harlo-line" />
          <div className="min-h-0 flex-1 space-y-3 overflow-hidden p-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg bg-harlo-canvas" />
            ))}
          </div>
        </section>
        <aside className="overflow-hidden rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-harlo-line" />
          <div className="mx-auto mt-4 h-6 w-40 animate-pulse rounded bg-harlo-line" />
          <div className="mt-5 h-24 animate-pulse rounded-lg bg-harlo-canvas" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-5 animate-pulse rounded bg-harlo-line" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
