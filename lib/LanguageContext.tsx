"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Lang, translate } from "./i18n";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "mebel-crm-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem(STORAGE_KEY) as Lang | null) : null;
    if (saved === "ru" || saved === "kk" || saved === "en") {
      setLangState(saved);
    }
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next);
  }

  function t(key: string) {
    return translate(lang, key);
  }

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
