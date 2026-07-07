-- Выполнить в SQL Editor, если база уже существовала до этого апдейта.
-- На новых установках всё это уже включено в supabase/schema.sql.

-- Настройки ИИ-ассистента, по одному на цех
create table if not exists ai_config (
  workspace_id uuid primary key references workspaces(id),
  bot_name text default '',
  description text default '',
  prompt text default '',
  auto_reply boolean not null default false,
  updated_at timestamptz default now()
);

alter table ai_config enable row level security;

create policy "workspace_isolation_ai_config" on ai_config
  for all using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- Threading: привязка сообщения к конкретному чату (Telegram chat_id) и направление (входящее/исходящее),
-- чтобы можно было показывать полную переписку и отвечать клиенту прямо из CRM
alter table inbox_messages add column if not exists chat_id bigint;
alter table inbox_messages add column if not exists direction text not null default 'in' check (direction in ('in', 'out'));
