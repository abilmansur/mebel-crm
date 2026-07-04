"use client";

import { InboxMessage, Channel } from "@/lib/types";

const channelLabel: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  phone: "Звонок",
  site: "Сайт",
};

export default function Inbox({
  messages,
  onConvert,
}: {
  messages: InboxMessage[];
  onConvert: (msg: InboxMessage) => void;
}) {
  if (messages.length === 0) {
    return <p className="text-sm text-ink/50 py-6">Новых обращений нет — все распределены по доске.</p>;
  }

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id} className="flex gap-3 py-3 border-b border-line items-start">
          <div className="w-7 h-7 rounded-full bg-paper flex items-center justify-center text-xs shrink-0 font-medium text-ink/60">
            {channelLabel[m.channel][0]}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{m.client_name}</div>
            <div className="text-sm text-ink/70 mt-0.5 mb-1.5">{m.text}</div>
            <div className="text-xs bg-paper rounded-lg px-2.5 py-2 text-ink/60">{m.ai_suggestion}</div>
          </div>
          <button
            onClick={() => onConvert(m)}
            className="text-sm border border-line rounded-lg px-3 py-1.5 whitespace-nowrap hover:bg-paper"
          >
            В заказ
          </button>
        </div>
      ))}
    </div>
  );
}
