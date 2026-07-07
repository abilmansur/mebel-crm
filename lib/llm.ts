export type LLMProvider = "anthropic" | "openai";

export interface LLMResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

async function callAnthropic(systemPrompt: string, history: ChatMessage[]): Promise<LLMResult | null> {
  if (!ANTHROPIC_API_KEY) return null;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 400, system: systemPrompt, messages: history }),
    });
    if (!response.ok) {
      console.error("Anthropic API error:", await response.text());
      return null;
    }
    const data = await response.json();
    const textBlock = data.content?.find((c: any) => c.type === "text");
    if (!textBlock) return null;
    return {
      text: textBlock.text,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
    };
  } catch (err) {
    console.error("Ошибка вызова Anthropic API:", err);
    return null;
  }
}

async function callOpenAI(systemPrompt: string, history: ChatMessage[]): Promise<LLMResult | null> {
  if (!OPENAI_API_KEY) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: 400,
        messages: [{ role: "system", content: systemPrompt }, ...history],
      }),
    });
    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      return null;
    }
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;
    return {
      text,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
    };
  } catch (err) {
    console.error("Ошибка вызова OpenAI API:", err);
    return null;
  }
}

export async function generateLLMReply(
  provider: LLMProvider,
  systemPrompt: string,
  history: ChatMessage[]
): Promise<LLMResult | null> {
  if (!systemPrompt.trim()) return null;
  return provider === "openai" ? callOpenAI(systemPrompt, history) : callAnthropic(systemPrompt, history);
}

export function isProviderConfigured(provider: LLMProvider): boolean {
  return provider === "openai" ? Boolean(OPENAI_API_KEY) : Boolean(ANTHROPIC_API_KEY);
}
