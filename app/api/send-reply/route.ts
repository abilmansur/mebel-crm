import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "supabase not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { workspaceId, chatId, text, clientName } = await req.json();
  if (!workspaceId || !chatId || !text?.trim()) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const { data: workspace } = await supabaseAdmin
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!workspace) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: bot } = await supabaseAdmin
    .from("telegram_bots")
    .select("bot_token")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (!bot) return NextResponse.json({ error: "bot not connected" }, { status: 404 });

  const sendRes = await fetch(`https://api.telegram.org/bot${bot.bot_token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!sendRes.ok) return NextResponse.json({ error: "telegram send failed" }, { status: 502 });

  await supabaseAdmin.from("inbox_messages").insert({
    workspace_id: workspaceId,
    channel: "telegram",
    chat_id: chatId,
    direction: "out",
    client_name: clientName || "",
    text,
    ai_suggestion: "",
  });

  return NextResponse.json({ ok: true });
}
