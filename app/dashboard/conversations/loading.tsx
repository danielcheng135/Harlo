import { Badge } from "@/components/ui/badge";

export default function ConversationsLoading() {
  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-6 overflow-hidden">
      <div className="shrink-0">
        <Badge>Conversation history</Badge>
        <div className="mt-3 h-9 w-52 animate-pulse rounded-md bg-harlo-line" />
        <div className="mt-3 h-5 w-full max-w-md animate-pulse rounded-md bg-harlo-line" />
      </div>

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-lg border border-harlo-line bg-white shadow-sm xl:grid-cols-[380px_1fr]">
        <aside className="flex min-h-0 flex-col border-b border-harlo-line bg-harlo-canvas/40 xl:border-b-0 xl:border-r">
          <div className="shrink-0 border-b border-harlo-line bg-white p-4">
            <div className="h-10 animate-pulse rounded-lg bg-harlo-canvas" />
          </div>
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-harlo-line bg-white p-3">
                <div className="h-4 w-2/3 animate-pulse rounded bg-harlo-line" />
                <div className="mt-3 h-3 w-full animate-pulse rounded bg-harlo-line" />
                <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-harlo-line" />
              </div>
            ))}
          </div>
        </aside>

        <div>
          <div className="border-b border-harlo-line p-5">
            <div className="h-6 w-64 animate-pulse rounded bg-harlo-line" />
            <div className="mt-3 h-4 w-80 animate-pulse rounded bg-harlo-line" />
          </div>
          <div className="space-y-4 p-5">
            <div className="h-20 w-3/4 animate-pulse rounded-lg bg-harlo-line" />
            <div className="ml-auto h-16 w-2/3 animate-pulse rounded-lg bg-harlo-ink/20" />
            <div className="h-24 w-4/5 animate-pulse rounded-lg bg-harlo-line" />
          </div>
        </div>
      </div>
    </div>
  );
}
