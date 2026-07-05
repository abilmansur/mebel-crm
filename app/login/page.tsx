"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getOrCreateWorkspace } from "@/lib/workspace";
import { useLanguage } from "@/lib/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="max-w-sm mx-auto p-6 mt-16 text-sm text-ink/60">
        Supabase не настроен — приложение работает в демо-режиме без входа. Перейди на{" "}
        <a className="underline" href="/">
          главную страницу
        </a>
        .
      </div>
    );
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase!.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      // Если в проекте включено подтверждение email, сессии ещё не будет —
      // просим проверить почту вместо мгновенного входа.
      if (!data.session) {
        setConfirmSent(true);
        setLoading(false);
        return;
      }
      if (data.user) {
        await getOrCreateWorkspace(data.user.id, workspaceName.trim() || "Мебельный цех");
      }
      router.push("/");
      router.refresh();
      return;
    }

    const { data: signInData, error: signInError } = await supabase!.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    if (signInData.user) {
      await getOrCreateWorkspace(signInData.user.id, workspaceName.trim() || "Мебельный цех");
    }
    router.push("/");
    router.refresh();
  }

  if (confirmSent) {
    return (
      <div className="max-w-sm mx-auto p-6 mt-16 text-sm">
        Проверь почту <b>{email}</b> и перейди по ссылке подтверждения, затем вернись и войди.
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-4 sm:p-6 mt-12 sm:mt-16">
      <div className="flex justify-between items-start mb-1">
        <h1 className="text-lg font-medium">Мебель CRM</h1>
      </div>
      <p className="text-sm text-ink/60 mb-5">
        {mode === "signin" ? t("login.signin") : t("login.signup")}
      </p>

      <div className="flex gap-1 mb-4">
        <button
          className={`px-3 py-1.5 rounded-lg text-sm ${mode === "signin" ? "bg-paper font-medium" : "text-ink/50"}`}
          onClick={() => setMode("signin")}
        >
          {t("login.signin")}
        </button>
        <button
          className={`px-3 py-1.5 rounded-lg text-sm ${mode === "signup" ? "bg-paper font-medium" : "text-ink/50"}`}
          onClick={() => setMode("signup")}
        >
          {t("login.signup")}
        </button>
      </div>

      {mode === "signup" && (
        <>
          <label className="text-sm text-ink/60">{t("login.workspaceName")}</label>
          <input
            className="w-full border border-line rounded-lg px-3 py-2 mb-3"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="Мебельный цех"
          />
        </>
      )}

      <label className="text-sm text-ink/60">{t("login.email")}</label>
      <input
        type="email"
        className="w-full border border-line rounded-lg px-3 py-2 mb-3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="master@example.com"
      />

      <label className="text-sm text-ink/60">{t("login.password")}</label>
      <input
        type="password"
        className="w-full border border-line rounded-lg px-3 py-2 mb-4"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Минимум 6 символов"
      />

      {error && <p className="text-sm text-rust mb-3">{error}</p>}

      <button
        className="w-full bg-accent text-accent-ink rounded-lg py-2 font-medium disabled:opacity-50"
        onClick={handleSubmit}
        disabled={loading || !email || !password}
      >
        {loading ? t("login.wait") : mode === "signin" ? t("login.enterBtn") : t("login.createBtn")}
      </button>
    </div>
  );
}
