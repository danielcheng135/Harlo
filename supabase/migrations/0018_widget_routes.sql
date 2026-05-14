create table if not exists public.widget_routes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  pattern text not null,
  priority integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint widget_routes_pattern_length check (char_length(pattern) between 1 and 240),
  constraint widget_routes_pattern_format check (pattern = '*' or left(pattern, 1) = '/')
);

create index if not exists widget_routes_org_priority_idx
  on public.widget_routes (organization_id, priority, created_at);

create index if not exists widget_routes_bot_idx
  on public.widget_routes (bot_id);

create unique index if not exists widget_routes_bot_pattern_idx
  on public.widget_routes (bot_id, pattern);

alter table public.widget_routes enable row level security;

drop policy if exists "Members can read widget routes" on public.widget_routes;
drop policy if exists "Admins can insert widget routes" on public.widget_routes;
drop policy if exists "Admins can update widget routes" on public.widget_routes;
drop policy if exists "Admins can delete widget routes" on public.widget_routes;

create policy "Members can read widget routes"
  on public.widget_routes for select
  using (
    exists (
      select 1
      from public.memberships
      where memberships.organization_id = widget_routes.organization_id
        and memberships.user_id = auth.uid()
    )
  );

create policy "Admins can insert widget routes"
  on public.widget_routes for insert
  with check (
    exists (
      select 1
      from public.memberships
      where memberships.organization_id = widget_routes.organization_id
        and memberships.user_id = auth.uid()
        and memberships.role in ('owner', 'admin')
    )
    and exists (
      select 1
      from public.bots
      where bots.id = widget_routes.bot_id
        and bots.organization_id = widget_routes.organization_id
    )
  );

create policy "Admins can update widget routes"
  on public.widget_routes for update
  using (
    exists (
      select 1
      from public.memberships
      where memberships.organization_id = widget_routes.organization_id
        and memberships.user_id = auth.uid()
        and memberships.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.memberships
      where memberships.organization_id = widget_routes.organization_id
        and memberships.user_id = auth.uid()
        and memberships.role in ('owner', 'admin')
    )
    and exists (
      select 1
      from public.bots
      where bots.id = widget_routes.bot_id
        and bots.organization_id = widget_routes.organization_id
    )
  );

create policy "Admins can delete widget routes"
  on public.widget_routes for delete
  using (
    exists (
      select 1
      from public.memberships
      where memberships.organization_id = widget_routes.organization_id
        and memberships.user_id = auth.uid()
        and memberships.role in ('owner', 'admin')
    )
  );
