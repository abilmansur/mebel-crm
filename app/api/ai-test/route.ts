import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateAIReply } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !supabaseAdmin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY не задан на сервере. Добавь его в Vercel → Settings → Environment Variables и сделай Redeploy." },
      { status: 500 }
    );
  }

  const { prompt, knowledgeBase } = await req.json();
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Промпт пустой — сначала заполни его." }, { status: 400 });
  }

  const systemPrompt = knowledgeBase?.trim() ? `${prompt}\n\n---\nБаза знаний:\n${knowledgeBase}` : prompt;

  const reply = await generateAIReply(systemPrompt, [
    { role: "user", content: "Здравствуйте, сколько будет стоить шкаф-купе 2 на 2.4 метра?" },
  ]);

  if (!reply) {
    return NextResponse.json(
      {
        error:
          "Ключ ANTHROPIC_API_KEY задан, но ответ получить не удалось. Возможные причины: неверный ключ, закончился баланс на console.anthropic.com, или временная ошибка API. Подробности — в логах Vercel (Deployments → Functions → Logs).",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ reply });
}
