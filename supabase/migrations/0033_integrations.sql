create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  provider text not null check (provider in ('calendly', 'housecallpro', 'jobber', 'zapier', 'slack', 'hubspot')),
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  display_name text,
  credentials_encrypted text,
  config jsonb not null default '{}',
  connected_by uuid references auth.users(id) on delete set null,
  connected_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create table if not exists bot_integration_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  bot_id uuid not null references bots(id) on delete cascade,
  integration_id uuid not null references integrations(id) on delete cascade,
  trigger_type text not null check (trigger_type in ('booking_requested', 'service_request_completed', 'lead_captured', 'human_follow_up_requested', 'integration_failed')),
  action_type text not null check (action_type in ('show_booking_link', 'submit_service_request', 'send_webhook', 'send_notification', 'create_crm_contact')),
  enabled boolean not null default true,
  required_fields text[] not null default '{}',
  field_mapping jsonb not null default '{}',
  success_message text,
  fallback_message text,
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists integration_action_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  bot_id uuid references bots(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  integration_id uuid references integrations(id) on delete set null,
  provider text not null check (provider in ('calendly', 'housecallpro', 'jobber', 'zapier', 'slack', 'hubspot')),
  action_type text not null check (action_type in ('show_booking_link', 'submit_service_request', 'send_webhook', 'send_notification', 'create_crm_contact')),
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'skipped')),
  external_record_id text,
  external_url text,
  input_summary jsonb not null default '{}',
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists integrations_organization_idx
  on integrations (organization_id, provider);

create index if not exists bot_integration_actions_bot_idx
  on bot_integration_actions (organization_id, bot_id, enabled);

create index if not exists bot_integration_actions_integration_idx
  on bot_integration_actions (integration_id);

create index if not exists integration_action_runs_organization_idx
  on integration_action_runs (organization_id, created_at desc);

create index if not exists integration_action_runs_conversation_idx
  on integration_action_runs (conversation_id, created_at desc);

create index if not exists integration_action_runs_lead_idx
  on integration_action_runs (lead_id, created_at desc);

alter table integrations enable row level security;
alter table bot_integration_actions enable row level security;
alter table integration_action_runs enable row level security;

grant select, insert, update, delete on integrations to authenticated;
grant select, insert, update, delete on bot_integration_actions to authenticated;
grant select, insert, update, delete on integration_action_runs to authenticated;

drop policy if exists "members can read integrations" on integrations;
create policy "members can read integrations"
  on integrations for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = integrations.organization_id
      and memberships.user_id = auth.uid()
    )
  );

drop policy if exists "admins can manage integrations" on integrations;
create policy "admins can manage integrations"
  on integrations for all
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = integrations.organization_id
      and memberships.user_id = auth.uid()
      and memberships.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from memberships
      where memberships.organization_id = integrations.organization_id
      and memberships.user_id = auth.uid()
      and memberships.role in ('owner', 'admin')
    )
  );

drop policy if exists "members can read bot integration actions" on bot_integration_actions;
create policy "members can read bot integration actions"
  on bot_integration_actions for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = bot_integration_actions.organization_id
      and memberships.user_id = auth.uid()
    )
  );

drop policy if exists "admins can manage bot integration actions" on bot_integration_actions;
create policy "admins can manage bot integration actions"
  on bot_integration_actions for all
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = bot_integration_actions.organization_id
      and memberships.user_id = auth.uid()
      and memberships.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from memberships
      where memberships.organization_id = bot_integration_actions.organization_id
      and memberships.user_id = auth.uid()
      and memberships.role in ('owner', 'admin')
    )
  );

drop policy if exists "members can read integration action runs" on integration_action_runs;
create policy "members can read integration action runs"
  on integration_action_runs for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = integration_action_runs.organization_id
      and memberships.user_id = auth.uid()
    )
  );

drop policy if exists "admins can insert integration action runs" on integration_action_runs;
create policy "admins can insert integration action runs"
  on integration_action_runs for insert
  with check (
    exists (
      select 1 from memberships
      where memberships.organization_id = integration_action_runs.organization_id
      and memberships.user_id = auth.uid()
      and memberships.role in ('owner', 'admin')
    )
  );
