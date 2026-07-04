// Валюта настраивается через переменную окружения — по умолчанию тенге (₸),
// т.к. первый рынок — Казахстан. Для РФ поставь "₽", для США — "$" и т.д.
// Один workspace = одна валюта на этом этапе; если понадобится разная валюта
// на цех (например, часть клиентов в РФ, часть в РК) — перенести это поле
// в таблицу workspaces в Supabase вместо общей переменной окружения.
export const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₸";

export function formatMoney(amount: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ${CURRENCY_SYMBOL}`;
}
