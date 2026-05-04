alter table organization_billing
  add column if not exists last_credit_limit_email_at timestamptz;
