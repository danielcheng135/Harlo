alter table organization_billing
  add column if not exists last_auto_recharge_failed_email_at timestamptz;
