import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
  return (
    <div className="mt-10">
      <h1 className="text-3xl font-semibold tracking-tight text-harlo-ink">Create your workspace</h1>
      <p className="mt-2 text-harlo-muted">Start with a business account and default chatbot.</p>
      <div className="mt-8 rounded-lg border border-harlo-line bg-white p-6 shadow-sm">
        <Suspense fallback={<div className="h-80 animate-pulse rounded-lg bg-harlo-canvas" />}>
          <AuthForm mode="sign-up" />
        </Suspense>
      </div>
      <p className="mt-6 text-sm text-harlo-muted">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-semibold text-harlo-teal">
          Sign in
        </Link>
      </p>
    </div>
  );
}
