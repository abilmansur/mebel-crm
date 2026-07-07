"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getOrCreateWorkspace } from "@/lib/workspace";
import { Material, Order, InboxMessage, Stage, Extra, AIConfig, AIPhoto } from "@/lib/types";
import { calcOrderTotal } from "@/lib/calculator";
import { demoMaterials, buildDemoOrders, demoInbox } from "@/lib/demoData";
import { Conversation, buildConversations, countUnreadConversations } from "@/lib/conversations";
import Inbox from "@/components/Inbox";
import Board from "@/components/Board";
import Analytics from "@/components/Analytics";
import OrderModal from "@/components/OrderModal";
import MaterialSettings from "@/components/MaterialSettings";
import AIAssistantSettings from "@/components/AIAssistantSettings";
import ConversationThread from "@/components/ConversationThread";
import ChannelsSettings from "@/components/ChannelsSettings";
import BalanceModal from "@/components/BalanceModal";
import { formatMoney } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

const emptyAIConfig: AIConfig = {
  bot_name: "",
  description: "",
  prompt: "",
  knowledge_base: "",
  provider: "anthropic",
  auto_reply: false,
};
const INBOX_POLL_INTERVAL_MS = 8000;

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [tab, setTab] = useState<"inbox" | "board" | "analytics" | "channels">("inbox");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("Мебельный цех");
  const [balance, setBalance] = useState(0);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [showBalance, setShowBalance] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inbox, setInbox] = useState<InboxMessage[]>([]);
  const [aiConfig, setAIConfig] = useState<AIConfig>(emptyAIConfig);
  const [aiPhotos, setAIPhotos] = useState<AIPhoto[]>([]);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [sendingReply, setSendingReply] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefillClient, setPrefillClient] = useState<string | undefined>(undefined);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [newOrderStage, setNewOrderStage] = useState<Stage>("new");
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
      setUserEmail(user.email || undefined);

      const workspace = await getOrCreateWorkspace(user.id, user.email?.split("@")[0] || "Мебельный цех");
      if (!workspace) {
        setLoading(false);
        return;
      }
      setWorkspaceId(workspace.id);
      setWorkspaceName(workspace.name);
      setBalance(workspace.balance || 0);

      const [{ data: mats }, { data: ords }, { data: msgs }, { data: aiCfg }, { data: photos }] = await Promise.all([
        supabase.from("materials").select("*").eq("workspace_id", workspace.id),
        supabase.from("orders").select("*").eq("workspace_id", workspace.id),
        supabase.from("inbox_messages").select("*").eq("workspace_id", workspace.id),
        supabase.from("ai_config").select("*").eq("workspace_id", workspace.id).maybeSingle(),
        supabase.from("ai_photos").select("*").eq("workspace_id", workspace.id),
      ]);

      if (aiCfg) {
        setAIConfig({
          bot_name: aiCfg.bot_name || "",
          description: aiCfg.description || "",
          prompt: aiCfg.prompt || "",
          knowledge_base: aiCfg.knowledge_base || "",
          provider: aiCfg.provider === "openai" ? "openai" : "anthropic",
          auto_reply: aiCfg.auto_reply || false,
        });
      }
      setAIPhotos(photos || []);

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

  // Автообновление инбокса — без этого новые сообщения появлялись только после ручного обновления страницы
  useEffect(() => {
    if (!isSupabaseConfigured || !workspaceId) return;
    const interval = setInterval(() => {
      handleRefreshInbox();
      handleRefreshBalance();
    }, INBOX_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  // Если открыт диалог и в инбокс пришли новые сообщения этого чата — обновляем открытое окно тоже
  useEffect(() => {
    if (!activeConversation) return;
    const updated = buildConversations(inbox).find((c) => c.key === activeConversation.key);
    if (updated && updated.messages.length !== activeConversation.messages.length) {
      setActiveConversation(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inbox]);

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
      status: newOrderStage,
      overdue: false,
      measurement_date: data.measurementDate,
      delivery_date: data.deliveryDate,
      outcome: newOrderStage === "done" ? "success" : null,
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

  function handleAddAtStage(stage: Stage) {
    setPrefillClient(undefined);
    setEditingOrder(null);
    setNewOrderStage(stage);
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

  async function handleUpdateMaterial(materialId: string, data: Partial<Omit<Material, "id">>) {
    const updatedMaterials = materials.map((m) => (m.id === materialId ? { ...m, ...data } : m));
    setMaterials(updatedMaterials);
    setOrders((prev) =>
      prev.map((o) => {
        const material = updatedMaterials.find((m) => m.id === o.material_id);
        return material ? { ...o, price: calcOrderTotal(o.width_mm, o.height_mm, material, o.extras) } : o;
      })
    );
    if (isSupabaseConfigured && supabase) {
      await supabase.from("materials").update(data).eq("id", materialId);
    }
  }

  async function handleDeleteMaterial(materialId: string) {
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("materials").delete().eq("id", materialId);
    }
  }

  async function handleAddMaterial(data: {
    name: string;
    price_per_sqm: number;
    edge_per_m: number;
    markup_percent: number;
  }) {
    if (isSupabaseConfigured && supabase && workspaceId) {
      const { data: created } = await supabase
        .from("materials")
        .insert({ ...data, workspace_id: workspaceId })
        .select()
        .single();
      if (created) setMaterials((prev) => [...prev, created as Material]);
    } else {
      setMaterials((prev) => [...prev, { id: crypto.randomUUID(), ...data }]);
    }
  }

  async function handleRefreshInbox() {
    if (!isSupabaseConfigured || !supabase || !workspaceId) return;
    const { data: msgs } = await supabase
      .from("inbox_messages")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    setInbox(msgs || []);
  }

  async function handleOpenConversation(conversation: Conversation) {
    setActiveConversation(conversation);

    const unreadIds = conversation.messages.filter((m) => m.direction === "in" && !m.read).map((m) => m.id);
    if (unreadIds.length === 0) return;

    setInbox((prev) => prev.map((m) => (unreadIds.includes(m.id) ? { ...m, read: true } : m)));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("inbox_messages").update({ read: true }).in("id", unreadIds);
    }
  }

  async function handleSendReply(text: string) {
    if (!activeConversation || !supabase || !workspaceId) return;
    setSendingReply(true);

    // Оптимистично показываем сообщение сразу, не дожидаясь ответа сервера
    const optimisticMsg: InboxMessage = {
      id: crypto.randomUUID(),
      channel: "telegram",
      chat_id: activeConversation.chatId,
      direction: "out",
      read: true,
      client_name: activeConversation.clientName,
      text,
      ai_suggestion: "",
    };
    setInbox((prev) => [...prev, optimisticMsg]);
    setActiveConversation((prev) => (prev ? { ...prev, messages: [...prev.messages, optimisticMsg] } : prev));

    const {
      data: { session },
    } = await supabase.auth.getSession();

    try {
      await fetch("/api/send-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          workspaceId,
          chatId: activeConversation.chatId,
          text,
          clientName: activeConversation.clientName,
        }),
      });
    } catch (err) {
      console.error("Не удалось отправить ответ:", err);
    }
    setSendingReply(false);
  }

  function handleCreateOrderFromConversation() {
    if (!activeConversation) return;
    setPrefillClient(activeConversation.clientName);
    setEditingOrder(null);
    setNewOrderStage("new");
    setActiveConversation(null);
    setShowOrderModal(true);
  }

  async function handleSaveAIConfig(data: AIConfig) {
    setAIConfig(data);
    setShowAIAssistant(false);
    if (isSupabaseConfigured && supabase && workspaceId) {
      await supabase.from("ai_config").upsert({ workspace_id: workspaceId, ...data });
    }
  }

  async function handleAddPhoto(data: { keywords: string; image_url: string; caption: string }) {
    if (isSupabaseConfigured && supabase && workspaceId) {
      const { data: created } = await supabase
        .from("ai_photos")
        .insert({ ...data, workspace_id: workspaceId })
        .select()
        .single();
      if (created) setAIPhotos((prev) => [...prev, created as AIPhoto]);
    } else {
      setAIPhotos((prev) => [...prev, { id: crypto.randomUUID(), ...data }]);
    }
  }

  async function handleDeletePhoto(id: string) {
    setAIPhotos((prev) => prev.filter((p) => p.id !== id));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("ai_photos").delete().eq("id", id);
    }
  }

  async function handleRefreshBalance() {
    if (!isSupabaseConfigured || !supabase || !workspaceId) return;
    const { data } = await supabase.from("workspaces").select("balance").eq("id", workspaceId).maybeSingle();
    if (data) setBalance(data.balance || 0);
  }

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return <div className="p-8 text-sm text-ink/50">…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <span className="text-base font-medium">{workspaceName}</span>
        <div className="flex flex-wrap items-center gap-2">
          {isSupabaseConfigured && (
            <button
              onClick={() => setShowBalance(true)}
              className={`h-9 px-3 rounded-lg border text-sm font-mono font-medium whitespace-nowrap ${
                balance <= 0 ? "border-rust/40 text-rust bg-rust/5" : "border-line"
              }`}
              title={t("balance.title")}
            >
              {formatMoney(balance)}
            </button>
          )}
          <button
            className="w-9 h-9 border border-line rounded-lg flex items-center justify-center"
            onClick={() => setShowSettings(true)}
            aria-label={t("nav.settings")}
            title={t("nav.settings")}
          >
            ⚙
          </button>
          <button
            className="w-9 h-9 border border-line rounded-lg flex items-center justify-center"
            onClick={() => setShowAIAssistant(true)}
            aria-label={t("nav.aiAssistant")}
            title={t("nav.aiAssistant")}
          >
            🤖
          </button>
          <button
            className="bg-accent text-accent-ink rounded-lg px-3 sm:px-4 py-2 text-sm font-medium whitespace-nowrap"
            onClick={() => {
              setPrefillClient(undefined);
              setEditingOrder(null);
              setNewOrderStage("new");
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
          {t("nav.inbox")} {countUnreadConversations(inbox) > 0 && `(${countUnreadConversations(inbox)})`}
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
        <button
          className={`px-3.5 py-2 rounded-lg text-sm whitespace-nowrap ${tab === "channels" ? "bg-paper font-medium" : "text-ink/50"}`}
          onClick={() => setTab("channels")}
        >
          {t("nav.channels")}
        </button>
      </div>

      {tab === "inbox" && (
        <Inbox messages={inbox} onOpenConversation={handleOpenConversation} onRefresh={handleRefreshInbox} />
      )}
      {tab === "board" && (
        <Board
          orders={orders}
          onStatusChange={handleStatusChange}
          onOrderClick={handleOrderClick}
          onAddAtStage={handleAddAtStage}
        />
      )}
      {tab === "analytics" && <Analytics orders={orders} />}
      {tab === "channels" && <ChannelsSettings workspaceId={workspaceId} />}

      {showOrderModal && (
        <OrderModal
          materials={materials}
          defaultClient={prefillClient}
          initialOrder={editingOrder || undefined}
          presetStage={newOrderStage}
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
          onUpdate={handleUpdateMaterial}
          onAdd={handleAddMaterial}
          onDelete={handleDeleteMaterial}
        />
      )}

      {showAIAssistant && (
        <AIAssistantSettings
          config={aiConfig}
          photos={aiPhotos}
          onClose={() => setShowAIAssistant(false)}
          onSave={handleSaveAIConfig}
          onAddPhoto={handleAddPhoto}
          onDeletePhoto={handleDeletePhoto}
        />
      )}

      {activeConversation && (
        <ConversationThread
          conversation={activeConversation}
          onClose={() => setActiveConversation(null)}
          onSend={handleSendReply}
          onCreateOrder={handleCreateOrderFromConversation}
          sending={sendingReply}
        />
      )}

      {showBalance && workspaceId && (
        <BalanceModal
          balance={balance}
          workspaceId={workspaceId}
          email={userEmail}
          onClose={() => setShowBalance(false)}
          onRefresh={handleRefreshBalance}
        />
      )}
    </div>
  );
}
