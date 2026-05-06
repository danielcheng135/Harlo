import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const signUpHref = next ? `/auth/sign-up?next=${encodeURIComponent(next)}` : "/auth/sign-up";
  return (
    <div className="mt-10">
      <h1 className="text-3xl font-semibold tracking-tight text-harlo-ink">Welcome back</h1>
      <p className="mt-2 text-harlo-muted">Sign in to manage your Harlo chatbot.</p>
      <div className="mt-8 rounded-lg border border-harlo-line bg-white p-6 shadow-sm">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-harlo-canvas" />}>
          <AuthForm mode="sign-in" />
        </Suspense>
      </div>
      <p className="mt-6 text-sm text-harlo-muted">
        New to Harlo?{" "}
        <Link href={signUpHref as Route} className="font-semibold text-harlo-teal">
          Create an account
        </Link>
      </p>
    </div>
  );
}
