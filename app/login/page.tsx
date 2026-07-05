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
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm text-sm text-ink/60 text-center">
          Supabase не настроен — приложение работает в демо-режиме без входа.{" "}
          <a className="underline" href="/">
            Перейти на главную
          </a>
        </div>
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
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-surface border border-line rounded-2xl shadow-sm p-6 sm:p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-xl bg-oak text-paper flex items-center justify-center text-xl font-semibold mx-auto mb-4">
            M
          </div>
          <p className="text-sm">
            Проверь почту <b>{email}</b> и перейди по ссылке подтверждения, затем вернись и войди.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="bg-surface border border-line rounded-2xl shadow-sm p-6 sm:p-8 max-w-sm w-full">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-oak text-paper flex items-center justify-center text-xl font-semibold mb-3">
            M
          </div>
          <h1 className="text-lg font-medium">Мебель CRM</h1>
          <p className="text-sm text-ink/50 mt-0.5">
            {mode === "signin" ? "Вход в свой цех" : "Регистрация нового цеха"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-paper rounded-lg p-1 mb-5">
          <button
            className={`py-1.5 rounded-md text-sm transition-colors ${
              mode === "signin" ? "bg-surface font-medium shadow-sm" : "text-ink/50"
            }`}
            onClick={() => setMode("signin")}
          >
            {t("login.signin")}
          </button>
          <button
            className={`py-1.5 rounded-md text-sm transition-colors ${
              mode === "signup" ? "bg-surface font-medium shadow-sm" : "text-ink/50"
            }`}
            onClick={() => setMode("signup")}
          >
            {t("login.signup")}
          </button>
        </div>

        <div className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="text-sm text-ink/60 block mb-1">{t("login.workspaceName")}</label>
              <input
                className="w-full border border-line rounded-lg px-3 py-2"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Мебельный цех"
              />
            </div>
          )}

          <div>
            <label className="text-sm text-ink/60 block mb-1">{t("login.email")}</label>
            <input
              type="email"
              className="w-full border border-line rounded-lg px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="master@example.com"
            />
          </div>

          <div>
            <label className="text-sm text-ink/60 block mb-1">{t("login.password")}</label>
            <input
              type="password"
              className="w-full border border-line rounded-lg px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
            />
          </div>

          {error && <p className="text-sm text-rust bg-rust/10 rounded-lg px-3 py-2">{error}</p>}

          <button
            className="w-full bg-accent text-accent-ink rounded-lg py-2.5 font-medium disabled:opacity-50 mt-1"
            onClick={handleSubmit}
            disabled={loading || !email || !password}
          >
            {loading ? t("login.wait") : mode === "signin" ? t("login.enterBtn") : t("login.createBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
