import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="h-[640px] w-full max-w-[500px] animate-pulse rounded-lg bg-white/90" />}>
      <AuthForm mode="sign-up" />
    </Suspense>
  );
}
