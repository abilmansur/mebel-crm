"use client";

import { formatMoney } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";
import TopUpBalance from "@/components/TopUpBalance";

export default function BalanceModal({
  balance,
  workspaceId,
  email,
  onClose,
  onRefresh,
}: {
  balance: number;
  workspaceId: string;
  email?: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const { t } = useLanguage();
  const isLow = balance <= 0;

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-3 sm:p-6">
      <div className="bg-surface rounded-xl p-4 sm:p-5 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="text-base font-medium">{t("balance.title")}</span>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-line/40" aria-label="×">
            ×
          </button>
        </div>

        <div className={`rounded-lg px-3 py-3 mb-4 ${isLow ? "bg-rust/10" : "bg-paper"}`}>
          <div className="text-xs text-ink/50 mb-0.5">{t("balance.current")}</div>
          <div className={`text-2xl font-mono font-medium ${isLow ? "text-rust" : "text-oak"}`}>
            {formatMoney(balance)}
          </div>
          {isLow && <p className="text-xs text-rust mt-1">{t("balance.lowWarning")}</p>}
        </div>

        <TopUpBalance workspaceId={workspaceId} email={email} onSuccess={onRefresh} />
      </div>
    </div>
  );
}
