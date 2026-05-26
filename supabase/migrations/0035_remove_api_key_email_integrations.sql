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
    'whatsapp',
    'instagram',
    'messenger',
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
    'whatsapp',
    'instagram',
    'messenger',
    'housecallpro',
    'zapier'
  ));
