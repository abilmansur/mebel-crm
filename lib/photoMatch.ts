import { AIPhoto } from "./types";

// Простое совпадение по ключевым словам (через запятую) в тексте сообщения клиента.
// Не ИИ-матчинг — быстро и предсказуемо для MVP; при желании можно заменить на вызов Claude
// с классификацией темы сообщения.
export function findMatchingPhoto(text: string, photos: AIPhoto[]): AIPhoto | null {
  const lower = text.toLowerCase();
  for (const photo of photos) {
    const keywords = photo.keywords
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    if (keywords.some((k) => lower.includes(k))) {
      return photo;
    }
  }
  return null;
}
