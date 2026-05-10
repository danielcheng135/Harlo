alter table organizations
  add column if not exists website_url text,
  add column if not exists brand_logo_url text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;
