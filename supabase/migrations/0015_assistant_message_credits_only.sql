delete from credit_grant_usages
where usage_event_id in (
  select id
  from usage_events
  where event_type = 'message'
  and metadata->>'role' = 'user'
);

delete from usage_events
where event_type = 'message'
  and metadata->>'role' = 'user';

update usage_events
set
  event_type = 'assistant_message',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('role', 'assistant')
where event_type = 'message'
  and coalesce(metadata->>'role', 'assistant') = 'assistant';
