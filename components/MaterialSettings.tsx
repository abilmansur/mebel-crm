"use client";

import { useState } from "react";
import { Material } from "@/lib/types";
import { useLanguage } from "@/lib/LanguageContext";

export default function MaterialSettings({
  materials,
  onClose,
  onChange,
  onAdd,
}: {
  materials: Material[];
  onClose: () => void;
  onChange: (id: string, pricePerSqm: number) => void;
  onAdd: (data: { name: string; price_per_sqm: number; edge_per_m: number; markup_percent: number }) => void;
}) {
  const { t } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [pricePerSqm, setPricePerSqm] = useState(0);
  const [edgePerM, setEdgePerM] = useState(0);
  const [markupPercent, setMarkupPercent] = useState(30);

  function handleAdd() {
    if (!name.trim() || pricePerSqm <= 0) return;
    onAdd({ name: name.trim(), price_per_sqm: pricePerSqm, edge_per_m: edgePerM, markup_percent: markupPercent });
    setName("");
    setPricePerSqm(0);
    setEdgePerM(0);
    setMarkupPercent(30);
    setShowAddForm(false);
  }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-surface rounded-xl p-4 sm:p-5 w-full max-w-sm my-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-base font-medium">{t("materials.title")}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-line/40" aria-label="×">
            ×
          </button>
        </div>

        {materials.map((m) => (
          <div key={m.id} className="flex items-center gap-3 py-2 border-t border-line">
            <span className="flex-1 text-sm">{m.name}</span>
            <input
              type="number"
              className="w-24 border border-line rounded-lg px-2 py-1 text-sm"
              value={m.price_per_sqm}
              onChange={(e) => onChange(m.id, Number(e.target.value))}
            />
            <span className="text-xs text-ink/40">/м²</span>
          </div>
        ))}

        <p className="text-xs text-ink/40 mt-3 mb-3">{t("materials.note")}</p>

        {showAddForm ? (
          <div className="border border-line rounded-lg p-3 space-y-2">
            <input
              className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm"
              placeholder={t("materials.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-ink/50">{t("materials.pricePerSqm")}</label>
                <input
                  type="number"
                  className="w-full border border-line rounded-lg px-2 py-1.5 text-sm"
                  value={pricePerSqm || ""}
                  onChange={(e) => setPricePerSqm(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[11px] text-ink/50">{t("materials.edgePerM")}</label>
                <input
                  type="number"
                  className="w-full border border-line rounded-lg px-2 py-1.5 text-sm"
                  value={edgePerM || ""}
                  onChange={(e) => setEdgePerM(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[11px] text-ink/50">{t("materials.markup")}</label>
                <input
                  type="number"
                  className="w-full border border-line rounded-lg px-2 py-1.5 text-sm"
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                className="flex-1 bg-accent text-accent-ink rounded-lg py-1.5 text-sm font-medium"
                onClick={handleAdd}
              >
                {t("materials.add")}
              </button>
              <button
                className="px-3 border border-line rounded-lg text-sm"
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
            </div>
          </div>
        ) : (
          <button
            className="w-full border border-dashed border-line rounded-lg py-2 text-sm text-oak font-medium hover:bg-paper"
            onClick={() => setShowAddForm(true)}
          >
            + {t("materials.addNew")}
          </button>
        )}
      </div>
    </div>
  );
}
