alter table usage_events
  drop constraint if exists usage_events_event_type_check;

alter table usage_events
  add constraint usage_events_event_type_check
  check (event_type in ('message', 'assistant_message', 'auto_recharge'));

update usage_events
set
  event_type = 'message',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('role', 'assistant')
where event_type = 'assistant_message';

drop index if exists usage_events_assistant_message_unique_idx;
create unique index if not exists usage_events_message_id_unique_idx
  on usage_events (message_id);

insert into usage_events (
  organization_id,
  bot_id,
  conversation_id,
  message_id,
  event_type,
  credits,
  billing_period_start,
  billing_period_end,
  metadata,
  created_at
)
select
  conversations.organization_id,
  conversations.bot_id,
  conversations.id,
  messages.id,
  'message',
  1,
  organization_billing.current_period_start,
  organization_billing.current_period_end,
  jsonb_build_object('role', messages.role),
  messages.created_at
from messages
join conversations on conversations.id = messages.conversation_id
join organization_billing on organization_billing.organization_id = conversations.organization_id
where messages.role in ('user', 'assistant')
  and messages.created_at >= organization_billing.current_period_start
  and messages.created_at < organization_billing.current_period_end
on conflict (message_id) do nothing;
