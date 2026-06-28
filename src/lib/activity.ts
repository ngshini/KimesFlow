import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

type ActivityInput = {
  workspaceId: string;
  projectId: string;
  taskId?: string | null;
  userId: string;
  action: string;
  metadata?: Json;
};

export async function recordActivity(supabase: SupabaseClient<Database>, input: ActivityInput) {
  await supabase.from("activity_logs").insert({
    workspace_id: input.workspaceId,
    project_id: input.projectId,
    task_id: input.taskId ?? null,
    user_id: input.userId,
    action: input.action,
    metadata: input.metadata ?? {},
  });
}
