import { NextResponse, type NextRequest } from "next/server";
import { getTelegramEnv } from "@/lib/supabase/env";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET(request: NextRequest) {
  const { reminderSecret } = getTelegramEnv();

  if (reminderSecret && request.nextUrl.searchParams.get("secret") !== reminderSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendTelegramMessage(undefined, `KimesFlow Telegram test\n${new Date().toISOString()}`);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, messageId: result.messageId ?? null });
}
