"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";
  const isInviteSignUp = mode === "sign-up" && nextPath.startsWith("/invite/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const safeNextPath = nextPath.startsWith("/") ? nextPath : "/dashboard";
      const signUpDestination = safeNextPath.startsWith("/invite/") ? withQueryParam(safeNextPath, "accept", "1") : "/onboarding";
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(signUpDestination)}`;
      const result =
        mode === "sign-up"
          ? await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo,
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

      if (mode === "sign-up" && !result.data.session) {
        setConfirmationEmail(email);
        return;
      }

      const destination = mode === "sign-up" ? signUpDestination : safeNextPath;
      router.push(destination as Route);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      setIsPending(false);
    }
  }

  if (confirmationEmail) {
    return (
      <div className="rounded-lg border border-harlo-teal/20 bg-gradient-to-br from-harlo-mist via-white to-cyan-50 p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-harlo-teal text-white shadow-sm shadow-harlo-teal/20">
            <Mail size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-harlo-ink">Check your email</h2>
            <p className="mt-1 text-sm leading-6 text-harlo-muted">
              We sent a confirmation link to <span className="font-semibold text-harlo-ink">{confirmationEmail}</span>. Open it to finish creating your Harlo account.
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-lg border border-harlo-line bg-white p-3">
          <div className="flex items-start gap-2 text-sm text-harlo-muted">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-harlo-teal" />
            <p>The link will return you to {isInviteSignUp ? "the workspace invite" : "onboarding"} after your email is confirmed.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setConfirmationEmail(null)}
          className="mt-4 text-sm font-semibold text-harlo-teal"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "sign-up" && !isInviteSignUp ? (
        <label className="block">
          <span className="text-sm font-medium text-harlo-ink">Business name</span>
          <input
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            required={!isInviteSignUp}
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

function withQueryParam(path: string, key: string, value: string) {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set(key, value);

  return `${pathname}?${params.toString()}`;
}
