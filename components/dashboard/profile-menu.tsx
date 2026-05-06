"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Building2, ChevronsUpDown, CreditCard, LogOut, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProfileMenuProps = {
  businessName: string;
  canManageBilling: boolean;
  email: string | null;
  hasHigherTier: boolean;
  initials: string;
  role: string;
};

export function ProfileMenu({ businessName, canManageBilling, email, hasHigherTier, initials, role }: ProfileMenuProps) {
  const router = useRouter();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  async function signOut() {
    setIsSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
    router.refresh();
  }

  return (
    <div className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenu} onFocus={openMenu} onBlur={closeMenu}>
      <div
        className="group w-full rounded-lg border border-harlo-line bg-white p-3 text-left text-sm font-semibold text-harlo-ink shadow-sm transition hover:-translate-y-0.5 hover:border-harlo-teal/60 hover:shadow-md focus-within:ring-2 focus-within:ring-harlo-teal focus-within:ring-offset-2"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-harlo-ink text-xs text-white">{initials}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate">{email ?? "Account"}</span>
            <span className="block text-xs font-medium capitalize text-harlo-muted">{role}</span>
          </span>
          <ChevronsUpDown size={16} className={`shrink-0 text-harlo-muted transition group-hover:text-harlo-teal ${isOpen ? "text-harlo-teal" : ""}`} />
        </div>
        {canManageBilling && hasHigherTier ? (
          <Link
            href="/dashboard/billing#plans"
            className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-gradient-to-r from-harlo-mist to-cyan-50 px-2.5 py-2 text-xs text-harlo-teal transition hover:from-harlo-teal hover:to-cyan-500 hover:text-white"
          >
            <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold">
              <Sparkles size={13} />
              Upgrade available
            </span>
            <ArrowUpRight size={13} />
          </Link>
        ) : null}
      </div>

      {isMounted ? (
        <div className="absolute bottom-0 left-full z-50 w-72 pl-3">
          <div
            className={`origin-bottom-left rounded-xl border border-harlo-line bg-white p-2 shadow-2xl shadow-slate-900/18 ring-1 ring-white transition-transform duration-200 ease-out ${
              isOpen ? "translate-x-0 scale-100" : "-translate-x-2 scale-95 pointer-events-none"
            }`}
            style={{ backgroundColor: "#ffffff", opacity: 1 }}
          >
            <div className={`transition-opacity duration-200 ease-out ${isOpen ? "opacity-100" : "opacity-0"}`}>
              <div className="rounded-lg bg-harlo-canvas p-3">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-harlo-teal text-white">
                  <Building2 size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-harlo-ink">{businessName}</p>
                  <p className="mt-1 truncate text-xs text-harlo-muted">{email ?? "Account"}</p>
                  <p className="mt-1 text-xs font-medium capitalize text-harlo-muted">{role}</p>
                </div>
              </div>
            </div>

              <div className="mt-2 space-y-1">
                {canManageBilling ? (
                  <Link
                    href="/dashboard/billing"
                    onClick={closeMenu}
                    className="flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-harlo-muted transition hover:bg-harlo-mist hover:text-harlo-ink"
                  >
                    <CreditCard size={15} />
                    Billing
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={signOut}
                  disabled={isSigningOut}
                  className="flex h-10 w-full items-center gap-2 rounded-lg px-2 text-sm font-semibold text-harlo-muted transition hover:bg-harlo-mist hover:text-harlo-ink disabled:opacity-60"
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
