create or replace function public.match_organization_knowledge_chunks(
  query_organization_id uuid,
  query_embedding vector(1536),
  match_count int default 8,
  similarity_threshold float default 0.42
)
returns table (
  id uuid,
  bot_id uuid,
  source_id uuid,
  source_title text,
  content text,
  similarity float
)
language sql
stable
as $$
  select
    knowledge_chunks.id,
    knowledge_chunks.bot_id,
    knowledge_chunks.source_id,
    coalesce(knowledge_chunks.metadata->>'source_name', knowledge_sources.name) as source_title,
    knowledge_chunks.content,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks
  join public.knowledge_sources on knowledge_sources.id = knowledge_chunks.source_id
  where knowledge_chunks.organization_id = query_organization_id
    and knowledge_chunks.embedding is not null
    and 1 - (knowledge_chunks.embedding <=> query_embedding) >= similarity_threshold
  order by knowledge_chunks.embedding <=> query_embedding
  limit match_count;
$$;
