"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type AcceptInviteButtonProps = {
  autoAccept?: boolean;
  token: string;
};

export function AcceptInviteButton({ autoAccept = false, token }: AcceptInviteButtonProps) {
  const router = useRouter();
  const autoAcceptStartedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(autoAccept);

  const acceptInvite = useCallback(async () => {
    setIsPending(true);
    setError(null);

    const response = await fetch("/api/team/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(payload?.error ?? "Invite could not be accepted.");
      setIsPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }, [router, token]);

  useEffect(() => {
    if (!autoAccept || autoAcceptStartedRef.current) {
      return;
    }

    autoAcceptStartedRef.current = true;
    void acceptInvite();
  }, [acceptInvite, autoAccept]);

  return (
    <div className="space-y-3">
      {autoAccept && isPending ? (
        <div className="rounded-lg border border-harlo-teal/20 bg-harlo-mist px-3 py-2 text-sm font-medium text-harlo-teal">
          Email confirmed. Adding you to the workspace...
        </div>
      ) : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <Button type="button" className="w-full" onClick={acceptInvite} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" size={16} /> : null}
        {isPending ? "Accepting invite..." : "Accept invite"}
      </Button>
    </div>
  );
}
