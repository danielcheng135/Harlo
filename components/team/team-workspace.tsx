"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Copy, Loader2, Mail, ShieldCheck, UserCheck, UserMinus, UserPlus, Users, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToastViewport, useToast } from "@/components/ui/toast";
import type { TeamInvitationRow, TeamMemberRow, TeamOverview } from "@/lib/harlo/data";

type TeamWorkspaceProps = {
  team: TeamOverview;
};

type InviteResult = {
  error?: string;
  inviteUrl?: string;
  emailSent?: boolean;
};

export function TeamWorkspace({ team }: TeamWorkspaceProps) {
  const router = useRouter();
  const { toast, showToast, dismissToast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const seatsReserved = team.seatCapacity.used + team.seatCapacity.pending;
  const seatsRemaining = team.seatCapacity.remaining;
  const seatPercent = getPercent(seatsReserved, team.seatCapacity.limit);

  async function inviteMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsInviting(true);
    setInviteNotice(null);

    try {
      const response = await fetch("/api/team/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role })
      });
      const payload = (await response.json().catch(() => null)) as InviteResult | null;

      if (!response.ok) {
        showToast("error", payload?.error ?? "Invite could not be created.");
        return;
      }

      if (payload?.emailSent) {
        showToast("success", "Invite email sent.");
      } else {
        const fallbackMessage = "Invite created, but the email was not sent. Copy the pending invite link from Workspace access if needed.";
        setInviteNotice(fallbackMessage);
        showToast("success", "Invite created.");
      }
      setEmail("");
      setRole("member");
      router.refresh();
    } catch {
      showToast("error", "Invite could not be created.");
    } finally {
      setIsInviting(false);
    }
  }

  async function cancelInvite(invitationId: string) {
    const actionKey = `invite:${invitationId}`;
    setPendingAction(actionKey);

    try {
      const response = await fetch(`/api/team/invitations/${invitationId}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        showToast("error", payload?.error ?? "Invite could not be canceled.");
        return;
      }

      showToast("success", "Invite canceled.");
      router.refresh();
    } catch {
      showToast("error", "Invite could not be canceled.");
    } finally {
      setPendingAction(null);
    }
  }

  async function removeMember(membershipId: string) {
    const actionKey = `member:${membershipId}`;
    setPendingAction(actionKey);

    try {
      const response = await fetch(`/api/team/members/${membershipId}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        showToast("error", payload?.error ?? "Member could not be removed.");
        return;
      }

      showToast("success", "Team member removed.");
      router.refresh();
    } catch {
      showToast("error", "Member could not be removed.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-5">
      <ToastViewport toast={toast} onDismiss={dismissToast} />

      <section className="grid gap-3 md:grid-cols-3">
        <TeamMetric icon={Users} label="Seats used" value={`${seatsReserved} / ${team.seatCapacity.limit}`} detail={`${seatsRemaining} available`} />
        <TeamMetric icon={UserCheck} label="Members" value={String(team.members.length)} detail="Active workspace users" />
        <TeamMetric icon={Mail} label="Pending" value={String(team.invitations.length)} detail="Invites awaiting acceptance" />
      </section>

      <section className="rounded-lg border border-harlo-line bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 border-b border-harlo-line lg:border-b-0 lg:border-r">
            <div className="flex flex-col gap-4 border-b border-harlo-line p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-harlo-ink">Workspace access</h2>
                <p className="mt-1 text-sm text-harlo-muted">Manage members and pending invitations in one place.</p>
              </div>
              <div className="flex items-center gap-2">
                {team.invitations.length > 0 ? <Badge>{team.invitations.length} pending</Badge> : null}
                <Badge>{team.canInviteAdmins ? "Owner access" : team.canInvite ? "Admin access" : "View only"}</Badge>
              </div>
            </div>
            <div className="max-h-[520px] divide-y divide-harlo-line overflow-y-auto">
              {team.members.map((member) => <MemberRow key={member.id} member={member} pendingAction={pendingAction} onRemove={removeMember} />)}
              {team.invitations.map((invitation) => (
                <InvitationRow
                  key={invitation.id}
                  invitation={invitation}
                  pendingAction={pendingAction}
                  onCancel={cancelInvite}
                  onCopy={async (url) => {
                    const copied = await copyText(url);
                    showToast(copied ? "success" : "error", copied ? "Invite link copied." : "Could not copy automatically. The link field is selected so you can copy it manually.");
                    return copied;
                  }}
                />
              ))}
            </div>
          </div>

          <aside className="flex flex-col bg-harlo-canvas/50 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
                <UserPlus size={18} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-harlo-ink">Invite teammate</h2>
                <p className="mt-1 text-sm leading-6 text-harlo-muted">Send a workspace invite and reserve one seat until it is accepted or canceled.</p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-harlo-line bg-white p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-harlo-muted">Seat capacity</span>
                <span className="font-semibold text-harlo-ink">{seatsReserved} / {team.seatCapacity.limit}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-harlo-line">
                <div className="h-full rounded-full bg-gradient-to-r from-harlo-teal to-cyan-500" style={{ width: `${seatPercent}%` }} />
              </div>
              <p className="mt-2 text-xs text-harlo-muted">
                {team.seatCapacity.used} active, {team.seatCapacity.pending} pending
              </p>
            </div>



            {seatsRemaining <= 0 ? (
              <TeamNotice tone="warning">
                <span>No seats are available. Add an extra seat in <Link href="/dashboard/billing#add-ons" className="font-semibold text-harlo-teal">Billing</Link> before inviting another teammate.</span>
              </TeamNotice>
            ) : null}

            {inviteNotice ? (
              <TeamNotice tone="warning">{inviteNotice}</TeamNotice>
            ) : null}

            {isInviting ? (
              <TeamNotice tone="info">Sending the invite email and reserving a seat...</TeamNotice>
            ) : null}

            <form onSubmit={inviteMember} className="mt-5 flex flex-1 flex-col space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-harlo-ink">Email</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                  disabled={!team.canInvite || seatsRemaining <= 0}
                  className="mt-2 h-10 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm text-harlo-ink outline-none transition placeholder:text-harlo-muted focus:border-harlo-teal disabled:bg-harlo-canvas disabled:text-harlo-muted"
                  placeholder="teammate@example.com"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-harlo-ink">Role</span>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as "admin" | "member")}
                  disabled={!team.canInvite || seatsRemaining <= 0}
                  className="mt-2 h-10 w-full rounded-lg border border-harlo-line bg-white px-3 text-sm text-harlo-ink outline-none transition focus:border-harlo-teal disabled:bg-harlo-canvas disabled:text-harlo-muted"
                >
                  <option value="member">Member</option>
                  {team.canInviteAdmins ? <option value="admin">Admin</option> : null}
                </select>
              </label>
              <Button type="submit" className="mt-auto w-full" disabled={!team.canInvite || seatsRemaining <= 0 || isInviting}>
                {isInviting ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
                {seatsRemaining <= 0 ? "No seats available" : "Send invite"}
              </Button>
            </form>
          </aside>
        </div>
      </section>
    </div>
  );
}

function TeamNotice({ children, tone }: { children: React.ReactNode; tone: "info" | "warning" }) {
  const classes = tone === "warning"
    ? "border-amber-200 bg-amber-50 text-amber-950"
    : "border-harlo-teal/20 bg-harlo-mist text-harlo-teal";

  return (
    <div className={`mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${classes}`}>
      <AlertCircle size={15} className="mt-0.5 shrink-0" />
      <p className="leading-5">{children}</p>
    </div>
  );
}

function TeamMetric({ icon: Icon, label, value, detail }: { icon: typeof Users; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-harlo-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-harlo-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-harlo-ink">{value}</p>
          <p className="mt-1 text-sm text-harlo-muted">{detail}</p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function MemberRow({ member, pendingAction, onRemove }: { member: TeamMemberRow; pendingAction: string | null; onRemove: (membershipId: string) => void }) {
  const isRemoving = pendingAction === `member:${member.id}`;

  return (
    <div className="flex items-center justify-between gap-3 p-4 transition hover:bg-harlo-canvas/70">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-harlo-ink text-sm font-semibold text-white">{getInitials(member.email)}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-harlo-ink">{member.email}</p>
          <p className="mt-1 text-xs text-harlo-muted">Joined {formatDate(member.joinedAt)}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {member.isCurrentUser ? <Badge>You</Badge> : null}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-harlo-line bg-white px-2.5 py-1 text-xs font-medium capitalize text-harlo-muted">
          <ShieldCheck size={13} />
          {member.role}
        </span>
        {member.canRemove ? (
          <button
            type="button"
            onClick={() => onRemove(member.id)}
            disabled={isRemoving}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-harlo-line bg-white px-2.5 text-xs font-semibold text-harlo-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
          >
            {isRemoving ? <Loader2 className="animate-spin" size={13} /> : <UserMinus size={13} />}
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}

function InvitationRow({
  invitation,
  pendingAction,
  onCancel,
  onCopy
}: {
  invitation: TeamInvitationRow;
  pendingAction: string | null;
  onCancel: (invitationId: string) => void;
  onCopy: (url: string) => Promise<boolean>;
}) {
  const linkInputRef = useRef<HTMLInputElement>(null);
  const isCanceling = pendingAction === `invite:${invitation.id}`;

  async function handleCopy() {
    const copied = await onCopy(invitation.inviteUrl);

    if (!copied) {
      linkInputRef.current?.focus();
      linkInputRef.current?.select();
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-white p-4 transition hover:bg-harlo-canvas/70">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-harlo-mist text-harlo-teal">
          <Mail size={17} />
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-semibold text-harlo-ink">{invitation.email}</p>
            <Badge className="capitalize">{invitation.role}</Badge>
          </div>
          <p className="mt-1 text-xs text-harlo-muted">Pending invite · expires {formatDate(invitation.expiresAt)}</p>
        </div>
      </div>
      <div className="flex min-w-[340px] shrink-0 items-center justify-end gap-2">
        <div className="flex h-8 w-64 overflow-hidden rounded-lg border border-harlo-line bg-harlo-canvas focus-within:border-harlo-teal">
          <input
            ref={linkInputRef}
            value={invitation.inviteUrl}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
            className="min-w-0 flex-1 bg-transparent px-2.5 text-xs text-harlo-muted outline-none focus:text-harlo-ink"
            aria-label={`Invite link for ${invitation.email}`}
          />
          <button
            type="button"
            onClick={handleCopy}
            className="grid w-9 shrink-0 place-items-center border-l border-harlo-line bg-white text-harlo-muted transition hover:bg-harlo-mist hover:text-harlo-teal"
            aria-label={`Copy invite link for ${invitation.email}`}
            title="Copy invite link"
          >
            <Copy size={13} />
          </button>
        </div>
        {invitation.canCancel ? (
          <button
            type="button"
            onClick={() => onCancel(invitation.id)}
            disabled={isCanceling}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-harlo-line bg-white px-2.5 text-xs font-semibold text-harlo-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
          >
            {isCanceling ? <Loader2 className="animate-spin" size={13} /> : <XCircle size={13} />}
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}

async function copyText(value: string) {
  try {
    await navigator.clipboard?.writeText(value);

    return true;
  } catch {
    return copyTextWithSelectionFallback(value);
  }
}

function copyTextWithSelectionFallback(value: string) {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);

    return copied;
  } catch {
    return false;
  }
}

function getPercent(used: number, limit: number) {
  return limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
}

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}
