import type { Metadata } from "next";
import { getWorkspaceOrRedirect } from "@/lib/harlo/data";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function WidgetTestPage({
  searchParams
}: {
  searchParams?: Promise<{ botId?: string; path?: string }>;
}) {
  const workspace = await getWorkspaceOrRedirect();
  const params = await searchParams;
  const botId = params?.botId?.trim() || null;
  const testPath = normalizeTestPath(params?.path);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const simulatedPageUrl = `${appUrl}${testPath}`;

  return (
    <main className="min-h-screen bg-[#f4f7f5] px-6 py-10 text-harlo-ink">
      <section className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold text-harlo-teal">Widget test page</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Sample business website</h1>
        <p className="mt-4 max-w-2xl text-harlo-muted">
          This page simulates a customer website with {botId ? "a pinned agent widget" : "the workspace auto-routing widget"} installed. Use it to test page routing and the launcher in the bottom-right corner.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-harlo-line bg-white px-3 py-1 text-xs font-semibold text-harlo-muted shadow-sm">
          <span className="h-2 w-2 rounded-full bg-harlo-teal" />
          Simulated page: <span className="text-harlo-ink">{testPath}</span>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {["Residential cleaning", "Office cleaning", "Move-out cleaning"].map((service) => (
            <div key={service} className="rounded-lg border border-harlo-line bg-white p-5 shadow-sm">
              <h2 className="font-semibold">{service}</h2>
              <p className="mt-2 text-sm leading-6 text-harlo-muted">Ask the widget about pricing, availability, or quote requirements.</p>
            </div>
          ))}
        </div>
      </section>
      {botId ? (
        <script src="/widget.js" data-harlo-bot={botId} data-harlo-page-url={simulatedPageUrl} async />
      ) : (
        <script src="/widget.js" data-harlo-organization={workspace.organization.id} data-harlo-page-url={simulatedPageUrl} async />
      )}
    </main>
  );
}

function normalizeTestPath(path: string | undefined) {
  const trimmed = path?.trim() || "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  return withSlash.length > 1 ? withSlash.replace(/\/+$/g, "") : "/";
}
