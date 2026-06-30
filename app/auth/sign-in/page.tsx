import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="h-[500px] w-full max-w-[500px] animate-pulse rounded-[22px] bg-white/90" />}>
      <AuthForm mode="sign-in" />
    </Suspense>
  );
}
