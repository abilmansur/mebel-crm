import { Order, STAGES, Stage } from "./types";

export interface StageBreakdown {
  stage: Stage;
  count: number;
  percent: number;
  revenue: number;
}

export interface AnalyticsData {
  totalDeals: number;
  activeDeals: number;
  totalRevenue: number; // сумма по успешно завершённым заказам
  wonCount: number;
  lostCount: number;
  conversion: number; // % успешных от всех завершённых (успех + провал)
  avgCheck: number;
  stages: StageBreakdown[];
}

export function computeAnalytics(orders: Order[]): AnalyticsData {
  const totalDeals = orders.length;
  const doneOrders = orders.filter((o) => o.status === "done");
  const wonOrders = doneOrders.filter((o) => o.outcome === "success");
  const lostOrders = doneOrders.filter((o) => o.outcome === "failed");
  const activeDeals = totalDeals - doneOrders.length;

  const totalRevenue = wonOrders.reduce((sum, o) => sum + o.price, 0);
  const avgCheck = wonOrders.length > 0 ? Math.round(totalRevenue / wonOrders.length) : 0;

  const finishedCount = wonOrders.length + lostOrders.length;
  const conversion = finishedCount > 0 ? (wonOrders.length / finishedCount) * 100 : 0;

  const stages: StageBreakdown[] = STAGES.map(({ id }) => {
    const list = orders.filter((o) => o.status === id);
    const revenue = list.reduce((sum, o) => sum + o.price, 0);
    return {
      stage: id,
      count: list.length,
      percent: totalDeals > 0 ? (list.length / totalDeals) * 100 : 0,
      revenue,
    };
  });

  return {
    totalDeals,
    activeDeals,
    totalRevenue,
    wonCount: wonOrders.length,
    lostCount: lostOrders.length,
    conversion,
    avgCheck,
    stages,
  };
}
