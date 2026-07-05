-- Мультитенантность через Supabase Auth: каждый владелец цеха регистрируется,
-- ему автоматически создаётся свой workspace, и RLS не даёт видеть чужие данные.

create extension if not exists "pgcrypto";

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) not null,
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
  client_name text not null,
  text text not null,
  ai_suggestion text,
  created_at timestamptz default now()
);

-- RLS: пользователь видит только workspace, где он owner
alter table workspaces enable row level security;
alter table clients enable row level security;
alter table orders enable row level security;
alter table materials enable row level security;
alter table inbox_messages enable row level security;

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

-- Ничего вручную вставлять не нужно: workspace и стартовые материалы
-- создаются автоматически в момент первого входа пользователя (см. lib/workspace.ts)
