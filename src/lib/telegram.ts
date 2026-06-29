import { getTelegramEnv } from "@/lib/supabase/env";

type TelegramSendResult =
  | {
      ok: true;
      messageId?: number;
    }
  | {
      ok: false;
      error: string;
    };

type TelegramApiResponse = {
  ok: boolean;
  description?: string;
  result?: {
    message_id?: number;
  };
};

export async function sendTelegramMessage(chatId: string | null | undefined, text: string): Promise<TelegramSendResult> {
  const { botToken, defaultChatId } = getTelegramEnv();
  const targetChatId = chatId || defaultChatId;

  if (!botToken) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN chưa được cấu hình." };
  }

  if (!targetChatId) {
    return { ok: false, error: "Người nhận chưa cấu hình telegram_chat_id." };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    const data = (await response.json()) as TelegramApiResponse;

    if (!response.ok || !data.ok) {
      return { ok: false, error: data.description ?? `Telegram API error ${response.status}` };
    }

    return { ok: true, messageId: data.result?.message_id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Không thể gửi Telegram message." };
  }
}
