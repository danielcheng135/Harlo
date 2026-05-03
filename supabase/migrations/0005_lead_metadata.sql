alter table leads
  add column if not exists metadata jsonb not null default '{}';
