import type { SupabaseClient } from "@supabase/supabase-js";
import { sendZaloMessage } from "@/lib/zalo";
import type { Database } from "@/types/database";

type ZaloNotificationInput = {
  userId: string;
  workspaceId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  title: string;
  message: string;
};

export async function createZaloNotification(supabase: SupabaseClient<Database>, input: ZaloNotificationInput) {
  const { data: profile } = await supabase.from("profiles").select("zalo_user_id").eq("id", input.userId).maybeSingle();
  const sendResult = await sendZaloMessage(profile?.zalo_user_id, `${input.title}\n${input.message}`);

  await supabase.from("notifications").insert({
    user_id: input.userId,
    workspace_id: input.workspaceId ?? null,
    project_id: input.projectId ?? null,
    task_id: input.taskId ?? null,
    type: "zalo.task_notification",
    title: input.title,
    body: input.message,
    message: input.message,
    channel: "zalo",
    delivery_status: sendResult.ok ? "sent" : "failed",
    status: sendResult.ok ? "sent" : "failed",
    error_message: sendResult.ok ? null : sendResult.error,
    sent_at: sendResult.ok ? new Date().toISOString() : null,
  });

  return sendResult;
}
