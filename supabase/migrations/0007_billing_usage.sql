create table if not exists organization_billing (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  plan_key text not null default 'starter' check (plan_key in ('starter', 'growth', 'pro')),
  billing_interval text not null default 'monthly' check (billing_interval in ('monthly', 'annual')),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz not null default date_trunc('month', now()),
  current_period_end timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  cancel_at_period_end boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create table if not exists organization_add_ons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  add_on_key text not null check (add_on_key in ('auto_recharge_credits', 'extra_agent', 'extra_seat', 'remove_branding')),
  enabled boolean not null default false,
  quantity integer not null default 0 check (quantity >= 0),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, add_on_key)
);

create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  bot_id uuid references bots(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  message_id uuid references messages(id) on delete set null,
  event_type text not null check (event_type in ('assistant_message', 'auto_recharge')),
  credits integer not null check (credits > 0),
  billing_period_start timestamptz not null,
  billing_period_end timestamptz not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists organization_billing_organization_idx
  on organization_billing (organization_id);

create index if not exists organization_add_ons_organization_idx
  on organization_add_ons (organization_id);

create index if not exists usage_events_organization_period_idx
  on usage_events (organization_id, billing_period_start, billing_period_end);

create index if not exists usage_events_message_idx
  on usage_events (message_id);

create unique index if not exists usage_events_assistant_message_unique_idx
  on usage_events (message_id)
  where event_type = 'assistant_message' and message_id is not null;

alter table organization_billing enable row level security;
alter table organization_add_ons enable row level security;
alter table usage_events enable row level security;

create policy "members can read organization billing"
  on organization_billing for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = organization_billing.organization_id
      and memberships.user_id = auth.uid()
    )
  );

create policy "members can read organization add ons"
  on organization_add_ons for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = organization_add_ons.organization_id
      and memberships.user_id = auth.uid()
    )
  );

create policy "members can read usage events"
  on usage_events for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = usage_events.organization_id
      and memberships.user_id = auth.uid()
    )
  );

insert into organization_billing (
  organization_id,
  plan_key,
  billing_interval,
  status,
  current_period_start,
  current_period_end
)
select
  organizations.id,
  'starter',
  'monthly',
  'active',
  date_trunc('month', now()),
  date_trunc('month', now()) + interval '1 month'
from organizations
where not exists (
  select 1
  from organization_billing
  where organization_billing.organization_id = organizations.id
);

insert into usage_events (
  organization_id,
  bot_id,
  conversation_id,
  message_id,
  event_type,
  credits,
  billing_period_start,
  billing_period_end,
  created_at
)
select
  conversations.organization_id,
  conversations.bot_id,
  conversations.id,
  messages.id,
  'assistant_message',
  1,
  organization_billing.current_period_start,
  organization_billing.current_period_end,
  messages.created_at
from messages
join conversations on conversations.id = messages.conversation_id
join organization_billing on organization_billing.organization_id = conversations.organization_id
where messages.role = 'assistant'
  and messages.created_at >= organization_billing.current_period_start
  and messages.created_at < organization_billing.current_period_end
  and not exists (
    select 1
    from usage_events
    where usage_events.message_id = messages.id
    and usage_events.event_type = 'assistant_message'
  );
