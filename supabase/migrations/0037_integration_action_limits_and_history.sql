alter table public.integration_action_runs
  add column if not exists action_key text,
  add column if not exists trigger_type text,
  add column if not exists result_message text,
  add column if not exists result_metadata jsonb not null default '{}',
  add column if not exists duration_ms integer,
  add column if not exists completed_at timestamptz,
  add column if not exists reason text;

alter table public.integration_action_runs
  drop constraint if exists integration_action_runs_duration_ms_check;

alter table public.integration_action_runs
  add constraint integration_action_runs_duration_ms_check
  check (duration_ms is null or duration_ms >= 0);

create index if not exists integration_action_runs_conversation_limit_idx
  on public.integration_action_runs (conversation_id, status)
  where conversation_id is not null
    and status in ('pending', 'success', 'failed');

create or replace function public.reserve_integration_action_run(
  p_organization_id uuid,
  p_bot_id uuid,
  p_conversation_id uuid,
  p_lead_id uuid,
  p_integration_id uuid,
  p_provider text,
  p_action_type text,
  p_action_key text,
  p_trigger_type text,
  p_input_summary jsonb,
  p_action_limit integer
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  reserved_run_id uuid;
begin
  if coalesce(p_action_limit, 0) <= 0 then
    return null;
  end if;

  if p_conversation_id is not null then
    perform pg_advisory_xact_lock(hashtextextended(p_conversation_id::text, 0));

    if (
      select count(*)
      from public.integration_action_runs
      where conversation_id = p_conversation_id
        and status in ('pending', 'success', 'failed')
    ) >= p_action_limit then
      return null;
    end if;
  end if;

  insert into public.integration_action_runs (
    organization_id,
    bot_id,
    conversation_id,
    lead_id,
    integration_id,
    provider,
    action_type,
    action_key,
    trigger_type,
    status,
    input_summary
  )
  values (
    p_organization_id,
    p_bot_id,
    p_conversation_id,
    p_lead_id,
    p_integration_id,
    p_provider,
    p_action_type,
    p_action_key,
    p_trigger_type,
    'pending',
    coalesce(p_input_summary, '{}'::jsonb)
  )
  returning id into reserved_run_id;

  return reserved_run_id;
end;
$$;

revoke all on function public.reserve_integration_action_run(
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  jsonb,
  integer
) from public, anon, authenticated;

grant execute on function public.reserve_integration_action_run(
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  jsonb,
  integer
) to service_role;
