"use client";

import { Order, STAGES, Stage } from "@/lib/types";
import { computeAnalytics } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

const stageDot: Record<Stage, string> = {
  new: "bg-blue-400",
  measuring: "bg-purple-400",
  approved: "bg-oak",
  production: "bg-amber-500",
  delivery: "bg-sky-500",
  done: "bg-pine",
};

const stageBar: Record<Stage, string> = {
  new: "bg-blue-400",
  measuring: "bg-purple-400",
  approved: "bg-oak",
  production: "bg-amber-500",
  delivery: "bg-sky-500",
  done: "bg-pine",
};

export default function Analytics({ orders }: { orders: Order[] }) {
  const { t } = useLanguage();
  const data = computeAnalytics(orders);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-line rounded-xl p-4">
          <div className="text-xs text-ink/50 mb-1">{t("analytics.totalDeals")}</div>
          <div className="text-2xl font-medium">{data.totalDeals}</div>
          <div className="text-xs text-ink/40 mt-1">
            {data.activeDeals} {t("analytics.active")}
          </div>
        </div>
        <div className="bg-white border border-line rounded-xl p-4">
          <div className="text-xs text-ink/50 mb-1">{t("analytics.totalRevenue")}</div>
          <div className="text-2xl font-mono font-medium text-oak">{formatMoney(data.totalRevenue)}</div>
          <div className="text-xs text-ink/40 mt-1">
            {data.wonCount} / {data.lostCount} {t("analytics.wonLost")}
          </div>
        </div>
        <div className="bg-white border border-line rounded-xl p-4">
          <div className="text-xs text-ink/50 mb-1">{t("analytics.conversion")}</div>
          <div className="text-2xl font-medium">{data.conversion.toFixed(1)}%</div>
        </div>
        <div className="bg-white border border-line rounded-xl p-4">
          <div className="text-xs text-ink/50 mb-1">{t("analytics.avgCheck")}</div>
          <div className="text-2xl font-mono font-medium">{formatMoney(data.avgCheck)}</div>
          <div className="text-xs text-ink/40 mt-1">{t("analytics.perDeal")}</div>
        </div>
      </div>

      <div className="bg-white border border-line rounded-xl p-4">
        <div className="text-sm font-medium mb-4">{t("analytics.funnel")}</div>
        <div className="space-y-3">
          {data.stages.map((s) => {
            const stageMeta = STAGES.find((st) => st.id === s.stage)!;
            return (
              <div key={s.stage}>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${stageDot[s.stage]}`} />
                    {t(`stage.${s.stage}`)}
                  </span>
                  <span className="text-xs text-ink/50">
                    {s.count} {t("analytics.deals")} · {formatMoney(s.revenue)}
                  </span>
                </div>
                <div className="h-2 bg-paper rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stageBar[s.stage]}`}
                    style={{ width: `${Math.max(s.percent, s.count > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
