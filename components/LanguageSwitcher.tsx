"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { Lang, LANG_LABELS } from "@/lib/i18n";

const LANGS: Lang[] = ["ru", "kk", "en"];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex border border-line rounded-lg overflow-hidden text-xs">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1.5 ${lang === l ? "bg-ink text-white" : "text-ink/50 hover:bg-paper"}`}
        >
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
