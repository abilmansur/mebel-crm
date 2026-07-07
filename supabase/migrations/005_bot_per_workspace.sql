-- Выполнить в SQL Editor, если база уже существовала до этого апдейта.
-- На новых установках это уже включено в supabase/schema.sql.

-- Каждый цех подключает СВОЕГО бота своим токеном (вместо общего бота с диплинками).
create table if not exists telegram_bots (
  workspace_id uuid primary key references workspaces(id),
  bot_token text not null,
  bot_username text,
  webhook_secret text not null,
  connected_at timestamptz default now()
);

alter table telegram_bots enable row level security;

create policy "workspace_isolation_telegram_bots" on telegram_bots
  for all using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- Старая таблица telegram_chats (модель "общий бот + диплинки") больше не используется
-- в актуальном коде. Можно оставить как есть — она не мешает.
