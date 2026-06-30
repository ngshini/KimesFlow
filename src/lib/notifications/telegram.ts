import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/telegram";
import type { Database } from "@/types/database";

type TaskNotificationInput = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  userId: string;
  title: string;
  body: string;
};

export async function createTelegramNotification(supabase: SupabaseClient<Database>, input: TaskNotificationInput) {
  const { data: profile, error: profileError } = await supabase.from("profiles").select("telegram_chat_id").eq("id", input.userId).maybeSingle();

  const sendResult = profileError
    ? { ok: false as const, error: profileError.message }
    : await sendTelegramMessage(profile?.telegram_chat_id, `${input.title}\n\n${input.body}`);

  const { error: notificationError } = await supabase.from("notifications").insert({
    user_id: input.userId,
    workspace_id: input.workspaceId,
    project_id: input.projectId,
    task_id: input.taskId,
    title: input.title,
    body: input.body,
    type: "telegram.task_notification",
    message: input.body,
    channel: "telegram",
    delivery_status: sendResult.ok ? "sent" : "failed",
    status: sendResult.ok ? "sent" : "failed",
    error_message: sendResult.ok ? null : sendResult.error,
    sent_at: sendResult.ok ? new Date().toISOString() : null,
  });

  if (notificationError) {
    console.error("Failed to write Telegram notification history", notificationError);
  }

  if (!sendResult.ok) {
    console.error("Failed to send Telegram notification", sendResult.error);
  }

  return sendResult;
}
