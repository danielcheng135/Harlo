"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const result =
        mode === "sign-up"
          ? await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  business_name: businessName
                }
              }
            })
          : await supabase.auth.signInWithPassword({
              email,
              password
            });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      const destination = mode === "sign-up" ? "/onboarding" : nextPath.startsWith("/") ? nextPath : "/dashboard";
      router.push(destination as Route);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "sign-up" ? (
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
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-harlo-ink">Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          className="mt-2 h-11 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none focus:border-harlo-teal"
          placeholder="you@company.com"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-harlo-ink">Password</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          type="password"
          className="mt-2 h-11 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm outline-none focus:border-harlo-teal"
          placeholder="Minimum 8 characters"
        />
      </label>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Button className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" size={16} /> : null}
        {mode === "sign-up" ? "Create Harlo account" : "Sign in"}
        <ArrowRight size={16} />
      </Button>
    </form>
  );
}
