"use client";

import { useState } from "react";
import { AIConfig } from "@/lib/types";
import { useLanguage } from "@/lib/LanguageContext";

export default function AIAssistantSettings({
  config,
  onClose,
  onSave,
}: {
  config: AIConfig;
  onClose: () => void;
  onSave: (data: AIConfig) => void;
}) {
  const { t } = useLanguage();
  const [botName, setBotName] = useState(config.bot_name);
  const [description, setDescription] = useState(config.description);
  const [prompt, setPrompt] = useState(config.prompt);
  const [autoReply, setAutoReply] = useState(config.auto_reply);

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-surface rounded-xl p-4 sm:p-5 w-full max-w-lg my-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-base font-medium">{t("ai.title")}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-line/40" aria-label="×">
            ×
          </button>
        </div>

        <label className="text-sm text-ink/60 block mb-1">{t("ai.botName")}</label>
        <input
          className="w-full border border-line rounded-lg px-3 py-2 mb-3"
          value={botName}
          onChange={(e) => setBotName(e.target.value)}
          placeholder="Дина, администратор"
        />

        <label className="text-sm text-ink/60 block mb-1">{t("ai.description")}</label>
        <input
          className="w-full border border-line rounded-lg px-3 py-2 mb-3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("ai.descriptionPlaceholder")}
        />

        <label className="text-sm text-ink/60 block mb-1">{t("ai.prompt")}</label>
        <textarea
          className="w-full border border-line rounded-lg px-3 py-2 mb-1 text-sm font-mono"
          rows={10}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("ai.promptPlaceholder")}
        />
        <p className="text-xs text-ink/40 mb-4">{t("ai.promptNote")}</p>

        <div className="flex items-center justify-between border border-line rounded-lg px-3 py-2.5 mb-4">
          <div>
            <div className="text-sm font-medium">{t("ai.autoReply")}</div>
            <div className="text-xs text-ink/50">{t("ai.autoReplyNote")}</div>
          </div>
          <button
            onClick={() => setAutoReply(!autoReply)}
            className={`w-11 h-6 rounded-full shrink-0 relative transition-colors ${
              autoReply ? "bg-oak" : "bg-line"
            }`}
            aria-label={t("ai.autoReply")}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface shadow-sm transition-transform ${
                autoReply ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <button
          className="w-full bg-accent text-accent-ink rounded-lg py-2.5 font-medium"
          onClick={() => onSave({ bot_name: botName, description, prompt, auto_reply: autoReply })}
        >
          {t("profile.save")}
        </button>
      </div>
    </div>
  );
}
