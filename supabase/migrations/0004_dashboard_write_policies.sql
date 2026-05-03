create policy "members can insert conversations"
  on conversations for insert
  with check (
    exists (
      select 1 from memberships
      where memberships.organization_id = conversations.organization_id
      and memberships.user_id = auth.uid()
    )
  );

create policy "members can insert messages"
  on messages for insert
  with check (
    exists (
      select 1
      from conversations
      join memberships on memberships.organization_id = conversations.organization_id
      where conversations.id = messages.conversation_id
      and memberships.user_id = auth.uid()
    )
  );

create policy "members can insert knowledge sources"
  on knowledge_sources for insert
  with check (
    exists (
      select 1 from memberships
      where memberships.organization_id = knowledge_sources.organization_id
      and memberships.user_id = auth.uid()
    )
  );

create policy "members can insert knowledge chunks"
  on knowledge_chunks for insert
  with check (
    exists (
      select 1 from memberships
      where memberships.organization_id = knowledge_chunks.organization_id
      and memberships.user_id = auth.uid()
    )
  );
