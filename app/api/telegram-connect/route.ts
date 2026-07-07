import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function verifyOwnership(req: NextRequest, workspaceId: string) {
  if (!supabaseAdmin) return null;
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  if (!user) return null;
  const { data: workspace } = await supabaseAdmin
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("owner_id", user.id)
    .maybeSingle();
  return workspace ? user : null;
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "supabase not configured" }, { status: 500 });
  }

  const { workspaceId, botToken } = await req.json();
  if (!workspaceId || !botToken?.trim()) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const user = await verifyOwnership(req, workspaceId);
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Проверяем, что токен реальный и рабочий — Telegram сам подтвердит его через getMe
  const meRes = await fetch(`https://api.telegram.org/bot${botToken.trim()}/getMe`);
  const meData = await meRes.json();
  if (!meData.ok) {
    return NextResponse.json({ error: "Неверный токен бота. Проверь, что скопировал его полностью." }, { status: 400 });
  }

  const botUsername: string = meData.result.username;
  const webhookSecret = crypto.randomUUID().replace(/-/g, "");
  const webhookUrl = `${req.nextUrl.origin}/api/telegram-webhook/${workspaceId}`;

  const setWebhookRes = await fetch(
    `https://api.telegram.org/bot${botToken.trim()}/setWebhook?url=${encodeURIComponent(
      webhookUrl
    )}&secret_token=${webhookSecret}`
  );
  const setWebhookData = await setWebhookRes.json();
  if (!setWebhookData.ok) {
    return NextResponse.json({ error: "Не удалось зарегистрировать вебхук в Telegram" }, { status: 502 });
  }

  await supabaseAdmin.from("telegram_bots").upsert({
    workspace_id: workspaceId,
    bot_token: botToken.trim(),
    bot_username: botUsername,
    webhook_secret: webhookSecret,
  });

  return NextResponse.json({ ok: true, botUsername });
}
