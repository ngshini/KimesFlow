import { createClient } from "@/lib/supabase/server";

export async function getTaskAccessContext(taskId: string) {
  const supabase = await createClient();
  const { data: task, error: taskError } = await supabase.from("tasks").select("id, project_id, title").eq("id", taskId).single();

  if (taskError || !task) {
    return { error: taskError?.message ?? "Không tìm thấy task." };
  }

  const { data: project, error: projectError } = await supabase.from("projects").select("id, workspace_id").eq("id", task.project_id).single();

  if (projectError || !project) {
    return { error: projectError?.message ?? "Không tìm thấy project của task." };
  }

  return {
    data: {
      taskId: task.id,
      taskTitle: task.title,
      projectId: project.id,
      workspaceId: project.workspace_id,
    },
  };
}
