-- Выполнить в SQL Editor, если у тебя уже есть существующая база с заказами
-- (создана до появления телефона/адреса/дат/исхода).
-- Если база создаётся с нуля — просто выполни supabase/schema.sql, эта миграция уже включена туда.

alter table orders add column if not exists phone text default '';
alter table orders add column if not exists address text default '';
alter table orders add column if not exists measurement_date date;
alter table orders add column if not exists delivery_date date;
alter table orders add column if not exists outcome text check (outcome in ('success', 'failed'));

-- Фурнитура в старых заказах хранится без поля quantity — добавляем его со значением 1,
-- чтобы существующие позиции не потеряли количество после обновления кода.
update orders
set extras = (
  select jsonb_agg(
    case when elem ? 'quantity' then elem else elem || jsonb_build_object('quantity', 1) end
  )
  from jsonb_array_elements(extras) as elem
)
where extras is not null and jsonb_array_length(extras) > 0;

-- Старый статус "quote" (Расчёт) больше не существует в воронке — переносим такие заказы в "measuring" (Замеры)
update orders set status = 'measuring' where status = 'quote';
