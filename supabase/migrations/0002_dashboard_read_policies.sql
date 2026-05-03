create policy "members can read widget themes"
  on widget_themes for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = widget_themes.organization_id
      and memberships.user_id = auth.uid()
    )
  );

create policy "members can read knowledge sources"
  on knowledge_sources for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = knowledge_sources.organization_id
      and memberships.user_id = auth.uid()
    )
  );

create policy "members can read knowledge chunks"
  on knowledge_chunks for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = knowledge_chunks.organization_id
      and memberships.user_id = auth.uid()
    )
  );

create policy "members can read conversations"
  on conversations for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = conversations.organization_id
      and memberships.user_id = auth.uid()
    )
  );

create policy "members can read messages"
  on messages for select
  using (
    exists (
      select 1
      from conversations
      join memberships on memberships.organization_id = conversations.organization_id
      where conversations.id = messages.conversation_id
      and memberships.user_id = auth.uid()
    )
  );

create policy "members can read leads"
  on leads for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = leads.organization_id
      and memberships.user_id = auth.uid()
    )
  );
