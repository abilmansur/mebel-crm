import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const API_SECRET = process.env.CLOUDPAYMENTS_API_SECRET;

// CloudPayments подписывает каждое уведомление HMAC-SHA256 от сырого тела запроса,
// используя API Secret из личного кабинета мерчанта. Проверяем перед тем, как доверять данным —
// иначе кто угодно сможет постучаться на этот адрес и "бесплатно" зачислить себе баланс.
function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !API_SECRET) return false;
  const computed = createHmac("sha256", API_SECRET).update(rawBody).digest("base64");
  try {
    return timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // В личном кабинете CloudPayments для уведомлений "Check" и "Pay" указывается разный URL —
  // используем один и тот же адрес с параметром ?type=check или ?type=pay
  const type = req.nextUrl.searchParams.get("type");
  const rawBody = await req.text();
  const signature = req.headers.get("Content-HMAC");

  if (!verifySignature(rawBody, signature)) {
    // Код 13 — общая ошибка для CloudPayments, платёж будет отклонён/не засчитан
    return NextResponse.json({ code: 13 });
  }

  const params = new URLSearchParams(rawBody);
  const amount = parseFloat(params.get("Amount") || "0");
  const workspaceId = params.get("AccountId");
  const transactionId = params.get("TransactionId");

  if (!supabaseAdmin || !workspaceId) {
    return NextResponse.json({ code: 0 });
  }

  if (type === "check") {
    // Просто подтверждаем, что можем принять платёж на этот AccountId
    return NextResponse.json({ code: 0 });
  }

  if (type === "pay") {
    const { data: workspace } = await supabaseAdmin
      .from("workspaces")
      .select("balance")
      .eq("id", workspaceId)
      .maybeSingle();

    if (workspace) {
      await supabaseAdmin
        .from("workspaces")
        .update({ balance: (workspace.balance || 0) + amount })
        .eq("id", workspaceId);
    }

    await supabaseAdmin.from("balance_topups").insert({
      workspace_id: workspaceId,
      amount,
      status: "completed",
      provider: "cloudpayments",
      external_id: transactionId,
    });

    return NextResponse.json({ code: 0 });
  }

  return NextResponse.json({ code: 0 });
}
