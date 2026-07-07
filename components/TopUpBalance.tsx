"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

const PUBLIC_ID = process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID;

declare global {
  interface Window {
    cp?: any;
  }
}

function loadCloudPaymentsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.cp) return resolve();
    const script = document.createElement("script");
    script.src = "https://widget.cloudpayments.ru/bundles/cloudpayments.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Не удалось загрузить виджет оплаты"));
    document.body.appendChild(script);
  });
}

export default function TopUpBalance({
  workspaceId,
  email,
  onSuccess,
}: {
  workspaceId: string;
  email?: string;
  onSuccess: () => void;
}) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(2000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!PUBLIC_ID || amount <= 0) return;
    setLoading(true);
    setError(null);
    try {
      await loadCloudPaymentsScript();
      const widget = new window.cp!.CloudPayments();
      widget.charge(
        {
          publicId: PUBLIC_ID,
          description: t("balance.topupDescription"),
          amount,
          currency: "KZT",
          accountId: workspaceId,
          email: email || undefined,
        },
        () => {
          setLoading(false);
          // Реальное зачисление баланса происходит на сервере по вебхуку от CloudPayments,
          // это может занять пару секунд — обновляем баланс с небольшой задержкой
          setTimeout(onSuccess, 2000);
        },
        () => {
          setLoading(false);
          setError(t("balance.paymentFailed"));
        }
      );
    } catch {
      setLoading(false);
      setError(t("balance.widgetLoadError"));
    }
  }

  if (!PUBLIC_ID) {
    return <p className="text-xs text-ink/40">{t("balance.notConfigured")}</p>;
  }

  return (
    <div>
      <label className="text-sm text-ink/60 block mb-1">{t("balance.amount")}</label>
      <input
        type="number"
        min={100}
        step={100}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="w-full border border-line rounded-lg px-3 py-2 mb-2"
      />
      <div className="flex gap-2 mb-3">
        {[1000, 2000, 5000, 10000].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(v)}
            className="flex-1 border border-line rounded-lg py-1 text-xs hover:bg-paper"
          >
            {v.toLocaleString("ru-RU")}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handlePay}
        disabled={loading || amount <= 0}
        className="w-full bg-accent text-accent-ink rounded-lg py-2.5 font-medium disabled:opacity-50"
      >
        {loading ? t("balance.processing") : t("balance.topupBtn")}
      </button>
      {error && <p className="text-xs text-rust mt-2">{error}</p>}
    </div>
  );
}
