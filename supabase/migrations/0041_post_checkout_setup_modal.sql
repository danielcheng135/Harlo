alter table memberships
  add column if not exists post_checkout_setup_seen_at timestamptz;
