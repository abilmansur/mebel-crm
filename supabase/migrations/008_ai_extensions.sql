-- Выполнить в SQL Editor, если база уже существовала до этого апдейта.
-- На новых установках всё это уже включено в supabase/schema.sql.

alter table ai_config add column if not exists reply_delay_seconds integer not null default 0;
alter table ai_config add column if not exists typing_simulation boolean not null default false;
alter table ai_config add column if not exists split_long_messages boolean not null default false;
