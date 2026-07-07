"use client";

import { Order } from "@/lib/types";
import { buildUpcomingEvents } from "@/lib/calendarEvents";
import { formatMoney } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

function formatDate(dateStr: string): { day: string; weekday: string; isPast: boolean; isToday: boolean } {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dOnly = new Date(d);
  dOnly.setHours(0, 0, 0, 0);

  return {
    day: d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }),
    weekday: d.toLocaleDateString("ru-RU", { weekday: "short" }),
    isPast: dOnly.getTime() < today.getTime(),
    isToday: dOnly.getTime() === today.getTime(),
  };
}

export default function CalendarView({
  orders,
  onOrderClick,
}: {
  orders: Order[];
  onOrderClick: (order: Order) => void;
}) {
  const { t } = useLanguage();
  const events = buildUpcomingEvents(orders);

  if (events.length === 0) {
    return <p className="text-sm text-ink/50 py-6">{t("calendar.empty")}</p>;
  }

  return (
    <div className="space-y-2">
      {events.map((e, i) => {
        const { day, weekday, isPast, isToday } = formatDate(e.date);
        return (
          <button
            key={`${e.order.id}-${e.type}-${i}`}
            onClick={() => onOrderClick(e.order)}
            className="w-full flex items-center gap-3 border border-line rounded-lg p-3 text-left hover:border-oak/50 transition-colors"
          >
            <div
              className={`w-14 shrink-0 rounded-lg text-center py-1.5 ${
                isToday ? "bg-oak text-paper" : isPast ? "bg-rust/10 text-rust" : "bg-paper text-ink/70"
              }`}
            >
              <div className="text-sm font-medium leading-tight">{day}</div>
              <div className="text-[10px] uppercase leading-tight">{weekday}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <span>{e.type === "measurement" ? "📐" : "🚚"}</span>
                <span>{e.order.client_name}</span>
                <span className="text-ink/40 font-normal">
                  · {e.type === "measurement" ? t("calendar.measurement") : t("calendar.delivery")}
                </span>
              </div>
              <div className="text-xs text-ink/50 truncate">
                {e.order.title}
                {e.order.address && ` · ${e.order.address}`}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-xs text-ink/50">{formatMoney(e.order.price)}</div>
              {e.order.phone && <div className="text-xs text-ink/40">{e.order.phone}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
