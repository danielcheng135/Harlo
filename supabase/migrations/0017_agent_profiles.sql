alter table public.bots
  add column if not exists agent_type text not null default 'support',
  add column if not exists description text not null default 'Answers website questions and captures qualified leads.',
  add column if not exists system_instructions text not null default '',
  add column if not exists handoff_instructions text not null default '',
  add column if not exists status text not null default 'active',
  add column if not exists is_default boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

alter table public.bots
  drop constraint if exists bots_agent_type_check,
  add constraint bots_agent_type_check check (agent_type in ('support', 'sales', 'custom'));

alter table public.bots
  drop constraint if exists bots_status_check,
  add constraint bots_status_check check (status in ('active', 'archived'));

update public.bots
set is_default = true
where id in (
  select distinct on (organization_id) id
  from public.bots
  where status = 'active'
  order by organization_id, created_at asc
);

create unique index if not exists bots_one_default_per_organization
  on public.bots (organization_id)
  where is_default = true and status = 'active';

create index if not exists bots_organization_status_idx
  on public.bots (organization_id, status, created_at);
