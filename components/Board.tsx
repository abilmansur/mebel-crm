"use client";

import { useState } from "react";
import { Order, Stage, STAGES } from "@/lib/types";
import { formatMoney } from "@/lib/format";

export default function Board({
  orders,
  onStatusChange,
  onOrderClick,
}: {
  orders: Order[];
  onStatusChange: (orderId: string, stage: Stage) => void;
  onOrderClick: (order: Order) => void;
}) {
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {STAGES.map((stage) => {
        const list = orders.filter((o) => o.status === stage.id);
        return (
          <div key={stage.id} className="min-w-[170px] flex-none">
            <div className="flex justify-between text-sm font-medium text-ink/60 px-1 pb-2">
              <span>{stage.label}</span>
              <span>{list.length}</span>
            </div>
            <div
              className={`min-h-[70px] rounded-lg transition-colors ${
                dragOverStage === stage.id ? "bg-oak/10" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(stage.id);
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStage(null);
                const orderId = e.dataTransfer.getData("text/plain");
                onStatusChange(orderId, stage.id);
              }}
            >
              {list.map((order) => (
                <div
                  key={order.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", order.id)}
                  onClick={() => onOrderClick(order)}
                  className="bg-white border border-line rounded-xl p-3 mb-2.5 cursor-grab active:cursor-grabbing hover:border-oak/50 transition-colors"
                >
                  <div className="text-sm font-medium mb-0.5">{order.client_name}</div>
                  <div className="text-xs text-ink/60 mb-1.5">{order.title}</div>
                  <div className="font-mono text-xs text-ink/40">
                    {order.width_mm}×{order.height_mm} мм
                  </div>
                  {(order.extras.length > 0 || order.comment) && (
                    <div className="flex gap-2 mt-1 text-[11px] text-ink/40">
                      {order.extras.length > 0 && <span>🔩 {order.extras.length}</span>}
                      {order.comment && <span title={order.comment}>💬</span>}
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="font-mono text-sm font-medium text-oak">
                      {formatMoney(order.price)}
                    </span>
                    {order.overdue && (
                      <span className="text-[11px] bg-rust/10 text-rust rounded px-1.5 py-0.5">
                        просрочен
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
