import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { AcceptInviteButton } from "@/components/team/accept-invite-button";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type InvitePageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ accept?: string }>;
};

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  const [{ token }, { accept }] = await Promise.all([params, searchParams]);
  const shouldAutoAccept = accept === "1";
  const service = createSupabaseServiceClient();
  const { data: invitation } = await service
    .from("team_invitations")
    .select("email, role, status, expires_at, organizations(name)")
    .eq("token", token)
    .maybeSingle();

  if (!invitation || invitation.status !== "pending" || new Date(invitation.expires_at).getTime() < Date.now()) {
    return <InviteShell title="Invite unavailable" body="This invite is invalid, expired, or has already been used." />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const next = `/invite/${token}`;

    return (
      <InviteShell title={`Join ${getOrganizationName(invitation.organizations)}`} body={`You were invited as ${withArticle(invitation.role)}. Sign in or create an account with ${invitation.email} to accept.`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href={`/auth/sign-in?next=${encodeURIComponent(next)}`} className="inline-flex h-10 items-center justify-center rounded-lg bg-harlo-ink px-4 text-sm font-semibold text-white transition hover:bg-harlo-navy">Sign in</Link>
          <Link href={`/auth/sign-up?next=${encodeURIComponent(next)}`} className="inline-flex h-10 items-center justify-center rounded-lg border border-harlo-line bg-white px-4 text-sm font-semibold text-harlo-ink transition hover:border-harlo-teal">Create account</Link>
        </div>
      </InviteShell>
    );
  }

  if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return <InviteShell title="Wrong account" body={`This invite was sent to ${invitation.email}. Sign in with that email to accept it.`} />;
  }

  return (
    <InviteShell
      title={`Join ${getOrganizationName(invitation.organizations)}`}
      body={shouldAutoAccept ? "Your email is confirmed. Harlo will add you to this workspace now." : `Accept this invite to join as ${withArticle(invitation.role)}.`}
    >
      <AcceptInviteButton autoAccept={shouldAutoAccept} token={token} />
    </InviteShell>
  );
}

function InviteShell({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-harlo-canvas px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-harlo-line bg-white p-6 shadow-sm">
        <BrandLogo />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-harlo-ink">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-harlo-muted">{body}</p>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </main>
  );
}

function getOrganizationName(value: unknown) {
  const organization = Array.isArray(value) ? value[0] : value;

  return organization && typeof organization === "object" && "name" in organization && typeof organization.name === "string"
    ? organization.name
    : "this workspace";
}

function withArticle(role: string) {
  return role === "admin" ? "an admin" : "a member";
}
