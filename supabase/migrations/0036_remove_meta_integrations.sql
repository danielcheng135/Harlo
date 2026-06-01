do $$
begin
  if to_regclass('public.integration_channels') is not null then
    delete from public.integration_channels
    where provider in ('whatsapp', 'instagram', 'messenger');
  end if;

  if to_regclass('public.integration_webhook_events') is not null then
    delete from public.integration_webhook_events
    where provider in ('whatsapp', 'instagram', 'messenger');
  end if;
end $$;

delete from bot_integration_actions
using integrations
where bot_integration_actions.integration_id = integrations.id
  and integrations.provider in ('whatsapp', 'instagram', 'messenger');

delete from integration_action_runs
where provider in ('whatsapp', 'instagram', 'messenger');

delete from integrations
where provider in ('whatsapp', 'instagram', 'messenger');

alter table integrations
  drop constraint if exists integrations_provider_check;

alter table integrations
  add constraint integrations_provider_check
  check (provider in (
    'calendly',
    'calcom',
    'jobber',
    'slack',
    'hubspot',
    'mailchimp',
    'google_sheets',
    'housecallpro',
    'zapier'
  ));

alter table integration_action_runs
  drop constraint if exists integration_action_runs_provider_check;

alter table integration_action_runs
  add constraint integration_action_runs_provider_check
  check (provider in (
    'calendly',
    'calcom',
    'jobber',
    'slack',
    'hubspot',
    'mailchimp',
    'google_sheets',
    'housecallpro',
    'zapier'
  ));
