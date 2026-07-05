import { Material, Extra } from "./types";

// Формула: площадь материала (м²) * цена/м² + периметр (м) * цена кромки/м,
// затем накидывается наценка цеха. Итог округляется до сотен тенге/рублей.
export function calcPrice(widthMm: number, heightMm: number, material: Material): number {
  if (!material || widthMm <= 0 || heightMm <= 0) return 0;

  const widthM = widthMm / 1000;
  const heightM = heightMm / 1000;

  const areaM2 = widthM * heightM;
  const perimeterM = 2 * (widthM + heightM);

  const base = areaM2 * material.price_per_sqm + perimeterM * material.edge_per_m;
  const total = base * (1 + material.markup_percent / 100);

  return Math.round(total / 100) * 100;
}

// Фурнитура (петли, ручки, направляющие и т.д.) считается по факту, без наценки —
// это позиции, которые цех обычно просто перевыставляет клиенту по своей закупочной цене.
// Сумма по позиции = цена за штуку * количество.
export function calcExtrasTotal(extras: Extra[]): number {
  return extras.reduce((sum, e) => sum + (e.price || 0) * (e.quantity || 1), 0);
}

// Итоговая смета: материал с наценкой + фурнитура по факту
export function calcOrderTotal(widthMm: number, heightMm: number, material: Material, extras: Extra[]): number {
  return calcPrice(widthMm, heightMm, material) + calcExtrasTotal(extras);
}
