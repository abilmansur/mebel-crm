"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";

export default function TelegramConnect({ workspaceId }: { workspaceId: string | null }) {
  const { t } = useLanguage();
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured || !supabase || !workspaceId) {
        setLoaded(true);
        return;
      }
      const { data } = await supabase
        .from("telegram_bots")
        .select("bot_username")
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      setBotUsername(data?.bot_username || null);
      setLoaded(true);
    }
    load();
  }, [workspaceId]);

  async function handleConnect() {
    if (!supabase || !workspaceId || !tokenInput.trim()) return;
    setConnecting(true);
    setError(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    try {
      const res = await fetch("/api/telegram-connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ workspaceId, botToken: tokenInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || t("telegramConnect.error"));
      } else {
        setBotUsername(json.botUsername);
        setTokenInput("");
      }
    } catch {
      setError(t("telegramConnect.error"));
    }
    setConnecting(false);
  }

  async function handleDisconnect() {
    if (!supabase || !workspaceId) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    await fetch("/api/telegram-disconnect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || ""}`,
      },
      body: JSON.stringify({ workspaceId }),
    });
    setBotUsername(null);
  }

  if (!isSupabaseConfigured || !workspaceId) {
    return <div className="text-xs text-ink/40 bg-paper rounded-lg px-3 py-2 mb-4">{t("inbox.notConfigured")}</div>;
  }

  if (!loaded) return null;

  if (botUsername) {
    return (
      <div className="border border-line rounded-lg p-3 mb-4 flex items-center justify-between">
        <div className="text-sm">
          <span className="text-pine">✓</span> {t("telegramConnect.connected")} <b>@{botUsername}</b>
        </div>
        <button onClick={handleDisconnect} className="text-xs text-rust hover:underline shrink-0">
          {t("telegramConnect.disconnect")}
        </button>
      </div>
    );
  }

  return (
    <div className="border border-line rounded-lg p-3 mb-4">
      <div className="text-sm font-medium mb-1">{t("telegramConnect.title")}</div>
      <ol className="text-xs text-ink/50 mb-3 list-decimal list-inside space-y-0.5">
        <li>{t("telegramConnect.step1")}</li>
        <li>{t("telegramConnect.step2")}</li>
        <li>{t("telegramConnect.step3")}</li>
      </ol>
      <div className="flex gap-2">
        <input
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="123456789:AA..."
          className="flex-1 min-w-0 border border-line rounded-lg px-2.5 py-1.5 text-xs font-mono"
        />
        <button
          onClick={handleConnect}
          disabled={connecting || !tokenInput.trim()}
          className="shrink-0 bg-accent text-accent-ink rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {connecting ? t("telegramConnect.connecting") : t("telegramConnect.connect")}
        </button>
      </div>
      {error && <p className="text-xs text-rust mt-2">{error}</p>}
    </div>
  );
}
