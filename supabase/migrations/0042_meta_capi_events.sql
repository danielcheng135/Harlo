create table if not exists public.meta_capi_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_id text not null,
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed', 'skipped')),
  attempts integer not null default 1 check (attempts > 0),
  last_error text,
  response jsonb not null default '{}'::jsonb,
  last_attempted_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_name, event_id)
);

create index if not exists meta_capi_events_status_idx
  on public.meta_capi_events (status, updated_at);

alter table public.meta_capi_events enable row level security;
