"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { useTheme } from "@/lib/ThemeContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setEmail(user.email || "");
      setName((user.user_metadata?.full_name as string) || "");
      setPhone((user.user_metadata?.phone as string) || "");
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSaveProfile() {
    if (!supabase) return;
    setSavingProfile(true);
    setProfileMsg(null);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name, phone } });
    setSavingProfile(false);
    setProfileMsg(error ? error.message : t("profile.saved"));
  }

  async function handleChangePassword() {
    if (!supabase) return;
    if (newPassword.length < 6) {
      setPasswordMsg(t("profile.minChars"));
      return;
    }
    if (newPassword !== repeatPassword) {
      setPasswordMsg(t("profile.passwordsDontMatch"));
      return;
    }
    setSavingPassword(true);
    setPasswordMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (!error) {
      setNewPassword("");
      setRepeatPassword("");
    }
    setPasswordMsg(error ? error.message : t("profile.passwordChanged"));
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-lg mx-auto p-6 mt-16 text-sm text-ink/60">
        Supabase не настроен — профиль недоступен в демо-режиме.{" "}
        <a className="underline" href="/">
          На главную
        </a>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-sm text-ink/50">…</div>;
  }

  const initial = (name || email || "?").charAt(0).toUpperCase();

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="w-9 h-9 border border-line rounded-lg flex items-center justify-center"
            aria-label={t("profile.back")}
          >
            ←
          </button>
          <div>
            <h1 className="text-base font-medium">{t("profile.title")}</h1>
            <p className="text-xs text-ink/50">{t("profile.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-xl p-5 mb-4">
        <div className="text-sm font-medium mb-3">{t("profile.appearance")}</div>

        <label className="text-sm text-ink/60 block mb-1.5">{t("profile.language")}</label>
        <div className="mb-4">
          <LanguageSwitcher />
        </div>

        <label className="text-sm text-ink/60 block mb-1.5">{t("profile.theme")}</label>
        <div className="flex border border-line rounded-lg overflow-hidden text-sm w-fit">
          <button
            onClick={() => setTheme("light")}
            className={`px-3 py-1.5 ${theme === "light" ? "bg-accent text-accent-ink" : "text-ink/50 hover:bg-paper"}`}
          >
            ☀ {t("profile.light")}
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`px-3 py-1.5 ${theme === "dark" ? "bg-accent text-accent-ink" : "text-ink/50 hover:bg-paper"}`}
          >
            ☾ {t("profile.dark")}
          </button>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-xl p-5 mb-4">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-paper flex items-center justify-center text-2xl font-medium text-ink/60 shrink-0">
            {initial}
          </div>
        </div>

        <label className="text-sm text-ink/60">{t("profile.workspaceName")}</label>
        <input
          className="w-full border border-line rounded-lg px-3 py-2 mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="text-sm text-ink/60">{t("profile.email")}</label>
        <input
          className="w-full border border-line rounded-lg px-3 py-2 mb-3 bg-paper/60 text-ink/60"
          value={email}
          disabled
        />

        <label className="text-sm text-ink/60">{t("profile.phone")}</label>
        <input
          className="w-full border border-line rounded-lg px-3 py-2 mb-4"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 700 000 00 00"
        />

        {profileMsg && <p className="text-sm text-ink/60 mb-3">{profileMsg}</p>}

        <button
          className="bg-accent text-accent-ink rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          onClick={handleSaveProfile}
          disabled={savingProfile}
        >
          {t("profile.save")}
        </button>
      </div>

      <div className="bg-surface border border-line rounded-xl p-5">
        <div className="text-sm font-medium mb-3">{t("profile.changePassword")}</div>

        <label className="text-sm text-ink/60">{t("profile.newPassword")}</label>
        <input
          type="password"
          className="w-full border border-line rounded-lg px-3 py-2 mb-1"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <p className="text-xs text-ink/40 mb-3">{t("profile.minChars")}</p>

        <label className="text-sm text-ink/60">{t("profile.repeatPassword")}</label>
        <input
          type="password"
          className="w-full border border-line rounded-lg px-3 py-2 mb-4"
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
        />

        {passwordMsg && <p className="text-sm text-ink/60 mb-3">{passwordMsg}</p>}

        <button
          className="border border-line rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          onClick={handleChangePassword}
          disabled={savingPassword}
        >
          {t("profile.changePasswordBtn")}
        </button>
      </div>
    </div>
  );
}
