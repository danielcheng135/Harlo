import { Badge } from "@/components/ui/badge";

export default function LeadsLoading() {
  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-6 overflow-hidden">
      <div className="shrink-0">
        <Badge>Lead capture</Badge>
        <div className="mt-3 h-9 w-24 animate-pulse rounded-md bg-harlo-line" />
        <div className="mt-3 h-5 w-full max-w-xl animate-pulse rounded-md bg-harlo-line" />
      </div>

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm xl:grid-cols-[420px_1fr]">
        <aside className="border-r border-harlo-line bg-harlo-canvas/40 p-3">
          <div className="mb-3 h-24 animate-pulse rounded-lg bg-white" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-harlo-line bg-white p-3">
                <div className="h-4 w-2/3 animate-pulse rounded bg-harlo-line" />
                <div className="mt-3 h-3 w-full animate-pulse rounded bg-harlo-line" />
                <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-harlo-line" />
              </div>
            ))}
          </div>
        </aside>
        <section className="p-5">
          <div className="h-7 w-52 animate-pulse rounded bg-harlo-line" />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="h-24 animate-pulse rounded-lg bg-harlo-line" />
            <div className="h-24 animate-pulse rounded-lg bg-harlo-line" />
          </div>
          <div className="mt-5 h-36 animate-pulse rounded-lg bg-harlo-line" />
        </section>
      </div>
    </div>
  );
}
