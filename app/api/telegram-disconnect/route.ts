import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "supabase not configured" }, { status: 500 });
  }

  const { workspaceId } = await req.json();
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !workspaceId) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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

  if (!bot) return NextResponse.json({ ok: true });

  try {
    await fetch(`https://api.telegram.org/bot${bot.bot_token}/deleteWebhook`);
  } catch {
    // не критично, если не получилось — просто удаляем запись ниже
  }

  await supabaseAdmin.from("telegram_bots").delete().eq("workspace_id", workspaceId);

  return NextResponse.json({ ok: true });
}
