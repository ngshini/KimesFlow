"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivity } from "@/lib/activity";
import { getTaskAccessContext } from "@/lib/data/task-access";
import { createTelegramNotification } from "@/lib/notifications/telegram";
import { createClient } from "@/lib/supabase/server";
import { moveTaskSchema, taskSchema, updateTaskSchema } from "@/lib/validations/task.schema";

export type TaskActionState = {
  error?: string;
  success?: string;
};

function normalizeOptionalUuid(value?: string) {
  return value && value.length > 0 ? value : null;
}

function normalizeOptionalDate(value?: string) {
  return value && value.length > 0 ? value : null;
}

export async function createTaskAction(_prevState: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Bạn cần đăng nhập để tạo task." };

  const { data: lastTask, error: positionError } = await supabase
    .from("tasks")
    .select("position")
    .eq("project_id", parsed.data.projectId)
    .eq("status_id", parsed.data.statusId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (positionError) return { error: positionError.message };

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      project_id: parsed.data.projectId,
      status_id: parsed.data.statusId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      assignee_id: normalizeOptionalUuid(parsed.data.assigneeId),
      reporter_id: user.id,
      due_date: normalizeOptionalDate(parsed.data.dueDate),
      priority: parsed.data.priority,
      position: (lastTask?.position ?? 0) + 1000,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (task) {
    const context = await getTaskAccessContext(task.id);
    if (context.data) {
      await recordActivity(supabase, {
        workspaceId: context.data.workspaceId,
        projectId: context.data.projectId,
        taskId: task.id,
        userId: user.id,
        action: "task.created",
        metadata: { title: parsed.data.title },
      });

      const assigneeId = normalizeOptionalUuid(parsed.data.assigneeId);
      if (assigneeId) {
        await createTelegramNotification(supabase, {
          workspaceId: context.data.workspaceId,
          projectId: context.data.projectId,
          taskId: task.id,
          userId: assigneeId,
          title: "Bạn được giao task mới",
          body: `${parsed.data.title}${parsed.data.dueDate ? `\nDeadline: ${parsed.data.dueDate}` : ""}`,
        });
      }
    }
  }

  revalidatePath(`/projects/${parsed.data.projectId}`);

  return { success: "Task đã được tạo." };
}

export async function updateTaskAction(_prevState: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const parsed = updateTaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: existing, error: existingError } = await supabase
    .from("tasks")
    .select("project_id, due_date, assignee_id, title")
    .eq("id", parsed.data.taskId)
    .single();

  if (existingError || !existing) return { error: existingError?.message ?? "Không tìm thấy task." };

  const { error } = await supabase
    .from("tasks")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      assignee_id: normalizeOptionalUuid(parsed.data.assigneeId),
      due_date: normalizeOptionalDate(parsed.data.dueDate),
      priority: parsed.data.priority,
    })
    .eq("id", parsed.data.taskId);

  if (error) return { error: error.message };

  if (user) {
    const context = await getTaskAccessContext(parsed.data.taskId);
    if (context.data) {
      await recordActivity(supabase, {
        workspaceId: context.data.workspaceId,
        projectId: context.data.projectId,
        taskId: parsed.data.taskId,
        userId: user.id,
        action: "task.updated",
        metadata: { title: parsed.data.title },
      });

      const nextDueDate = normalizeOptionalDate(parsed.data.dueDate);
      const nextAssigneeId = normalizeOptionalUuid(parsed.data.assigneeId) ?? existing.assignee_id;
      if (nextDueDate !== existing.due_date && nextAssigneeId) {
        await createTelegramNotification(supabase, {
          workspaceId: context.data.workspaceId,
          projectId: context.data.projectId,
          taskId: parsed.data.taskId,
          userId: nextAssigneeId,
          title: "Deadline task đã được cập nhật",
          body: `${parsed.data.title}\nDeadline mới: ${nextDueDate ?? "Chưa có deadline"}`,
        });
      }
    }
  }

  revalidatePath(`/projects/${existing.project_id}`);
  revalidatePath(`/tasks/${parsed.data.taskId}`);

  return { success: "Task đã được cập nhật." };
}

export async function deleteTaskAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!taskId || !projectId) return;

  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId);

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function moveTaskAction(input: { taskId: string; statusId: string; position: number }) {
  const parsed = moveTaskSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const { data: task, error: taskError } = await supabase.from("tasks").select("project_id").eq("id", parsed.data.taskId).single();
  if (taskError || !task) return { error: taskError?.message ?? "Không tìm thấy task." };

  const { error } = await supabase
    .from("tasks")
    .update({
      status_id: parsed.data.statusId,
      position: parsed.data.position,
    })
    .eq("id", parsed.data.taskId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${task.project_id}`);
  return { success: true };
}
