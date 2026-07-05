"use client";

import { useState, useMemo } from "react";
import {
  Material,
  Extra,
  Order,
  Stage,
  isMeasurementDateRelevant,
  isDeliveryDateEditable,
  canMarkAsFailed,
} from "@/lib/types";
import { calcOrderTotal, calcExtrasTotal } from "@/lib/calculator";
import { formatMoney } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

export default function OrderModal({
  materials,
  defaultClient,
  initialOrder,
  onClose,
  onSave,
  onDelete,
  onMarkFailed,
}: {
  materials: Material[];
  defaultClient?: string;
  initialOrder?: Order;
  onClose: () => void;
  onSave: (data: {
    client: string;
    phone: string;
    address: string;
    title: string;
    width: number;
    height: number;
    materialId: string;
    extras: Extra[];
    comment: string;
    price: number;
    measurementDate: string;
    deliveryDate: string;
  }) => void;
  onDelete?: () => void;
  onMarkFailed?: () => void;
}) {
  const { t } = useLanguage();
  const isEditing = Boolean(initialOrder);
  const currentStatus: Stage = initialOrder?.status || "new";

  const [client, setClient] = useState(initialOrder?.client_name || defaultClient || "");
  const [phone, setPhone] = useState(initialOrder?.phone || "");
  const [address, setAddress] = useState(initialOrder?.address || "");
  const [title, setTitle] = useState(initialOrder?.title || "");
  const [width, setWidth] = useState(initialOrder?.width_mm || 2000);
  const [height, setHeight] = useState(initialOrder?.height_mm || 2400);
  const [materialId, setMaterialId] = useState(initialOrder?.material_id || materials[0]?.id || "");
  const [extras, setExtras] = useState<Extra[]>(initialOrder?.extras || []);
  const [comment, setComment] = useState(initialOrder?.comment || "");
  const [measurementDate, setMeasurementDate] = useState(initialOrder?.measurement_date || "");
  const [deliveryDate, setDeliveryDate] = useState(initialOrder?.delivery_date || "");

  const price = useMemo(() => {
    const material = materials.find((m) => m.id === materialId);
    return material ? calcOrderTotal(width, height, material, extras) : 0;
  }, [width, height, materialId, materials, extras]);

  const extrasTotal = calcExtrasTotal(extras);

  function addExtra() {
    setExtras((prev) => [...prev, { id: crypto.randomUUID(), name: "", price: 0, quantity: 1 }]);
  }

  function updateExtra(id: string, field: "name" | "price" | "quantity", value: string) {
    setExtras((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: field === "name" ? value : Number(value) } : e))
    );
  }

  function removeExtra(id: string) {
    setExtras((prev) => prev.filter((e) => e.id !== id));
  }

  const showMeasurementDate = isMeasurementDateRelevant(currentStatus);
  const showDeliveryDate = isDeliveryDateEditable(currentStatus);

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl p-4 sm:p-5 w-full max-w-sm my-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-base font-medium">{isEditing ? t("modal.order") : t("modal.newOrder")}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-line/40 shrink-0" aria-label="×">
            ×
          </button>
        </div>

        <label className="text-sm text-ink/60">{t("modal.client")}</label>
        <input
          className="w-full border border-line rounded-lg px-3 py-2 mb-3"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          placeholder="Иванов Александр"
        />

        <label className="text-sm text-ink/60">{t("modal.phone")}</label>
        <input
          className="w-full border border-line rounded-lg px-3 py-2 mb-3"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 700 000 00 00"
        />

        <label className="text-sm text-ink/60">{t("modal.address")}</label>
        <input
          className="w-full border border-line rounded-lg px-3 py-2 mb-3"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="г. Астана, ул. Примерная, 12, кв. 5"
        />

        <label className="text-sm text-ink/60">{t("modal.product")}</label>
        <input
          className="w-full border border-line rounded-lg px-3 py-2 mb-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Шкаф-купе"
        />

        {(showMeasurementDate || showDeliveryDate) && (
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            {showMeasurementDate && (
              <div className="flex-1">
                <label className="text-sm text-ink/60">{t("modal.measurementDate")}</label>
                <input
                  type="date"
                  className="w-full border border-line rounded-lg px-3 py-2"
                  value={measurementDate}
                  onChange={(e) => setMeasurementDate(e.target.value)}
                />
              </div>
            )}
            {showDeliveryDate && (
              <div className="flex-1">
                <label className="text-sm text-ink/60">{t("modal.deliveryDate")}</label>
                <input
                  type="date"
                  className="w-full border border-line rounded-lg px-3 py-2"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="text-sm text-ink/60">{t("modal.width")}</label>
            <input
              type="number"
              step={50}
              className="w-full border border-line rounded-lg px-3 py-2"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm text-ink/60">{t("modal.height")}</label>
            <input
              type="number"
              step={50}
              className="w-full border border-line rounded-lg px-3 py-2"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
            />
          </div>
        </div>

        <label className="text-sm text-ink/60">{t("modal.material")}</label>
        <select
          className="w-full border border-line rounded-lg px-3 py-2 mb-4"
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value)}
        >
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <div className="flex justify-between items-center mb-2 gap-2">
          <label className="text-sm text-ink/60">{t("modal.extras")}</label>
          <button type="button" onClick={addExtra} className="text-sm text-oak font-medium shrink-0">
            + {t("modal.addExtra")}
          </button>
        </div>

        {/* Каждая позиция фурнитуры — отдельная карточка: название на всю ширину сверху,
            количество/цена/сумма/удаление в строке снизу. Так не вылезает за границы на узких экранах. */}
        {extras.length > 0 && (
          <div className="mb-2 space-y-2">
            {extras.map((extra) => (
              <div key={extra.id} className="border border-line rounded-lg p-2.5">
                <input
                  className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm mb-2"
                  placeholder="Петли Blum"
                  value={extra.name}
                  onChange={(e) => updateExtra(extra.id, "name", e.target.value)}
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    className="w-12 border border-line rounded-lg px-1.5 py-1.5 text-sm text-center shrink-0"
                    value={extra.quantity || 1}
                    onChange={(e) => updateExtra(extra.id, "quantity", e.target.value)}
                    title={t("modal.qty")}
                  />
                  <span className="text-ink/30 text-xs shrink-0">×</span>
                  <input
                    type="number"
                    className="w-0 flex-1 min-w-0 border border-line rounded-lg px-2 py-1.5 text-sm"
                    placeholder={t("modal.pricePerUnit")}
                    value={extra.price || ""}
                    onChange={(e) => updateExtra(extra.id, "price", e.target.value)}
                  />
                  <span className="text-xs font-mono text-ink/50 shrink-0 whitespace-nowrap">
                    {formatMoney((extra.price || 0) * (extra.quantity || 1))}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExtra(extra.id)}
                    className="w-6 h-6 shrink-0 rounded-lg hover:bg-rust/10 text-rust text-sm"
                    aria-label="×"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {extras.length > 0 && (
          <div className="text-xs text-ink/50 mb-3 text-right">
            {t("modal.extrasTotal")}: {formatMoney(extrasTotal)}
          </div>
        )}

        <label className="text-sm text-ink/60">{t("modal.comment")}</label>
        <textarea
          className="w-full border border-line rounded-lg px-3 py-2 mb-4 text-sm"
          rows={3}
          placeholder={t("modal.commentPlaceholder")}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="bg-paper rounded-lg px-3 py-2 mb-4 flex justify-between items-center">
          <span className="text-sm text-ink/60">{t("modal.total")}</span>
          <span className="font-mono font-medium text-oak">{formatMoney(price)}</span>
        </div>

        <div className="flex gap-2 mb-2">
          {isEditing && onDelete && (
            <button
              className="border border-rust/30 text-rust rounded-lg px-4 py-2 font-medium shrink-0"
              onClick={onDelete}
            >
              {t("modal.delete")}
            </button>
          )}
          <button
            className="flex-1 bg-ink text-white rounded-lg py-2 font-medium"
            onClick={() =>
              onSave({
                client: client.trim() || "—",
                phone: phone.trim(),
                address: address.trim(),
                title: title.trim() || "—",
                width,
                height,
                materialId,
                extras: extras.filter((e) => e.name.trim()),
                comment: comment.trim(),
                price,
                measurementDate,
                deliveryDate,
              })
            }
          >
            {isEditing ? t("modal.saveChanges") : t("modal.createOrder")}
          </button>
        </div>

        {isEditing && onMarkFailed && canMarkAsFailed(currentStatus) && (
          <button className="w-full text-sm text-rust/80 hover:text-rust py-1" onClick={onMarkFailed}>
            {t("modal.markFailed")}
          </button>
        )}
      </div>
    </div>
  );
}
