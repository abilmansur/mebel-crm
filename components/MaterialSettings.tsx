"use client";

import { Material } from "@/lib/types";

export default function MaterialSettings({
  materials,
  onClose,
  onChange,
}: {
  materials: Material[];
  onClose: () => void;
  onChange: (id: string, pricePerSqm: number) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-xl p-5 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="text-base font-medium">Материалы и цены</span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-line/40" aria-label="Закрыть">
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
        <p className="text-xs text-ink/40 mt-3">
          Цена за м² материала, наценка цеха уже учтена в смете.
        </p>
      </div>
    </div>
  );
}
