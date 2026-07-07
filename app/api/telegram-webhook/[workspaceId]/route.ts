import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateLLMReply, LLMProvider } from "@/lib/llm";
import { calculateCostKzt } from "@/lib/pricing";
import { findMatchingPhoto } from "@/lib/photoMatch";

export async function POST(req: NextRequest, { params }: { params: { workspaceId: string } }) {
  const workspaceId = params.workspaceId;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "supabase not configured" }, { status: 500 });
  }

  const { data: botCfg } = await supabaseAdmin
    .from("telegram_bots")
    .select("bot_token, webhook_secret")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!botCfg) return NextResponse.json({ error: "bot not connected" }, { status: 404 });

  const headerToken = req.headers.get("x-telegram-bot-api-secret-token");
  if (headerToken !== botCfg.webhook_secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  async function sendTelegramMessage(chatId: number, text: string) {
    try {
      await fetch(`https://api.telegram.org/bot${botCfg!.bot_token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    } catch (err) {
      console.error("Не удалось отправить сообщение в Telegram:", err);
    }
  }

  async function sendTelegramPhoto(chatId: number, photoUrl: string, caption: string) {
    try {
      await fetch(`https://api.telegram.org/bot${botCfg!.bot_token}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption: caption || undefined }),
      });
    } catch (err) {
      console.error("Не удалось отправить фото в Telegram:", err);
    }
  }

  const update = await req.json();
  const message = update?.message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId: number | undefined = message.chat?.id;
  const text: string = (message.text || "").trim();
  const clientName: string = message.from?.first_name || message.from?.username || "Telegram клиент";

  if (!chatId) return NextResponse.json({ ok: true });

  if (text.startsWith("/start")) {
    const { data: workspace } = await supabaseAdmin.from("workspaces").select("name").eq("id", workspaceId).maybeSingle();
    await sendTelegramMessage(
      chatId,
      `Здравствуйте! Вы на связи с «${workspace?.name || "нами"}». Напишите ваш вопрос — мастер увидит его в CRM и ответит вам здесь.`
    );
    return NextResponse.json({ ok: true });
  }

  if (!text) return NextResponse.json({ ok: true });

  const { data: insertedMsg } = await supabaseAdmin
    .from("inbox_messages")
    .insert({
      workspace_id: workspaceId,
      channel: "telegram",
      chat_id: chatId,
      direction: "in",
      client_name: clientName,
      text,
      ai_suggestion: "",
    })
    .select()
    .single();

  // Подходящее фото отправляем независимо от баланса и режима ИИ — низкорисковое действие
  const { data: photos } = await supabaseAdmin.from("ai_photos").select("*").eq("workspace_id", workspaceId);
  const matchedPhoto = photos?.length ? findMatchingPhoto(text, photos as any) : null;
  if (matchedPhoto) {
    await sendTelegramPhoto(chatId, matchedPhoto.image_url, matchedPhoto.caption);
  }

  const { data: workspace } = await supabaseAdmin
    .from("workspaces")
    .select("balance")
    .eq("id", workspaceId)
    .maybeSingle();

  const { data: aiConfig } = await supabaseAdmin
    .from("ai_config")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const hasBalance = (workspace?.balance ?? 0) > 0;

  if (aiConfig?.prompt?.trim() && hasBalance) {
    const { data: history } = await supabaseAdmin
      .from("inbox_messages")
      .select("text, direction")
      .eq("chat_id", chatId)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true })
      .limit(20);

    const conversationHistory = (history || []).map((m) => ({
      role: m.direction === "out" ? ("assistant" as const) : ("user" as const),
      content: m.text,
    }));

    const systemPrompt = aiConfig.knowledge_base?.trim()
      ? `${aiConfig.prompt}\n\n---\nБаза знаний (факты о цехе, используй для ответов):\n${aiConfig.knowledge_base}`
      : aiConfig.prompt;

    const provider: LLMProvider = aiConfig.provider === "openai" ? "openai" : "anthropic";
    const result = await generateLLMReply(provider, systemPrompt, conversationHistory);

    if (result) {
      // Списываем с баланса ровно то, что реально стоил этот ответ (с наценкой), и логируем
      const cost = calculateCostKzt(provider, result.inputTokens, result.outputTokens);
      await supabaseAdmin
        .from("workspaces")
        .update({ balance: (workspace?.balance ?? 0) - cost })
        .eq("id", workspaceId);
      await supabaseAdmin.from("ai_usage_log").insert({
        workspace_id: workspaceId,
        provider,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        cost_kzt: cost,
      });

      if (aiConfig.auto_reply) {
        await sendTelegramMessage(chatId, result.text);
        await supabaseAdmin.from("inbox_messages").insert({
          workspace_id: workspaceId,
          channel: "telegram",
          chat_id: chatId,
          direction: "out",
          client_name: clientName,
          text: result.text,
          ai_suggestion: "",
        });
      } else if (insertedMsg) {
        await supabaseAdmin.from("inbox_messages").update({ ai_suggestion: result.text }).eq("id", insertedMsg.id);
      }
      return NextResponse.json({ ok: true });
    }
  }

  // Баланс закончился, ИИ не настроен, или произошла ошибка вызова — обычное автоподтверждение,
  // мастер отвечает вручную
  await sendTelegramMessage(chatId, "Спасибо! Ваше сообщение передано мастеру, он скоро ответит.");

  return NextResponse.json({ ok: true });
}
