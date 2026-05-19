export default function ConversationsLoading() {
  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-5 overflow-hidden">
      <header className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="h-9 w-56 animate-pulse rounded-md bg-harlo-line" />
          <div className="mt-3 h-5 w-full max-w-xl animate-pulse rounded-md bg-harlo-line" />
        </div>
        <div className="h-14 w-52 animate-pulse rounded-lg border border-harlo-line bg-white" />
      </header>

      <div className="h-11 shrink-0 animate-pulse rounded-lg bg-harlo-line/70" />

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm xl:grid-cols-[340px_minmax(0,1fr)_330px] 2xl:grid-cols-[380px_minmax(0,1fr)_360px]">
        <aside className="flex min-h-0 flex-col border-b border-harlo-line xl:border-b-0 xl:border-r">
          <div className="shrink-0 border-b border-harlo-line p-4">
            <div className="h-10 animate-pulse rounded-lg bg-harlo-canvas" />
          </div>
          <div className="space-y-2 p-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-lg border border-harlo-line bg-harlo-canvas" />
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col border-b border-harlo-line xl:border-b-0 xl:border-r">
          <div className="shrink-0 border-b border-harlo-line p-5">
            <div className="h-7 w-56 animate-pulse rounded bg-harlo-line" />
            <div className="mt-3 h-4 w-80 animate-pulse rounded bg-harlo-line" />
          </div>
          <div className="space-y-4 p-5">
            <div className="h-16 w-3/4 animate-pulse rounded-lg bg-harlo-canvas" />
            <div className="ml-auto h-20 w-2/3 animate-pulse rounded-lg bg-harlo-canvas" />
            <div className="h-20 w-4/5 animate-pulse rounded-lg bg-harlo-canvas" />
          </div>
        </section>

        <aside className="p-5">
          <div className="h-24 animate-pulse rounded-lg bg-harlo-canvas" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg bg-harlo-canvas" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
