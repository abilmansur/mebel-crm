import { LLMProvider } from "./llm";

// Ориентировочные цены провайдеров за 1 млн токенов, в USD.
// Актуальные цены — на anthropic.com/pricing и openai.com/pricing, обновляй при изменениях.
const PRICING_USD_PER_M_TOKENS: Record<LLMProvider, { input: number; output: number }> = {
  anthropic: { input: 1, output: 5 }, // Claude Haiku
  openai: { input: 0.15, output: 0.6 }, // GPT-4o mini
};

const MARKUP_PERCENT = Number(process.env.AI_MARKUP_PERCENT || 18);

// Курс для перевода USD → KZT. Это упрощение для MVP: курс не обновляется автоматически,
// его нужно периодически поправлять переменной окружения USD_TO_KZT_RATE.
const USD_TO_KZT = Number(process.env.USD_TO_KZT_RATE || 520);

export function calculateCostKzt(provider: LLMProvider, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING_USD_PER_M_TOKENS[provider];
  const usd = (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
  const usdWithMarkup = usd * (1 + MARKUP_PERCENT / 100);
  return Math.round(usdWithMarkup * USD_TO_KZT * 100) / 100;
}
