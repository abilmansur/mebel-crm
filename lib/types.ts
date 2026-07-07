// Воронка заказа: Заявка -> Замеры -> Согласовано -> Производство -> Доставка -> Завершено.
// "Завершено" — общий финальный столбец: сюда попадают и успешно доставленные,
// и отменённые (клиент отказался после замера/на согласовании) заказы — их различает поле outcome.
export type Stage = "new" | "measuring" | "approved" | "production" | "delivery" | "done";

export type Outcome = "success" | "failed" | null;

export interface Material {
  id: string;
  name: string;
  price_per_sqm: number;
  edge_per_m: number;
  markup_percent: number;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  client_name: string;
  phone: string;
  address: string; // адрес для замера и доставки
  title: string;
  width_mm: number;
  height_mm: number;
  material_id: string;
  extras: Extra[];
  comment: string;
  price: number;
  status: Stage;
  overdue: boolean;
  measurement_date: string; // ставится на этапе "Заявка"/"Замеры", дальше не редактируется
  delivery_date: string; // редактируется начиная с этапа "Производство"
  outcome: Outcome;
  created_at?: string;
}

export type Channel = "whatsapp" | "telegram" | "phone" | "site";
export type Direction = "in" | "out";

export interface InboxMessage {
  id: string;
  channel: Channel;
  chat_id: number | null;
  direction: Direction;
  read: boolean;
  client_name: string;
  text: string;
  ai_suggestion: string;
  created_at?: string;
}

export interface AIConfig {
  bot_name: string;
  description: string;
  prompt: string;
  knowledge_base: string;
  auto_reply: boolean;
}

export interface AIPhoto {
  id: string;
  keywords: string;
  image_url: string;
  caption: string;
}

export const STAGES: { id: Stage; label: string }[] = [
  { id: "new", label: "Заявка" },
  { id: "measuring", label: "Замеры" },
  { id: "approved", label: "Согласовано" },
  { id: "production", label: "Производство" },
  { id: "delivery", label: "Доставка" },
  { id: "done", label: "Завершено" },
];

// На каких этапах разрешено ставить/видеть дату замера и дату доставки
export function isMeasurementDateRelevant(status: Stage): boolean {
  return status === "new" || status === "measuring";
}

export function isDeliveryDateEditable(status: Stage): boolean {
  return status === "production" || status === "delivery" || status === "done";
}

// На этих этапах заказ ещё может "сорваться" — клиент отказался
export function canMarkAsFailed(status: Stage): boolean {
  return status === "new" || status === "measuring" || status === "approved";
}
