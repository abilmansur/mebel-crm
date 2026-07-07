import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateLLMReply, isProviderConfigured, LLMProvider } from "@/lib/llm";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !supabaseAdmin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { prompt, knowledgeBase, provider } = await req.json();
  const llmProvider: LLMProvider = provider === "openai" ? "openai" : "anthropic";

  if (!isProviderConfigured(llmProvider)) {
    const envVar = llmProvider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
    return NextResponse.json(
      { error: `${envVar} не задан на сервере. Добавь его в Vercel → Settings → Environment Variables и сделай Redeploy.` },
      { status: 500 }
    );
  }

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Промпт пустой — сначала заполни его." }, { status: 400 });
  }

  const systemPrompt = knowledgeBase?.trim() ? `${prompt}\n\n---\nБаза знаний:\n${knowledgeBase}` : prompt;

  const result = await generateLLMReply(llmProvider, systemPrompt, [
    { role: "user", content: "Здравствуйте, сколько будет стоить шкаф-купе 2 на 2.4 метра?" },
  ]);

  if (!result) {
    return NextResponse.json(
      {
        error:
          "Ключ задан, но ответ получить не удалось. Возможные причины: неверный ключ, закончился баланс у провайдера, или временная ошибка API. Подробности — в логах Vercel (Deployments → Functions → Logs).",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ reply: result.text });
}
