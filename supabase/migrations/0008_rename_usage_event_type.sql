drop index if exists usage_events_ai_response_message_unique_idx;

alter table usage_events
  drop constraint if exists usage_events_event_type_check;

update usage_events
set event_type = 'assistant_message'
where event_type = 'ai_response';

alter table usage_events
  add constraint usage_events_event_type_check
  check (event_type in ('assistant_message', 'auto_recharge'));

create unique index if not exists usage_events_assistant_message_unique_idx
  on usage_events (message_id)
  where event_type = 'assistant_message' and message_id is not null;
