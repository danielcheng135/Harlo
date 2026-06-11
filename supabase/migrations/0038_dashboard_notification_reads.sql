alter table memberships
  add column if not exists conversations_last_viewed_at timestamptz not null default now(),
  add column if not exists leads_last_viewed_at timestamptz not null default now();

create index if not exists conversations_organization_created_at_idx
  on conversations (organization_id, created_at desc);

create index if not exists leads_organization_created_at_idx
  on leads (organization_id, created_at desc);
