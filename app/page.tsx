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
import Analytics from "@/components/Analytics";
import OrderModal from "@/components/OrderModal";
import MaterialSettings from "@/components/MaterialSettings";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/LanguageContext";

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [tab, setTab] = useState<"inbox" | "board" | "analytics">("inbox");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("Мебельный цех");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inbox, setInbox] = useState<InboxMessage[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefillClient, setPrefillClient] = useState<string | undefined>(undefined);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
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

      const workspace = await getOrCreateWorkspace(user.id, user.email?.split("@")[0] || "Мебельный цех");
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
          phone: o.phone || "",
          address: o.address || "",
          title: o.title,
          width_mm: o.width_mm,
          height_mm: o.height_mm,
          material_id: o.material_id,
          extras: (o.extras || []).map((e: any) => ({ ...e, quantity: e.quantity || 1 })),
          comment: o.comment || "",
          price: o.price,
          status: o.status,
          overdue: o.overdue,
          measurement_date: o.measurement_date || "",
          delivery_date: o.delivery_date || "",
          outcome: o.outcome || null,
        }))
      );
      setInbox(msgs || []);
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleSaveOrder(data: {
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
  }) {
    if (editingOrder) {
      const updated: Order = {
        ...editingOrder,
        client_name: data.client,
        phone: data.phone,
        address: data.address,
        title: data.title,
        width_mm: data.width,
        height_mm: data.height,
        material_id: data.materialId,
        extras: data.extras,
        comment: data.comment,
        price: data.price,
        measurement_date: data.measurementDate,
        delivery_date: data.deliveryDate,
      };
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setShowOrderModal(false);
      setEditingOrder(null);

      if (isSupabaseConfigured && supabase) {
        await supabase
          .from("orders")
          .update({
            client_name: updated.client_name,
            phone: updated.phone,
            address: updated.address,
            title: updated.title,
            width_mm: updated.width_mm,
            height_mm: updated.height_mm,
            material_id: updated.material_id,
            extras: updated.extras,
            comment: updated.comment,
            price: updated.price,
            measurement_date: updated.measurement_date || null,
            delivery_date: updated.delivery_date || null,
          })
          .eq("id", updated.id);
      }
      return;
    }

    const newOrder: Order = {
      id: crypto.randomUUID(),
      client_name: data.client,
      phone: data.phone,
      address: data.address,
      title: data.title,
      width_mm: data.width,
      height_mm: data.height,
      material_id: data.materialId,
      extras: data.extras,
      comment: data.comment,
      price: data.price,
      status: "new",
      overdue: false,
      measurement_date: data.measurementDate,
      delivery_date: data.deliveryDate,
      outcome: null,
    };

    setOrders((prev) => [...prev, newOrder]);
    setShowOrderModal(false);
    setTab("board");

    if (isSupabaseConfigured && supabase && workspaceId) {
      await supabase.from("orders").insert({
        ...newOrder,
        measurement_date: newOrder.measurement_date || null,
        delivery_date: newOrder.delivery_date || null,
        workspace_id: workspaceId,
      });
    }
  }

  async function handleMarkFailed() {
    if (!editingOrder) return;
    const orderId = editingOrder.id;
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "done" as Stage, outcome: "failed" as const } : o))
    );
    setShowOrderModal(false);
    setEditingOrder(null);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("orders").update({ status: "done", outcome: "failed" }).eq("id", orderId);
    }
  }

  async function handleDeleteOrder() {
    if (!editingOrder) return;
    const orderId = editingOrder.id;
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setShowOrderModal(false);
    setEditingOrder(null);
    if (isSupabaseConfigured && supabase) {
      await supabase.from("orders").delete().eq("id", orderId);
    }
  }

  function handleOrderClick(order: Order) {
    setEditingOrder(order);
    setShowOrderModal(true);
  }

  async function handleStatusChange(orderId: string, status: Stage) {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const outcome = status === "done" ? o.outcome || "success" : o.outcome;
        return { ...o, status, outcome };
      })
    );
    if (isSupabaseConfigured && supabase) {
      const order = orders.find((o) => o.id === orderId);
      const outcome = status === "done" ? order?.outcome || "success" : order?.outcome ?? null;
      await supabase.from("orders").update({ status, outcome }).eq("id", orderId);
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
    return <div className="p-8 text-sm text-ink/50">…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <span className="text-base font-medium">{workspaceName}</span>
        <div className="flex flex-wrap items-center gap-2">
          <LanguageSwitcher />
          <button
            className="w-9 h-9 border border-line rounded-lg flex items-center justify-center"
            onClick={() => setShowSettings(true)}
            aria-label={t("nav.settings")}
            title={t("nav.settings")}
          >
            ⚙
          </button>
          <button
            className="bg-ink text-white rounded-lg px-3 sm:px-4 py-2 text-sm font-medium whitespace-nowrap"
            onClick={() => {
              setPrefillClient(undefined);
              setEditingOrder(null);
              setShowOrderModal(true);
            }}
          >
            + {t("nav.newOrder")}
          </button>
          {isSupabaseConfigured && (
            <>
              <button
                onClick={() => router.push("/profile")}
                className="w-9 h-9 rounded-full bg-paper border border-line flex items-center justify-center text-sm font-medium"
                aria-label={t("nav.profile")}
                title={t("nav.profile")}
              >
                {workspaceName.charAt(0).toUpperCase()}
              </button>
              <button
                className="w-9 h-9 border border-line rounded-lg flex items-center justify-center text-sm"
                onClick={handleLogout}
                aria-label={t("nav.logout")}
                title={t("nav.logout")}
              >
                ⏻
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        <button
          className={`px-3.5 py-2 rounded-lg text-sm whitespace-nowrap ${tab === "inbox" ? "bg-paper font-medium" : "text-ink/50"}`}
          onClick={() => setTab("inbox")}
        >
          {t("nav.inbox")} {inbox.length > 0 && `(${inbox.length})`}
        </button>
        <button
          className={`px-3.5 py-2 rounded-lg text-sm whitespace-nowrap ${tab === "board" ? "bg-paper font-medium" : "text-ink/50"}`}
          onClick={() => setTab("board")}
        >
          {t("nav.board")}
        </button>
        <button
          className={`px-3.5 py-2 rounded-lg text-sm whitespace-nowrap ${tab === "analytics" ? "bg-paper font-medium" : "text-ink/50"}`}
          onClick={() => setTab("analytics")}
        >
          {t("nav.analytics")}
        </button>
      </div>

      {tab === "inbox" && <Inbox messages={inbox} onConvert={handleConvertMessage} />}
      {tab === "board" && (
        <Board orders={orders} onStatusChange={handleStatusChange} onOrderClick={handleOrderClick} />
      )}
      {tab === "analytics" && <Analytics orders={orders} />}

      {showOrderModal && (
        <OrderModal
          materials={materials}
          defaultClient={prefillClient}
          initialOrder={editingOrder || undefined}
          onClose={() => {
            setShowOrderModal(false);
            setEditingOrder(null);
          }}
          onSave={handleSaveOrder}
          onDelete={editingOrder ? handleDeleteOrder : undefined}
          onMarkFailed={editingOrder ? handleMarkFailed : undefined}
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
