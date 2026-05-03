create extension if not exists vector;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists bots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  greeting text not null,
  fallback_message text not null,
  allowed_domains text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists widget_themes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  bot_id uuid not null references bots(id) on delete cascade,
  accent text not null default '#1f9d8a',
  launcher_position text not null default 'bottom-right',
  title text not null default 'Ask Harlo',
  welcome_prompts text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bot_id)
);

create table if not exists knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  bot_id uuid not null references bots(id) on delete cascade,
  name text not null,
  source_type text not null check (source_type in ('url', 'file', 'manual')),
  status text not null default 'pending',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  bot_id uuid not null references bots(id) on delete cascade,
  source_id uuid not null references knowledge_sources(id) on delete cascade,
  content text not null,
  metadata jsonb not null default '{}',
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  bot_id uuid not null references bots(id) on delete cascade,
  visitor_id text,
  page_url text,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  bot_id uuid not null references bots(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  name text not null,
  email text not null,
  question text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists knowledge_chunks_embedding_hnsw
  on knowledge_chunks using hnsw (embedding vector_cosine_ops);

alter table organizations enable row level security;
alter table memberships enable row level security;
alter table bots enable row level security;
alter table widget_themes enable row level security;
alter table knowledge_sources enable row level security;
alter table knowledge_chunks enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table leads enable row level security;

create policy "members can read organizations"
  on organizations for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = organizations.id
      and memberships.user_id = auth.uid()
    )
  );

create policy "members can read memberships"
  on memberships for select
  using (user_id = auth.uid());

create policy "members can read bots"
  on bots for select
  using (
    exists (
      select 1 from memberships
      where memberships.organization_id = bots.organization_id
      and memberships.user_id = auth.uid()
    )
  );
