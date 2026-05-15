"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

export function FilterSubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [clickedPending, setClickedPending] = useState(false);
  const isPending = pending || clickedPending;

  useEffect(() => {
    setClickedPending(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!clickedPending) {
      return;
    }

    const timeout = window.setTimeout(() => setClickedPending(false), 8000);

    return () => window.clearTimeout(timeout);
  }, [clickedPending]);

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        const form = event.currentTarget.form;

        if (!form || !form.reportValidity()) {
          return;
        }

        if (form.method.toLowerCase() === "get" && isCurrentGetTarget(form)) {
          return;
        }

        setClickedPending(true);
      }}
      aria-busy={isPending}
      className={`mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-harlo-teal px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-harlo-navy focus:outline-none focus:ring-2 focus:ring-harlo-teal focus:ring-offset-2 disabled:cursor-wait disabled:opacity-75 ${
        clickedPending ? "cursor-wait opacity-75" : ""
      }`}
    >
      {isPending ? <Loader2 size={15} className="animate-spin" /> : null}
      {isPending ? pendingLabel : label}
    </button>
  );
}

function isCurrentGetTarget(form: HTMLFormElement) {
  const target = new URL(form.action || window.location.href, window.location.href);
  const params = new URLSearchParams();

  new FormData(form).forEach((value, key) => {
    if (typeof value === "string") {
      params.append(key, value);
    }
  });

  target.search = params.toString();

  return `${target.pathname}${target.search}` === `${window.location.pathname}${window.location.search}`;
}
