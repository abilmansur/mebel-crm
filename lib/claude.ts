const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Используем Haiku по умолчанию — быстрый и дешёвый вариант для авто-ответов на сообщения клиентов.
// Для более качественных ответов можно сменить на claude-sonnet-5, но это дороже за каждое сообщение.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

export async function generateAIReply(
  systemPrompt: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[]
): Promise<string | null> {
  if (!ANTHROPIC_API_KEY || !systemPrompt.trim()) return null;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: systemPrompt,
        messages: conversationHistory,
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error:", await response.text());
      return null;
    }

    const data = await response.json();
    const textBlock = data.content?.find((c: any) => c.type === "text");
    return textBlock?.text || null;
  } catch (err) {
    console.error("Ошибка вызова Claude API:", err);
    return null;
  }
}
