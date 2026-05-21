alter table public.widget_routes
  add column if not exists behavior text not null default 'include';

alter table public.widget_routes
  drop constraint if exists widget_routes_behavior_check;

alter table public.widget_routes
  add constraint widget_routes_behavior_check check (behavior in ('include', 'exclude'));

drop index if exists widget_routes_bot_pattern_idx;

create unique index if not exists widget_routes_bot_pattern_behavior_idx
  on public.widget_routes (bot_id, pattern, behavior);
