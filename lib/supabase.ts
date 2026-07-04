import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Если переменные окружения не заданы, приложение работает в демо-режиме
// на данных из lib/demoData.ts — без Supabase, без авторизации, для быстрого показа клиенту.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured ? createClient(url as string, anonKey as string) : null;
