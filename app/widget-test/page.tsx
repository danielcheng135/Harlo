import { getWorkspaceOrRedirect } from "@/lib/harlo/data";

export default async function WidgetTestPage() {
  const workspace = await getWorkspaceOrRedirect();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <main className="min-h-screen bg-[#f4f7f5] px-6 py-10 text-harlo-ink">
      <section className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold text-harlo-teal">Widget test page</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Sample business website</h1>
        <p className="mt-4 max-w-2xl text-harlo-muted">
          This page simulates a customer website with the Harlo script installed. Use the launcher in the bottom-right corner.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {["Residential cleaning", "Office cleaning", "Move-out cleaning"].map((service) => (
            <div key={service} className="rounded-lg border border-harlo-line bg-white p-5 shadow-sm">
              <h2 className="font-semibold">{service}</h2>
              <p className="mt-2 text-sm leading-6 text-harlo-muted">Ask the widget about pricing, availability, or quote requirements.</p>
            </div>
          ))}
        </div>
      </section>
      <script src={`${appUrl}/widget.js`} data-harlo-bot={workspace.bot.id} async />
    </main>
  );
}
