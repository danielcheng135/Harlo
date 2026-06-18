"use client";

import { useCallback, useRef, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck
} from "lucide-react";
import { TurnstileField, type TurnstileFieldHandle } from "@/components/auth/turnstile-field";
import { Button } from "@/components/ui/button";
import { trackCompleteRegistration } from "@/lib/meta-pixel";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const turnstileRef = useRef<TurnstileFieldHandle | null>(null);
  const nextPath = searchParams.get("next") ?? "/dashboard";
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const captchaRequired = Boolean(turnstileSiteKey);
  const isInviteSignUp = mode === "sign-up" && nextPath.startsWith("/invite/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [oauthPending, setOauthPending] = useState(false);
  const resetTurnstile = useCallback(() => {
    setCaptchaToken(null);
    turnstileRef.current?.refresh();
  }, []);
  const handleTurnstileVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);
  const handleTurnstileExpire = useCallback(() => {
    setCaptchaToken(null);
    setError("The security check expired. Complete it again to continue.");
  }, []);
  const handleTurnstileError = useCallback((code?: string) => {
    setCaptchaToken(null);
    setError(getTurnstileErrorMessage(code));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      let verifiedCaptchaToken: string | null = null;

      if (captchaRequired) {
        setCaptchaToken(null);
        turnstileRef.current?.refresh();
        verifiedCaptchaToken = (await turnstileRef.current?.execute()) ?? null;

        if (!verifiedCaptchaToken) {
          setError("The security check could not be completed. Try again.");
          return;
        }
      }

      const supabase = createSupabaseBrowserClient();
      const safeNextPath = getSafeNextPath(nextPath);
      const signUpDestination = getSignUpDestination(safeNextPath);
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(signUpDestination)}`;
      const result =
        mode === "sign-up"
          ? await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo,
              captchaToken: verifiedCaptchaToken ?? undefined,
              data: {
                business_name: businessName
              }
            }
          })
          : await supabase.auth.signInWithPassword({
            email,
            password,
            options: {
              captchaToken: verifiedCaptchaToken ?? undefined
            }
          });

      if (result.error) {
        setError(result.error.message);
        resetTurnstile();
        return;
      }

      if (mode === "sign-up" && !result.data.session) {
        trackCompleteRegistration({
          method: "email"
        });
        setConfirmationEmail(email);
        return;
      }

      if (mode === "sign-up") {
        trackCompleteRegistration({
          method: "email"
        });
      }

      const destination = mode === "sign-up" ? signUpDestination : safeNextPath;
      router.push(destination as Route);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
      resetTurnstile();
    } finally {
      setIsPending(false);
    }
  }

  async function handleGoogleAuth() {
    setOauthPending(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const safeNextPath = getSafeNextPath(nextPath);
      const destination = mode === "sign-up" ? withMetaRegistrationEvent(getSignUpDestination(safeNextPath)) : safeNextPath;
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo
        }
      });

      if (oauthError) {
        setError(oauthError.message);
        setOauthPending(false);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
      setOauthPending(false);
    }
  }

  if (confirmationEmail) {
    return (
      <div className="w-full max-w-[560px] rounded-lg border border-white/80 bg-white p-6 shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:p-8">
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

  const signInHref = nextPath ? `/auth/sign-in?next=${encodeURIComponent(nextPath)}` : "/auth/sign-in";
  const signUpHref = nextPath ? `/auth/sign-up?next=${encodeURIComponent(nextPath)}` : "/auth/sign-up";
  const isSignUp = mode === "sign-up";

  return (
    <div className="w-full max-w-[560px] overflow-hidden rounded-lg border border-white/80 bg-white text-harlo-ink shadow-[0_28px_90px_rgba(0,0,0,0.22)] lg:max-w-[500px]">
      <div className="px-6 pb-7 pt-6 sm:px-10 sm:pb-10 sm:pt-9 lg:px-7 lg:pb-6 lg:pt-6">
        <div className="grid grid-cols-2 border-b border-harlo-line text-center text-sm font-semibold">
          <Link
            href={signUpHref as Route}
            className={`border-b-2 px-4 pb-4 transition ${isSignUp ? "border-harlo-teal text-harlo-teal" : "border-transparent text-harlo-muted hover:text-harlo-ink"}`}
          >
            Create account
          </Link>
          <Link
            href={signInHref as Route}
            className={`border-b-2 px-4 pb-4 transition ${!isSignUp ? "border-harlo-teal text-harlo-teal" : "border-transparent text-harlo-muted hover:text-harlo-ink"}`}
          >
            Sign in
          </Link>
        </div>

        <div className="mt-8 lg:mt-7">
          <h1 className="text-2xl font-semibold tracking-tight text-harlo-ink sm:text-3xl lg:text-[1.7rem]">
            {isSignUp ? "Create your Harlo account" : "Welcome back to Harlo"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-harlo-muted sm:text-base lg:text-sm lg:leading-5">
            {isSignUp
              ? isInviteSignUp
                ? "Use the email address your invite was sent to. Harlo will add you to the workspace after confirmation."
                : "Start your free trial and let Harlo handle your first conversation."
              : "Sign in to manage conversations, leads, and your website assistant."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 lg:mt-4 lg:space-y-3">
          <AuthField label="Work email" icon={<Mail size={18} />}>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              className="h-12 w-full bg-transparent pl-11 pr-3 text-sm text-harlo-ink outline-none placeholder:text-slate-400 lg:h-10"
              placeholder="you@company.com"
            />
          </AuthField>

          <AuthField label="Password" icon={<LockKeyhole size={18} />} action={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="grid h-9 w-9 place-items-center rounded-md text-harlo-muted transition hover:bg-harlo-mist hover:text-harlo-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              type={showPassword ? "text" : "password"}
              className="h-12 w-full bg-transparent pl-11 pr-12 text-sm text-harlo-ink outline-none placeholder:text-slate-400 lg:h-10"
              placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
            />
          </AuthField>

          {isSignUp ? (
            <p className="-mt-2 text-xs text-harlo-muted">At least 8 characters with a number and a letter.</p>
          ) : null}

          {isSignUp && !isInviteSignUp ? (
            <AuthField label="Company name" icon={<Building2 size={18} />}>
              <input
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                required={!isInviteSignUp}
                className="h-12 w-full bg-transparent pl-11 pr-3 text-sm text-harlo-ink outline-none placeholder:text-slate-400 lg:h-10"
                placeholder="Acme Inc."
              />
            </AuthField>
          ) : null}

          {turnstileSiteKey ? (
            <TurnstileField
              ref={turnstileRef}
              siteKey={turnstileSiteKey}
              onVerify={handleTurnstileVerify}
              onExpire={handleTurnstileExpire}
              onError={handleTurnstileError}
            />
          ) : null}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-harlo-teal to-harlo-blue px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 lg:h-10"
          >
            <span className="grid h-5 w-5 place-items-center">
              {isPending ? <Loader2 className="animate-spin" size={16} /> : null}
            </span>
            <span className="flex-1 text-center">{isSignUp ? "Continue" : "Sign in"}</span>
            <ArrowRight size={17} className="h-5 w-5" />
          </button>
        </form>

        <div className="mt-7 flex items-center gap-4 text-xs text-harlo-muted lg:mt-5">
          <span className="h-px flex-1 bg-harlo-line" />
          or continue with
          <span className="h-px flex-1 bg-harlo-line" />
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleGoogleAuth}
          disabled={oauthPending || isPending}
          className="mt-5 h-12 w-full bg-white text-base lg:mt-3 lg:h-10 lg:text-sm"
        >
          {oauthPending ? <Loader2 className="animate-spin" size={17} /> : <GoogleIcon />}
          Continue with Google
        </Button>

        <div className="mt-6 flex items-start justify-center gap-2 text-center text-xs leading-5 text-harlo-muted lg:mt-4">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-harlo-teal" />
          <span>Your data is encrypted and secure. We never share your information.</span>
        </div>
      </div>

    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
      <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.91c1.702-1.568 2.682-3.874 2.682-6.614Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.181l-2.909-2.258c-.806.54-1.837.859-3.047.859-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.581-2.581C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" />
    </svg>
  );
}

function AuthField({ label, icon, action, children }: { label: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-harlo-ink">{label}</span>
      <span className="relative mt-2 block rounded-lg border border-harlo-line bg-white shadow-[0_1px_0_rgba(15,23,42,0.02)] focus-within:border-harlo-teal">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-harlo-muted">{icon}</span>
        {children}
        {action ? <span className="absolute right-2 top-1/2 -translate-y-1/2">{action}</span> : null}
      </span>
    </label>
  );
}

function getSafeNextPath(nextPath: string) {
  return nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
}

function getSignUpDestination(safeNextPath: string) {
  if (safeNextPath.startsWith("/invite/")) {
    return withQueryParam(safeNextPath, "accept", "1");
  }

  if (safeNextPath.startsWith("/onboarding")) {
    return safeNextPath;
  }

  return "/onboarding";
}

function withQueryParam(path: string, key: string, value: string) {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set(key, value);

  return `${pathname}?${params.toString()}`;
}

function withMetaRegistrationEvent(path: string) {
  const eventId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
  let nextPath = withQueryParam(path, "meta_event", "CompleteRegistration");
  nextPath = withQueryParam(nextPath, "meta_event_id", eventId);

  return nextPath;
}

function getTurnstileErrorMessage(code: string | undefined) {
  const suffix = code ? ` Cloudflare error: ${code}.` : "";

  return `The security check could not be completed.${suffix} Check that this Turnstile site key allows the current hostname.`;
}
