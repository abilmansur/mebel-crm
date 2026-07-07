-- Выполнить в SQL Editor, если база уже существовала до этого апдейта.
-- На новых установках всё это уже включено в supabase/schema.sql.

-- Статус прочтения — нужен для правильного счётчика "новых чатов" во Входящих
alter table inbox_messages add column if not exists read boolean not null default false;

-- База знаний ИИ-ассистента — отдельно от промпта (личность/стиль), сюда идут факты:
-- цены, сроки, частые вопросы-ответы
alter table ai_config add column if not exists knowledge_base text default '';

-- Примеры фото, которые бот может отправлять по ключевым словам
create table if not exists ai_photos (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) not null,
  keywords text not null,
  image_url text not null,
  caption text default '',
  created_at timestamptz default now()
);

alter table ai_photos enable row level security;

create policy "workspace_isolation_ai_photos" on ai_photos
  for all using (workspace_id in (select id from workspaces where owner_id = auth.uid()));
