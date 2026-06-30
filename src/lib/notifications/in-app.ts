import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type InAppNotificationInput = {
  userId: string;
  workspaceId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  type: string;
  title: string;
  message?: string | null;
};

export async function createInAppNotification(supabase: SupabaseClient<Database>, input: InAppNotificationInput) {
  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    workspace_id: input.workspaceId ?? null,
    project_id: input.projectId ?? null,
    task_id: input.taskId ?? null,
    type: input.type,
    title: input.title,
    body: input.message ?? null,
    message: input.message ?? null,
    channel: "in_app",
    delivery_status: "sent",
    status: "pending",
  });

  if (error) {
    console.error("Failed to create in-app notification", error.message);
  }
}
