import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="h-[520px] w-full max-w-[500px] animate-pulse rounded-lg bg-white/90" />}>
      <AuthForm mode="sign-in" />
    </Suspense>
  );
}
