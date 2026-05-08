import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-harlo-canvas lg:grid-cols-[1fr_0.9fr]">
      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex">
            <BrandLogo />
          </Link>
          {children}
        </div>
      </section>
      <aside className="hidden border-l border-harlo-line bg-white p-10 lg:block">
        <div className="flex h-full flex-col justify-between rounded-lg bg-harlo-ink p-8 text-white">
          <div>
            <p className="text-sm font-medium text-teal-100">Harlo setup</p>
            <h2 className="mt-4 max-w-md text-4xl font-semibold tracking-tight">
              Train a chatbot on business knowledge and launch it with one snippet.
            </h2>
          </div>
          <div className="grid gap-3 text-sm text-teal-50">
            <p className="rounded-lg bg-white/10 p-4">Website and file knowledge ingestion</p>
            <p className="rounded-lg bg-white/10 p-4">Customizable popup widget</p>
            <p className="rounded-lg bg-white/10 p-4">Lead capture when the AI needs help</p>
          </div>
        </div>
      </aside>
    </main>
  );
}
