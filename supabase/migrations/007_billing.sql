-- Выполнить в SQL Editor, если база уже существовала до этого апдейта.
-- На новых установках всё это уже включено в supabase/schema.sql.

-- Баланс цеха в тенге — списывается за каждый ответ ИИ по факту использования токенов
alter table workspaces add column if not exists balance numeric not null default 0;

-- Какой LLM-провайдер использовать для этого цеха — выбирает сам владелец в настройках ИИ
alter table ai_config add column if not exists provider text not null default 'anthropic'
  check (provider in ('anthropic', 'openai'));

-- Лог расхода ИИ — для прозрачности и отладки списаний
create table if not exists ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) not null,
  provider text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_kzt numeric not null default 0,
  created_at timestamptz default now()
);

alter table ai_usage_log enable row level security;

create policy "workspace_isolation_ai_usage_log" on ai_usage_log
  for all using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- Пополнения баланса через CloudPayments
create table if not exists balance_topups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) not null,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  provider text default 'cloudpayments',
  external_id text,
  created_at timestamptz default now()
);

alter table balance_topups enable row level security;

create policy "workspace_isolation_balance_topups" on balance_topups
  for all using (workspace_id in (select id from workspaces where owner_id = auth.uid()));
