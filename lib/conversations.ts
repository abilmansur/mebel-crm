import { InboxMessage, Channel } from "./types";

export interface Conversation {
  key: string;
  chatId: number | null;
  channel: Channel;
  clientName: string;
  messages: InboxMessage[];
  lastMessage: InboxMessage;
  canReply: boolean;
}

// Группируем по chat_id (Telegram) — сообщения без chat_id (например, старые демо-заявки
// или будущие каналы без threading) остаются отдельными "диалогами из одного сообщения".
export function buildConversations(messages: InboxMessage[]): Conversation[] {
  const groups = new Map<string, InboxMessage[]>();

  for (const m of messages) {
    const key = m.chat_id ? `chat:${m.chat_id}` : `single:${m.id}`;
    const list = groups.get(key) || [];
    list.push(m);
    groups.set(key, list);
  }

  const conversations: Conversation[] = [];
  groups.forEach((msgs, key) => {
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );
    const last = sorted[sorted.length - 1];
    conversations.push({
      key,
      chatId: last.chat_id,
      channel: last.channel,
      clientName: last.client_name,
      messages: sorted,
      lastMessage: last,
      canReply: Boolean(last.chat_id && last.channel === "telegram"),
    });
  });

  return conversations.sort(
    (a, b) => new Date(b.lastMessage.created_at || 0).getTime() - new Date(a.lastMessage.created_at || 0).getTime()
  );
}
