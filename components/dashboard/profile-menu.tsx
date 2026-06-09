"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Building2, ChevronsUpDown, CreditCard, LogOut, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProfileMenuProps = {
  brandLogoUrl: string | null;
  businessName: string;
  canManageBilling: boolean;
  email: string | null;
  hasHigherTier: boolean;
  initials: string;
  role: string;
  variant?: "sidebar" | "mobile";
};

export function ProfileMenu({ brandLogoUrl, businessName, canManageBilling, email, hasHigherTier, initials, role, variant = "sidebar" }: ProfileMenuProps) {
  const router = useRouter();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isMobile = variant === "mobile";

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  function openMenu() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsMounted(true);
    requestAnimationFrame(() => setIsOpen(true));
  }

  function closeMenu() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(false);
    closeTimerRef.current = setTimeout(() => {
      setIsMounted(false);
      closeTimerRef.current = null;
    }, 180);
  }

  function toggleMenu() {
    if (isOpen) {
      closeMenu();
      return;
    }

    openMenu();
  }

  async function signOut() {
    setIsSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
    router.refresh();
  }

  return (
    <div
      className="relative"
      onMouseEnter={isMobile ? undefined : openMenu}
      onMouseLeave={isMobile ? undefined : closeMenu}
      onFocus={isMobile ? undefined : openMenu}
      onBlur={isMobile ? undefined : closeMenu}
    >
      {isMobile ? (
        <button
          type="button"
          onClick={toggleMenu}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-harlo-line bg-white text-xs font-semibold text-harlo-ink shadow-sm transition hover:border-harlo-teal/60"
          aria-expanded={isOpen}
          aria-label="Open account menu"
        >
          {initials}
        </button>
      ) : (
        <div
          className="group w-full rounded-lg border border-white/10 bg-white/[0.055] p-3 text-left text-sm font-semibold text-white shadow-sm shadow-slate-950/15 backdrop-blur transition hover:-translate-y-0.5 hover:border-teal-200/35 hover:bg-white/[0.085] hover:shadow-md focus-within:ring-2 focus-within:ring-teal-200/60 focus-within:ring-offset-2 focus-within:ring-offset-[#021b22]"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-900/50 text-xs text-white ring-1 ring-white/10">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate">{email ?? "Account"}</span>
              <span className="block truncate text-xs font-medium capitalize text-white/60">{role}</span>
            </span>
            <ChevronsUpDown size={16} className={`shrink-0 text-white/50 transition group-hover:text-teal-200 ${isOpen ? "text-teal-200" : ""}`} />
          </div>
          {canManageBilling && hasHigherTier ? (
            <Link
              href="/dashboard/billing#plans"
              className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-teal-300/10 px-2.5 py-2 text-xs text-teal-100 transition hover:bg-teal-300/20 hover:text-white"
            >
              <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold">
                <Sparkles size={13} />
                Upgrade available
              </span>
              <ArrowUpRight size={13} />
            </Link>
          ) : null}
        </div>
      )}

      {isMounted ? (
        <div className={isMobile ? "absolute right-0 top-full z-[100] mt-2 w-[min(18rem,calc(100vw-2rem))]" : "absolute bottom-0 left-full z-[100] w-72 pl-3"}>
          <div
            className={`rounded-xl border p-2 shadow-2xl transition-transform duration-200 ease-out ${
              isMobile
                ? "border-harlo-line bg-white shadow-slate-900/18 ring-1 ring-white"
                : "border-white/10 bg-[#032832] text-white shadow-slate-950/25 ring-1 ring-white/10"
            } ${
              isOpen ? "translate-x-0 scale-100" : `${isMobile ? "translate-y-1" : "-translate-x-2"} scale-95 pointer-events-none`
            }`}
          >
            <div className={`transition-opacity duration-200 ease-out ${isOpen ? "opacity-100" : "opacity-0"}`}>
              <div className={isMobile ? "rounded-lg bg-harlo-canvas p-3" : "rounded-lg border border-white/10 bg-white/[0.055] p-3"}>
              <div className="flex items-start gap-3">
                <span className={isMobile ? "grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-harlo-mist text-harlo-teal" : "grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-900/50 text-teal-100 ring-1 ring-white/10"}>
                  {brandLogoUrl ? (
                    <img
                      src={brandLogoUrl}
                      alt=""
                      className="h-full w-full object-contain p-1.5"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Building2 size={18} />
                  )}
                </span>
                <div className="min-w-0">
                  <p className={isMobile ? "truncate text-sm font-semibold text-harlo-ink" : "truncate text-sm font-semibold text-white"}>{businessName}</p>
                  <p className={isMobile ? "mt-1 truncate text-xs text-harlo-muted" : "mt-1 truncate text-xs text-white/60"}>{email ?? "Account"}</p>
                  <p className={isMobile ? "mt-1 text-xs font-medium capitalize text-harlo-muted" : "mt-1 text-xs font-medium capitalize text-white/60"}>{role}</p>
                </div>
              </div>
            </div>

              <div className="mt-2 space-y-1">
                {canManageBilling ? (
                  <Link
                    href="/dashboard/billing"
                    onClick={closeMenu}
                    className={isMobile ? "flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-harlo-muted transition hover:bg-harlo-mist hover:text-harlo-ink" : "flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white"}
                  >
                    <CreditCard size={15} />
                    Billing
                  </Link>
                ) : null}
                {canManageBilling && hasHigherTier ? (
                  <Link
                    href="/dashboard/billing#plans"
                    onClick={closeMenu}
                    className={isMobile ? "flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-harlo-muted transition hover:bg-harlo-mist hover:text-harlo-ink" : "flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white"}
                  >
                    <Sparkles size={15} />
                    Upgrade available
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={signOut}
                  disabled={isSigningOut}
                  className={isMobile ? "flex h-10 w-full items-center gap-2 rounded-lg px-2 text-sm font-semibold text-harlo-muted transition hover:bg-harlo-mist hover:text-harlo-ink disabled:opacity-60" : "flex h-10 w-full items-center gap-2 rounded-lg px-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-60"}
                >
                  <LogOut size={15} />
                  {isSigningOut ? "Signing out..." : "Log out"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
