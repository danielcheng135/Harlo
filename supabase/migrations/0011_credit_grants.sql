create table if not exists credit_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  source text not null check (source in ('auto_recharge', 'manual')),
  credits_granted integer not null check (credits_granted > 0),
  credits_used integer not null default 0 check (credits_used >= 0),
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_grants_used_not_over_granted check (credits_used <= credits_granted)
);

create table if not exists credit_grant_usages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  credit_grant_id uuid not null references credit_grants(id) on delete cascade,
  usage_event_id uuid not null references usage_events(id) on delete cascade,
  credits integer not null check (credits > 0),
  created_at timestamptz not null default now(),
  unique (credit_grant_id, usage_event_id)
);

create index if not exists credit_grants_organization_expires_idx
  on credit_grants (organization_id, expires_at);

create index if not exists credit_grant_usages_organization_created_idx
  on credit_grant_usages (organization_id, created_at);

alter table credit_grants enable row level security;
alter table credit_grant_usages enable row level security;

create policy "members can read credit grants"
  on credit_grants for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = credit_grants.organization_id
      and memberships.user_id = auth.uid()
    )
  );

create policy "members can read credit grant usages"
  on credit_grant_usages for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = credit_grant_usages.organization_id
      and memberships.user_id = auth.uid()
    )
  );

create unique index if not exists credit_grants_stripe_payment_intent_unique_idx
  on credit_grants (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
