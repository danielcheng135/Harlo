alter table organization_billing
  add column if not exists last_low_credit_email_at timestamptz;
