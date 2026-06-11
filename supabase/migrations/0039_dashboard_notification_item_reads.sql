create table if not exists dashboard_notification_item_reads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  section text not null check (section in ('conversations', 'leads')),
  item_id uuid not null,
  read_at timestamptz not null default now(),
  unique (user_id, section, item_id)
);

create index if not exists dashboard_notification_item_reads_lookup_idx
  on dashboard_notification_item_reads (user_id, organization_id, section, item_id);

alter table dashboard_notification_item_reads enable row level security;

create policy "users can read their notification item reads"
  on dashboard_notification_item_reads for select
  using (user_id = (select auth.uid()));
