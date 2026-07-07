"use client";

import { InboxMessage, Channel } from "@/lib/types";
import { buildConversations, Conversation } from "@/lib/conversations";
import { useLanguage } from "@/lib/LanguageContext";

const channelLabel: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  phone: "Звонок",
  site: "Сайт",
};

export default function Inbox({
  messages,
  onOpenConversation,
  onRefresh,
}: {
  messages: InboxMessage[];
  onOpenConversation: (conversation: Conversation) => void;
  onRefresh: () => void;
}) {
  const { t } = useLanguage();
  const conversations = buildConversations(messages);

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button onClick={onRefresh} className="text-xs text-ink/50 hover:text-ink flex items-center gap-1">
          ↻ {t("inbox.refresh")}
        </button>
      </div>

      {conversations.length === 0 ? (
        <p className="text-sm text-ink/50 py-6">{t("inbox.empty")}</p>
      ) : (
        conversations.map((c) => (
          <button
            key={c.key}
            onClick={() => onOpenConversation(c)}
            className="w-full flex gap-3 py-3 border-b border-line items-start text-left hover:bg-paper/60 rounded-lg px-1"
          >
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-full bg-paper flex items-center justify-center text-xs font-medium text-ink/60">
                {channelLabel[c.channel][0]}
              </div>
              {c.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rust text-white text-[10px] flex items-center justify-center">
                  {c.unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm ${c.unreadCount > 0 ? "font-semibold" : "font-medium"}`}>{c.clientName}</div>
              <div className="text-sm text-ink/70 mt-0.5 truncate">
                {c.lastMessage.direction === "out" ? `${t("inbox.you")}: ` : ""}
                {c.lastMessage.text}
              </div>
              {c.lastMessage.ai_suggestion && (
                <div className="text-xs text-oak mt-0.5">💡 {t("ai.suggestionReady")}</div>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  );
}
