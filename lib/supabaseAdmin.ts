import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ВАЖНО: этот клиент использует service role key, который обходит Row Level Security.
// Импортировать ТОЛЬКО в серверном коде (API routes) — никогда в 'use client' компонентах,
// иначе ключ попадёт в клиентский JS-бандл и станет публичным.
export const supabaseAdmin = url && serviceKey ? createClient(url, serviceKey) : null;
