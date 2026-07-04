export type Stage = "new" | "quote" | "approved" | "production" | "done";

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
}

export interface Order {
  id: string;
  client_name: string;
  title: string;
  width_mm: number;
  height_mm: number;
  material_id: string;
  extras: Extra[];
  comment: string;
  price: number;
  status: Stage;
  overdue: boolean;
  created_at?: string;
}

export type Channel = "whatsapp" | "telegram" | "phone" | "site";

export interface InboxMessage {
  id: string;
  channel: Channel;
  client_name: string;
  text: string;
  ai_suggestion: string;
  created_at?: string;
}

export const STAGES: { id: Stage; label: string }[] = [
  { id: "new", label: "Заявка" },
  { id: "quote", label: "Расчёт" },
  { id: "approved", label: "Согласовано" },
  { id: "production", label: "Производство" },
  { id: "done", label: "Готово" },
];
