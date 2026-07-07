import { Order, isMeasurementDateRelevant, isDeliveryDateEditable } from "./types";

export interface CalendarEvent {
  order: Order;
  date: string;
  type: "measurement" | "delivery";
}

// Собираем предстоящие даты замеров и доставок из уже существующих заказов —
// без отдельной таблицы календаря, просто удобное представление того, что уже есть.
export function buildUpcomingEvents(orders: Order[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const order of orders) {
    if (isMeasurementDateRelevant(order.status) && order.measurement_date) {
      events.push({ order, date: order.measurement_date, type: "measurement" });
    }
    if (isDeliveryDateEditable(order.status) && order.status !== "done" && order.delivery_date) {
      events.push({ order, date: order.delivery_date, type: "delivery" });
    }
  }

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
