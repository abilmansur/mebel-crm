-- Мультитенантность через Supabase Auth: каждый владелец цеха регистрируется,
-- ему автоматически создаётся свой workspace, и RLS не даёт видеть чужие данные.

create extension if not exists "pgcrypto";

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) not null,
  balance numeric not null default 0,             -- баланс в тенге, списывается за каждый ответ ИИ
  created_at timestamptz default now()
);

create table materials (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) not null,
  name text not null,
  price_per_sqm numeric not null,
  edge_per_m numeric not null default 0,
  markup_percent numeric not null default 30
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) not null,
  full_name text not null,
  phone text,
  telegram_username text,
  created_at timestamptz default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) not null,
  client_name text not null,
  phone text default '',
  address text default '',                      -- адрес для замера и доставки
  title text,
  width_mm numeric not null,
  height_mm numeric not null,
  material_id uuid references materials(id),
  extras jsonb not null default '[]'::jsonb,   -- доп. фурнитура: [{"name": "Петли", "price": 4500, "quantity": 12}, ...]
  comment text default '',                      -- свободный комментарий по заказу
  price numeric not null,
  status text not null default 'new',           -- new -> measuring -> approved -> production -> delivery -> done
  overdue boolean default false,
  measurement_date date,                        -- ставится на этапе "Заявка"/"Замеры"
  delivery_date date,                           -- редактируется начиная с этапа "Производство"
  outcome text check (outcome in ('success', 'failed')),  -- заполняется только когда status = 'done'
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table order_status_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  old_status text,
  new_status text,
  changed_at timestamptz default now()
);

-- Единый инбокс: сюда пишут вебхуки WhatsApp/Telegram/формы сайта
create table inbox_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) not null,
  channel text not null check (channel in ('whatsapp', 'telegram', 'phone', 'site')),
  chat_id bigint,                                -- id чата в канале (Telegram), для threading и ответа
  direction text not null default 'in' check (direction in ('in', 'out')),
  read boolean not null default false,           -- для счётчика непрочитанных чатов во Входящих
  client_name text not null,
  text text not null,
  ai_suggestion text,
  created_at timestamptz default now()
);

-- Настройки ИИ-ассистента, по одному на цех
create table ai_config (
  workspace_id uuid primary key references workspaces(id),
  bot_name text default '',
  description text default '',
  prompt text default '',
  knowledge_base text default '',                -- факты: цены, сроки, частые вопросы-ответы
  provider text not null default 'anthropic' check (provider in ('anthropic', 'openai')),
  reply_delay_seconds integer not null default 0,   -- пауза перед ответом, сек
  typing_simulation boolean not null default false, -- показывать "печатает..." перед ответом
  split_long_messages boolean not null default false, -- делить длинный ответ на несколько сообщений
  auto_reply boolean not null default false,
  updated_at timestamptz default now()
);

-- Лог расхода ИИ — сколько токенов и денег ушло на каждый ответ
create table ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) not null,
  provider text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_kzt numeric not null default 0,
  created_at timestamptz default now()
);

-- Пополнения баланса через CloudPayments
create table balance_topups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) not null,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  provider text default 'cloudpayments',
  external_id text,
  created_at timestamptz default now()
);

-- Примеры фото, которые бот может отправлять по ключевым словам
create table ai_photos (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) not null,
  keywords text not null,
  image_url text not null,
  caption text default '',
  created_at timestamptz default now()
);

-- Каждый цех подключает своего Telegram-бота своим токеном (полученным у @BotFather)
create table telegram_bots (
  workspace_id uuid primary key references workspaces(id),
  bot_token text not null,
  bot_username text,
  webhook_secret text not null,
  connected_at timestamptz default now()
);

-- RLS: пользователь видит только workspace, где он owner
alter table workspaces enable row level security;
alter table clients enable row level security;
alter table orders enable row level security;
alter table materials enable row level security;
alter table inbox_messages enable row level security;
alter table telegram_bots enable row level security;
alter table ai_config enable row level security;
alter table ai_photos enable row level security;
alter table ai_usage_log enable row level security;
alter table balance_topups enable row level security;

create policy "own_workspace" on workspaces
  for all using (owner_id = auth.uid());

create policy "workspace_isolation_orders" on orders
  for all using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "workspace_isolation_clients" on clients
  for all using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "workspace_isolation_materials" on materials
  for all using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "workspace_isolation_inbox" on inbox_messages
  for all using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "workspace_isolation_telegram_bots" on telegram_bots
  for all using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "workspace_isolation_ai_config" on ai_config
  for all using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "workspace_isolation_ai_photos" on ai_photos
  for all using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "workspace_isolation_ai_usage_log" on ai_usage_log
  for all using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "workspace_isolation_balance_topups" on balance_topups
  for all using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- Ничего вручную вставлять не нужно: workspace и стартовые материалы
-- создаются автоматически в момент первого входа пользователя (см. lib/workspace.ts)
