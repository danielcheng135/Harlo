alter table public.conversations
  add column if not exists review_status text not null default 'resolved'
  check (review_status in ('resolved', 'needs_review'));

update public.conversations
set review_status = 'needs_review'
where exists (
  select 1
  from public.messages
  where messages.conversation_id = conversations.id
    and messages.metadata ->> 'fallback' = 'true'
);

create index if not exists conversations_review_status_idx
  on public.conversations (organization_id, review_status, created_at desc);
