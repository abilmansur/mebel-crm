"use client";

import { useState } from "react";
import { AIConfig, AIPhoto } from "@/lib/types";
import { DEFAULT_AI_PROMPT } from "@/lib/defaultPrompt";
import { useLanguage } from "@/lib/LanguageContext";
import { supabase } from "@/lib/supabase";

export default function AIAssistantSettings({
  config,
  photos,
  onClose,
  onSave,
  onAddPhoto,
  onDeletePhoto,
}: {
  config: AIConfig;
  photos: AIPhoto[];
  onClose: () => void;
  onSave: (data: AIConfig) => void;
  onAddPhoto: (data: { keywords: string; image_url: string; caption: string }) => void;
  onDeletePhoto: (id: string) => void;
}) {
  const { t } = useLanguage();
  const [section, setSection] = useState<"prompt" | "knowledge" | "photos">("prompt");

  const [botName, setBotName] = useState(config.bot_name);
  const [description, setDescription] = useState(config.description);
  const [prompt, setPrompt] = useState(config.prompt || DEFAULT_AI_PROMPT);
  const [knowledgeBase, setKnowledgeBase] = useState(config.knowledge_base);
  const [provider, setProvider] = useState<"anthropic" | "openai">(config.provider || "anthropic");
  const [autoReply, setAutoReply] = useState(config.auto_reply);

  const [photoKeywords, setPhotoKeywords] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleTest() {
    if (!supabase) return;
    setTesting(true);
    setTestResult(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    try {
      const res = await fetch("/api/ai-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ prompt, knowledgeBase, provider }),
      });
      const json = await res.json();
      setTestResult(res.ok ? { ok: true, text: json.reply } : { ok: false, text: json.error });
    } catch {
      setTestResult({ ok: false, text: t("ai.testNetworkError") });
    }
    setTesting(false);
  }

  function handleAddPhoto() {
    if (!photoKeywords.trim() || !photoUrl.trim()) return;
    onAddPhoto({ keywords: photoKeywords.trim(), image_url: photoUrl.trim(), caption: photoCaption.trim() });
    setPhotoKeywords("");
    setPhotoUrl("");
    setPhotoCaption("");
  }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-surface rounded-xl p-4 sm:p-5 w-full max-w-lg my-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-base font-medium">{t("ai.title")}</span>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-line/40" aria-label="×">
            ×
          </button>
        </div>

        <div className="flex gap-1 bg-paper rounded-lg p-1 mb-4">
          {(["prompt", "knowledge", "photos"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSection(s)}
              className={`flex-1 py-1.5 rounded-md text-xs sm:text-sm transition-colors ${
                section === s ? "bg-surface font-medium shadow-sm" : "text-ink/50"
              }`}
            >
              {t(`ai.section.${s}`)}
            </button>
          ))}
        </div>

        {section === "prompt" && (
          <>
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
              rows={12}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <p className="text-xs text-ink/40 mb-4">{t("ai.promptNote")}</p>

            <label className="text-sm text-ink/60 block mb-1">{t("ai.provider")}</label>
            <div className="flex gap-1 bg-paper rounded-lg p-1 mb-4 w-fit">
              {(["anthropic", "openai"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    provider === p ? "bg-surface font-medium shadow-sm" : "text-ink/50"
                  }`}
                >
                  {p === "anthropic" ? "Claude" : "OpenAI"}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between border border-line rounded-lg px-3 py-2.5 mb-4">
              <div>
                <div className="text-sm font-medium">{t("ai.autoReply")}</div>
                <div className="text-xs text-ink/50">{t("ai.autoReplyNote")}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoReply}
                  onChange={(e) => setAutoReply(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="w-11 h-6 rounded-full bg-line peer-checked:bg-oak transition-colors" />
                <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface shadow-sm transition-transform peer-checked:translate-x-5" />
              </label>
            </div>

            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="w-full border border-line rounded-lg py-2 text-sm font-medium hover:bg-paper disabled:opacity-50"
            >
              {testing ? t("ai.testing") : t("ai.test")}
            </button>

            {testResult && (
              <div
                className={`mt-2 text-sm rounded-lg px-3 py-2 ${
                  testResult.ok ? "bg-pine/10 text-pine" : "bg-rust/10 text-rust"
                }`}
              >
                {testResult.ok ? `💬 ${testResult.text}` : testResult.text}
              </div>
            )}
          </>
        )}

        {section === "knowledge" && (
          <>
            <label className="text-sm text-ink/60 block mb-1">{t("ai.knowledgeBase")}</label>
            <textarea
              className="w-full border border-line rounded-lg px-3 py-2 mb-1 text-sm"
              rows={14}
              value={knowledgeBase}
              onChange={(e) => setKnowledgeBase(e.target.value)}
              placeholder={t("ai.knowledgeBasePlaceholder")}
            />
            <p className="text-xs text-ink/40 mb-4">{t("ai.knowledgeBaseNote")}</p>
          </>
        )}

        {section === "photos" && (
          <>
            <p className="text-xs text-ink/50 mb-3">{t("ai.photosNote")}</p>

            {photos.length > 0 && (
              <div className="space-y-2 mb-3">
                {photos.map((p) => (
                  <div key={p.id} className="border border-line rounded-lg p-2.5 flex gap-3 items-center">
                    <img
                      src={p.image_url}
                      alt={p.caption}
                      className="w-12 h-12 rounded-lg object-cover shrink-0 bg-paper"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{p.keywords}</div>
                      {p.caption && <div className="text-xs text-ink/40 truncate">{p.caption}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeletePhoto(p.id)}
                      className="w-7 h-7 shrink-0 rounded-lg hover:bg-rust/10 text-rust"
                      aria-label="×"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border border-dashed border-line rounded-lg p-3 space-y-2">
              <input
                className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm"
                placeholder={t("ai.photoKeywords")}
                value={photoKeywords}
                onChange={(e) => setPhotoKeywords(e.target.value)}
              />
              <input
                className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm"
                placeholder={t("ai.photoUrl")}
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
              <input
                className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm"
                placeholder={t("ai.photoCaption")}
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                className="w-full bg-accent text-accent-ink rounded-lg py-1.5 text-sm font-medium"
              >
                + {t("ai.addPhoto")}
              </button>
            </div>
          </>
        )}

        <button
          type="button"
          className="w-full bg-accent text-accent-ink rounded-lg py-2.5 font-medium mt-4"
          onClick={() =>
            onSave({
              bot_name: botName,
              description,
              prompt,
              knowledge_base: knowledgeBase,
              provider,
              auto_reply: autoReply,
            })
          }
        >
          {t("profile.save")}
        </button>
      </div>
    </div>
  );
}
