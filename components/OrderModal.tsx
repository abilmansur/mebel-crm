"use client";

import { useState, useMemo } from "react";
import { Material, Extra } from "@/lib/types";
import { calcOrderTotal } from "@/lib/calculator";
import { formatMoney } from "@/lib/format";

export default function OrderModal({
  materials,
  defaultClient,
  onClose,
  onSave,
}: {
  materials: Material[];
  defaultClient?: string;
  onClose: () => void;
  onSave: (data: {
    client: string;
    title: string;
    width: number;
    height: number;
    materialId: string;
    extras: Extra[];
    comment: string;
    price: number;
  }) => void;
}) {
  const [client, setClient] = useState(defaultClient || "");
  const [title, setTitle] = useState("");
  const [width, setWidth] = useState(2000);
  const [height, setHeight] = useState(2400);
  const [materialId, setMaterialId] = useState(materials[0]?.id || "");
  const [extras, setExtras] = useState<Extra[]>([]);
  const [comment, setComment] = useState("");

  const price = useMemo(() => {
    const material = materials.find((m) => m.id === materialId);
    return material ? calcOrderTotal(width, height, material, extras) : 0;
  }, [width, height, materialId, materials, extras]);

  function addExtra() {
    setExtras((prev) => [...prev, { id: crypto.randomUUID(), name: "", price: 0 }]);
  }

  function updateExtra(id: string, field: "name" | "price", value: string) {
    setExtras((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: field === "price" ? Number(value) : value } : e))
    );
  }

  function removeExtra(id: string) {
    setExtras((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-6 overflow-y-auto">
      <div className="bg-white rounded-xl p-5 w-full max-w-sm my-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-base font-medium">Новый заказ</span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-line/40" aria-label="Закрыть">
            ×
          </button>
        </div>

        <label className="text-sm text-ink/60">Клиент</label>
        <input
          className="w-full border border-line rounded-lg px-3 py-2 mb-3"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          placeholder="Иванов Александр"
        />

        <label className="text-sm text-ink/60">Изделие</label>
        <input
          className="w-full border border-line rounded-lg px-3 py-2 mb-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Шкаф-купе"
        />

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="text-sm text-ink/60">Ширина, мм</label>
            <input
              type="number"
              step={50}
              className="w-full border border-line rounded-lg px-3 py-2"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm text-ink/60">Высота, мм</label>
            <input
              type="number"
              step={50}
              className="w-full border border-line rounded-lg px-3 py-2"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
            />
          </div>
        </div>

        <label className="text-sm text-ink/60">Материал</label>
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

        <div className="flex justify-between items-center mb-2">
          <label className="text-sm text-ink/60">Фурнитура (петли, ручки, направляющие…)</label>
          <button type="button" onClick={addExtra} className="text-sm text-oak font-medium">
            + добавить
          </button>
        </div>

        {extras.length > 0 && (
          <div className="mb-3 space-y-2">
            {extras.map((extra) => (
              <div key={extra.id} className="flex gap-2 items-center">
                <input
                  className="flex-1 border border-line rounded-lg px-2.5 py-1.5 text-sm"
                  placeholder="Петли Blum"
                  value={extra.name}
                  onChange={(e) => updateExtra(extra.id, "name", e.target.value)}
                />
                <input
                  type="number"
                  className="w-24 border border-line rounded-lg px-2.5 py-1.5 text-sm"
                  placeholder="Цена"
                  value={extra.price || ""}
                  onChange={(e) => updateExtra(extra.id, "price", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeExtra(extra.id)}
                  className="w-7 h-7 shrink-0 rounded-lg hover:bg-rust/10 text-rust"
                  aria-label="Удалить позицию"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="text-sm text-ink/60">Комментарий</label>
        <textarea
          className="w-full border border-line rounded-lg px-3 py-2 mb-4 text-sm"
          rows={3}
          placeholder="Особые пожелания, детали замера, договорённости с клиентом…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="bg-paper rounded-lg px-3 py-2 mb-4 flex justify-between items-center">
          <span className="text-sm text-ink/60">Смета</span>
          <span className="font-mono font-medium text-oak">{formatMoney(price)}</span>
        </div>

        <button
          className="w-full bg-ink text-white rounded-lg py-2 font-medium"
          onClick={() =>
            onSave({
              client: client.trim() || "Без имени",
              title: title.trim() || "Заказ",
              width,
              height,
              materialId,
              extras: extras.filter((e) => e.name.trim()),
              comment: comment.trim(),
              price,
            })
          }
        >
          Создать заказ
        </button>
      </div>
    </div>
  );
}
