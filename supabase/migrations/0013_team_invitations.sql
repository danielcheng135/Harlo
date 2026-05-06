create table if not exists team_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  token text not null unique default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_invitations_organization_idx
  on team_invitations (organization_id, status, created_at desc);

create unique index if not exists team_invitations_pending_email_idx
  on team_invitations (organization_id, lower(email))
  where status = 'pending';

alter table team_invitations enable row level security;

drop policy if exists "members can read team invitations" on team_invitations;
create policy "members can read team invitations"
  on team_invitations for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = team_invitations.organization_id
      and memberships.user_id = auth.uid()
    )
  );
