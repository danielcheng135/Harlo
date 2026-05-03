"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OnboardingForm() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [botName, setBotName] = useState("Harlo Assistant");
  const [accent, setAccent] = useState("#087f95");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        businessName,
        websiteUrl,
        botName,
        accent
      })
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(result?.error ?? "Could not finish onboarding.");
      setIsPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium text-harlo-ink">Business name</span>
        <input
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          required
          className="mt-2 h-11 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none focus:border-harlo-teal"
          placeholder="Acme Services"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-harlo-ink">Website URL</span>
        <input
          value={websiteUrl}
          onChange={(event) => setWebsiteUrl(event.target.value)}
          required
          type="url"
          className="mt-2 h-11 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none focus:border-harlo-teal"
          placeholder="https://acmeservices.com"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-harlo-ink">Chatbot name</span>
        <input
          value={botName}
          onChange={(event) => setBotName(event.target.value)}
          required
          className="mt-2 h-11 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none focus:border-harlo-teal"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-harlo-ink">Accent color</span>
        <div className="mt-2 flex gap-3">
          <input
            value={accent}
            onChange={(event) => setAccent(event.target.value)}
            type="color"
            className="h-11 w-14 rounded-lg border border-harlo-line bg-white p-1"
            aria-label="Accent color"
          />
          <input
            value={accent}
            onChange={(event) => setAccent(event.target.value)}
            className="h-11 flex-1 rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none focus:border-harlo-teal"
          />
        </div>
      </label>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Button className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" size={16} /> : null}
        Create workspace
        <ArrowRight size={16} />
      </Button>
    </form>
  );
}
