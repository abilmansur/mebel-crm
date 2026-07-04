import { Material, Order, InboxMessage } from "./types";
import { calcOrderTotal } from "./calculator";

export const demoMaterials: Material[] = [
  { id: "ldsp16", name: "ЛДСП 16мм Egger", price_per_sqm: 8500, edge_per_m: 350, markup_percent: 30 },
  { id: "ldsp25", name: "ЛДСП 25мм Egger", price_per_sqm: 11200, edge_per_m: 350, markup_percent: 30 },
  { id: "mdf", name: "МДФ крашеный", price_per_sqm: 17800, edge_per_m: 420, markup_percent: 35 },
];

export function buildDemoOrders(materials: Material[]): Order[] {
  const find = (id: string) => materials.find((m) => m.id === id) as Material;

  const shkafExtras = [
    { id: "e1", name: "Направляющие Blum", price: 12000 },
    { id: "e2", name: "Ручки-купе", price: 4500 },
  ];
  const kuhnyaExtras = [{ id: "e3", name: "Петли Blum (12 шт)", price: 21000 }];

  return [
    {
      id: "1",
      client_name: "Иванов А.",
      title: "Шкаф-купе 2×2.4м",
      width_mm: 2000,
      height_mm: 2400,
      material_id: "ldsp16",
      extras: shkafExtras,
      comment: "Клиент просил зеркало на одну из дверей",
      price: calcOrderTotal(2000, 2400, find("ldsp16"), shkafExtras),
      status: "quote",
      overdue: false,
    },
    {
      id: "2",
      client_name: "Смагулова Д.",
      title: "Кухонный гарнитур",
      width_mm: 3200,
      height_mm: 900,
      material_id: "mdf",
      extras: kuhnyaExtras,
      comment: "",
      price: calcOrderTotal(3200, 900, find("mdf"), kuhnyaExtras),
      status: "production",
      overdue: true,
    },
    {
      id: "3",
      client_name: "Петров И.",
      title: "Гардеробная система",
      width_mm: 2800,
      height_mm: 2500,
      material_id: "ldsp25",
      extras: [],
      comment: "",
      price: calcOrderTotal(2800, 2500, find("ldsp25"), []),
      status: "production",
      overdue: false,
    },
    {
      id: "4",
      client_name: "Ким Е.",
      title: "Прихожая на заказ",
      width_mm: 1600,
      height_mm: 2200,
      material_id: "ldsp16",
      extras: [],
      comment: "",
      price: calcOrderTotal(1600, 2200, find("ldsp16"), []),
      status: "done",
      overdue: false,
    },
  ];
}

export const demoInbox: InboxMessage[] = [
  { id: "i1", channel: "whatsapp", client_name: "Ержан Т.", text: "Здравствуйте, сколько будет стоить шкаф-купе 2 на 2.5 метра?", ai_suggestion: "Ориентировочно от 65 000 за ЛДСП 16мм с учётом кромки. Уточните материал для точного расчёта?" },
  { id: "i2", channel: "telegram", client_name: "Наталья К.", text: "Когда будет готов мой кухонный гарнитур?", ai_suggestion: "Заказ «Кухонный гарнитур» сейчас в производстве, ожидаемая готовность через 4 дня." },
  { id: "i3", channel: "phone", client_name: "Бекзат А.", text: "Звонок 09:41 — интересовался прихожей на заказ, оставил номер", ai_suggestion: "Предложить замер на дом в ближайшие 2 дня, отправить примеры из портфолио." },
  { id: "i4", channel: "site", client_name: "Форма с сайта", text: "Гардеробная система, площадь комнаты 8м², нужен расчёт", ai_suggestion: "Запросить точные габариты ниши и предпочитаемый материал перед расчётом сметы." },
];
