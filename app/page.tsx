"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getOrCreateWorkspace } from "@/lib/workspace";
import { Material, Order, InboxMessage, Stage, Extra } from "@/lib/types";
import { calcOrderTotal } from "@/lib/calculator";
import { demoMaterials, buildDemoOrders, demoInbox } from "@/lib/demoData";
import Inbox from "@/components/Inbox";
import Board from "@/components/Board";
import OrderModal from "@/components/OrderModal";
import MaterialSettings from "@/components/MaterialSettings";

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<"inbox" | "board">("inbox");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("Мой цех");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inbox, setInbox] = useState<InboxMessage[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefillClient, setPrefillClient] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // Демо-режим: без Supabase, без авторизации, чтобы можно было сразу показать клиенту
      if (!isSupabaseConfigured || !supabase) {
        setMaterials(demoMaterials);
        setOrders(buildDemoOrders(demoMaterials));
        setInbox(demoInbox);
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const workspace = await getOrCreateWorkspace(user.id, user.email?.split("@")[0] || "Мой цех");
      if (!workspace) {
        setLoading(false);
        return;
      }
      setWorkspaceId(workspace.id);
      setWorkspaceName(workspace.name);

      const [{ data: mats }, { data: ords }, { data: msgs }] = await Promise.all([
        supabase.from("materials").select("*").eq("workspace_id", workspace.id),
        supabase.from("orders").select("*").eq("workspace_id", workspace.id),
        supabase.from("inbox_messages").select("*").eq("workspace_id", workspace.id),
      ]);

      const loadedMaterials = mats && mats.length ? mats : demoMaterials;
      setMaterials(loadedMaterials);
      setOrders(
        (ords || []).map((o: any) => ({
          id: o.id,
          client_name: o.client_name,
          title: o.title,
          width_mm: o.width_mm,
          height_mm: o.height_mm,
          material_id: o.material_id,
          extras: o.extras || [],
          comment: o.comment || "",
          price: o.price,
          status: o.status,
          overdue: o.overdue,
        }))
      );
      setInbox(msgs || []);
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleSaveOrder(data: {
    client: string;
    title: string;
    width: number;
    height: number;
    materialId: string;
    extras: Extra[];
    comment: string;
    price: number;
  }) {
    const newOrder: Order = {
      id: crypto.randomUUID(),
      client_name: data.client,
      title: data.title,
      width_mm: data.width,
      height_mm: data.height,
      material_id: data.materialId,
      extras: data.extras,
      comment: data.comment,
      price: data.price,
      status: "new",
      overdue: false,
    };

    setOrders((prev) => [...prev, newOrder]);
    setShowOrderModal(false);
    setTab("board");

    if (isSupabaseConfigured && supabase && workspaceId) {
      await supabase.from("orders").insert({ ...newOrder, workspace_id: workspaceId });
    }
  }

  async function handleStatusChange(orderId: string, status: Stage) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("orders").update({ status }).eq("id", orderId);
    }
  }

  async function handleMaterialPriceChange(materialId: string, pricePerSqm: number) {
    const updatedMaterials = materials.map((m) =>
      m.id === materialId ? { ...m, price_per_sqm: pricePerSqm } : m
    );
    setMaterials(updatedMaterials);
    setOrders((prev) =>
      prev.map((o) => {
        const material = updatedMaterials.find((m) => m.id === o.material_id);
        return material ? { ...o, price: calcOrderTotal(o.width_mm, o.height_mm, material, o.extras) } : o;
      })
    );
    if (isSupabaseConfigured && supabase) {
      await supabase.from("materials").update({ price_per_sqm: pricePerSqm }).eq("id", materialId);
    }
  }

  async function handleConvertMessage(msg: InboxMessage) {
    setInbox((prev) => prev.filter((m) => m.id !== msg.id));
    setPrefillClient(msg.client_name);
    setShowOrderModal(true);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("inbox_messages").delete().eq("id", msg.id);
    }
  }

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return <div className="p-8 text-sm text-ink/50">Загрузка…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-base font-medium">{workspaceName}</span>
        <div className="flex gap-2">
          <button
            className="w-9 h-9 border border-line rounded-lg flex items-center justify-center"
            onClick={() => setShowSettings(true)}
            aria-label="Настройки материалов"
          >
            ⚙
          </button>
          <button
            className="bg-ink text-white rounded-lg px-4 py-2 text-sm font-medium"
            onClick={() => {
              setPrefillClient(undefined);
              setShowOrderModal(true);
            }}
          >
            + Новый заказ
          </button>
          {isSupabaseConfigured && (
            <button
              className="w-9 h-9 border border-line rounded-lg flex items-center justify-center text-sm"
              onClick={handleLogout}
              aria-label="Выйти"
              title="Выйти"
            >
              ⏻
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        <button
          className={`px-3.5 py-2 rounded-lg text-sm ${tab === "inbox" ? "bg-paper font-medium" : "text-ink/50"}`}
          onClick={() => setTab("inbox")}
        >
          Входящие {inbox.length > 0 && `(${inbox.length})`}
        </button>
        <button
          className={`px-3.5 py-2 rounded-lg text-sm ${tab === "board" ? "bg-paper font-medium" : "text-ink/50"}`}
          onClick={() => setTab("board")}
        >
          Доска заказов
        </button>
      </div>

      {tab === "inbox" ? (
        <Inbox messages={inbox} onConvert={handleConvertMessage} />
      ) : (
        <Board orders={orders} onStatusChange={handleStatusChange} />
      )}

      {showOrderModal && (
        <OrderModal
          materials={materials}
          defaultClient={prefillClient}
          onClose={() => setShowOrderModal(false)}
          onSave={handleSaveOrder}
        />
      )}

      {showSettings && (
        <MaterialSettings
          materials={materials}
          onClose={() => setShowSettings(false)}
          onChange={handleMaterialPriceChange}
        />
      )}
    </div>
  );
}
