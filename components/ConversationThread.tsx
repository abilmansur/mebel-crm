"use client";

import { useState } from "react";
import { Conversation } from "@/lib/conversations";
import { useLanguage } from "@/lib/LanguageContext";

export default function ConversationThread({
  conversation,
  onClose,
  onSend,
  onCreateOrder,
  sending,
}: {
  conversation: Conversation;
  onClose: () => void;
  onSend: (text: string) => void;
  onCreateOrder: () => void;
  sending: boolean;
}) {
  const { t } = useLanguage();
  const [reply, setReply] = useState("");

  const lastSuggestion = [...conversation.messages].reverse().find((m) => m.ai_suggestion)?.ai_suggestion;

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-3 sm:p-6">
      <div className="bg-surface rounded-xl w-full max-w-md flex flex-col" style={{ maxHeight: "85vh" }}>
        <div className="flex justify-between items-center p-4 border-b border-line shrink-0">
          <div>
            <div className="text-sm font-medium">{conversation.clientName}</div>
            <div className="text-xs text-ink/40 capitalize">{conversation.channel}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCreateOrder}
              className="text-xs border border-line rounded-lg px-3 py-1.5 hover:bg-paper whitespace-nowrap"
            >
              {t("inbox.toOrder")}
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-line/40 shrink-0" aria-label="×">
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversation.messages.map((m) => (
            <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  m.direction === "out" ? "bg-accent text-accent-ink" : "bg-paper text-ink"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {lastSuggestion && (
          <div className="mx-4 mb-2 text-xs bg-paper rounded-lg px-3 py-2 flex items-start gap-2">
            <span className="text-ink/60 flex-1">💡 {lastSuggestion}</span>
            <button
              onClick={() => setReply(lastSuggestion)}
              className="shrink-0 text-oak font-medium whitespace-nowrap"
            >
              {t("ai.useSuggestion")}
            </button>
          </div>
        )}

        <div className="p-4 border-t border-line shrink-0">
          {conversation.canReply ? (
            <div className="flex gap-2">
              <textarea
                className="flex-1 border border-line rounded-lg px-3 py-2 text-sm resize-none"
                rows={2}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={t("inbox.replyPlaceholder")}
              />
              <button
                className="bg-accent text-accent-ink rounded-lg px-4 text-sm font-medium disabled:opacity-50 shrink-0"
                disabled={!reply.trim() || sending}
                onClick={() => {
                  onSend(reply.trim());
                  setReply("");
                }}
              >
                {t("inbox.send")}
              </button>
            </div>
          ) : (
            <p className="text-xs text-ink/40 text-center">{t("inbox.replyUnavailable")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
