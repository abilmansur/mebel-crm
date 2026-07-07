-- Связывает конкретный Telegram-чат (клиента) с цехом (workspace).
-- Заполняется автоматически ботом при переходе клиента по диплинку
-- вида https://t.me/<бот>?start=<workspace_id> — см. app/api/telegram-webhook/route.ts

create table if not exists telegram_chats (
  chat_id bigint primary key,
  workspace_id uuid references workspaces(id) not null,
  client_name text,
  created_at timestamptz default now()
);

alter table telegram_chats enable row level security;

create policy "workspace_isolation_telegram_chats" on telegram_chats
  for all using (workspace_id in (select id from workspaces where owner_id = auth.uid()));
