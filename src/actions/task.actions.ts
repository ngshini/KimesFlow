"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivity } from "@/lib/activity";
import { getTaskAccessContext } from "@/lib/data/task-access";
import { createInAppNotification } from "@/lib/notifications/in-app";
import { createTelegramNotification } from "@/lib/notifications/telegram";
import { createClient } from "@/lib/supabase/server";
import {
  moveTaskSchema,
  subtaskSchema,
  taskSchema,
  taskStatusSchema,
  updateSubtaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "@/lib/validations/task.schema";
import type { Task } from "@/types/task";
import { z } from "zod";

export type TaskActionState = {
  error?: string;
  success?: string;
  task?: Task;
};

const aiBulkTaskSchema = z.object({
  projectId: z.uuid(),
  statusId: z.uuid(),
  tasksJson: z.string(),
});

const aiTaskDraftSchema = z.array(
  z.object({
    title: z.string().min(2),
    description: z.string().optional().default(""),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    due_date: z.string().nullable().optional(),
    subtasks: z.array(z.string()).optional().default([]),
  }),
);

function normalizeOptionalUuid(value?: string) {
  return value && value.length > 0 ? value : null;
}

function normalizeOptionalDate(value?: string) {
  return value && value.length > 0 ? value : null;
}

function mapCreatedTask(row: {
  id: string;
  project_id: string;
  status_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  priority: Task["priority"];
  position: number;
}, assignee?: { id: string; name: string; avatarUrl?: string | null } | null): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    statusId: row.status_id,
    title: row.title,
    description: row.description,
    assignee: assignee ?? null,
    startDate: row.start_date,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    priority: row.priority,
    position: row.position,
    commentCount: 0,
    attachmentCount: 0,
    subtaskCount: 0,
    completedSubtaskCount: 0,
  };
}

export async function createTaskAction(_prevState: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Bạn cần đăng nhập để tạo task." };

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, workspace_id")
    .eq("id", parsed.data.projectId)
    .single();

  if (projectError || !project) return { error: projectError?.message ?? "Không tìm thấy project." };

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", project.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) return { error: membershipError.message };
  const { data: projectMembership, error: projectMembershipError } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", parsed.data.projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (projectMembershipError) return { error: projectMembershipError.message };

  const canCreateTask =
    membership?.role === "owner" ||
    membership?.role === "admin" ||
    membership?.role === "member" ||
    projectMembership?.role === "owner" ||
    projectMembership?.role === "admin" ||
    projectMembership?.role === "member";

  if (!canCreateTask) return { error: "Bạn không có quyền tạo task trong project này." };

  const { data: status, error: statusError } = await supabase
    .from("task_statuses")
    .select("id")
    .eq("id", parsed.data.statusId)
    .eq("project_id", parsed.data.projectId)
    .maybeSingle();

  if (statusError) return { error: statusError.message };
  if (!status) return { error: "Trạng thái không thuộc project hiện tại." };

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
      created_by: user.id,
      start_date: normalizeOptionalDate(parsed.data.startDate),
      due_date: normalizeOptionalDate(parsed.data.dueDate),
      priority: parsed.data.priority,
      position: (lastTask?.position ?? 0) + 1000,
    })
    .select("id, project_id, status_id, title, description, assignee_id, start_date, due_date, completed_at, priority, position")
    .single();

  if (error) return { error: error.message };

  let mappedTask: Task | undefined;
  if (task) {
    const assigneeId = normalizeOptionalUuid(parsed.data.assigneeId);
    const { data: assigneeProfile } = assigneeId
      ? await supabase.from("profiles").select("id, full_name, avatar_url").eq("id", assigneeId).maybeSingle()
      : { data: null };

    mappedTask = mapCreatedTask(
      task,
      assigneeProfile
        ? {
            id: assigneeProfile.id,
            name: assigneeProfile.full_name ?? "Người dùng",
            avatarUrl: assigneeProfile.avatar_url,
          }
        : null,
    );

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

      if (assigneeId) {
        await createInAppNotification(supabase, {
          workspaceId: context.data.workspaceId,
          projectId: context.data.projectId,
          taskId: task.id,
          userId: assigneeId,
          type: "task.assigned",
          title: "Bạn được giao task mới",
          message: parsed.data.title,
        });
        void createTelegramNotification(supabase, {
          workspaceId: context.data.workspaceId,
          projectId: context.data.projectId,
          taskId: task.id,
          userId: assigneeId,
          title: "Bạn được giao task mới",
          body: `${parsed.data.title}${parsed.data.dueDate ? `\nDeadline: ${parsed.data.dueDate}` : ""}`,
        });
      } else {
        void createTelegramNotification(supabase, {
          workspaceId: context.data.workspaceId,
          projectId: context.data.projectId,
          taskId: task.id,
          userId: user.id,
          title: "Task mới đã được tạo",
          body: `${parsed.data.title}${parsed.data.dueDate ? `\nDeadline: ${parsed.data.dueDate}` : ""}`,
        });
      }
    }
  }

  revalidatePath(`/projects/${parsed.data.projectId}`);

  return { success: "Task đã được tạo.", task: mappedTask };
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
      start_date: normalizeOptionalDate(parsed.data.startDate),
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
        await createInAppNotification(supabase, {
          workspaceId: context.data.workspaceId,
          projectId: context.data.projectId,
          taskId: parsed.data.taskId,
          userId: nextAssigneeId,
          type: "task.deadline_updated",
          title: "Deadline task đã được cập nhật",
          message: `${parsed.data.title}: ${nextDueDate ?? "Chưa có deadline"}`,
        });
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

  const { data: status } = await supabase.from("task_statuses").select("slug").eq("id", parsed.data.statusId).maybeSingle();

  const { error } = await supabase
    .from("tasks")
    .update({
      status_id: parsed.data.statusId,
      position: parsed.data.position,
      completed_at: status?.slug === "done" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.taskId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${task.project_id}`);
  return { success: true };
}

export async function createTaskStatusAction(_prevState: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const parsed = taskStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const { data: lastStatus, error: positionError } = await supabase
    .from("task_statuses")
    .select("position")
    .eq("project_id", parsed.data.projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (positionError) return { error: positionError.message };

  const slug = parsed.data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { error } = await supabase.from("task_statuses").insert({
    project_id: parsed.data.projectId,
    name: parsed.data.name,
    slug: `${slug || "status"}-${Date.now()}`,
    color: parsed.data.color || "#64748b",
    position: (lastStatus?.position ?? 0) + 1000,
    is_default: false,
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: "Cột workflow đã được tạo." };
}

export async function updateTaskStatusAction(_prevState: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const parsed = updateTaskStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const { data: status, error: statusError } = await supabase.from("task_statuses").select("project_id").eq("id", parsed.data.statusId).single();
  if (statusError || !status) return { error: "Không tìm thấy cột workflow." };

  const { error } = await supabase
    .from("task_statuses")
    .update({
      name: parsed.data.name,
      color: parsed.data.color || "#64748b",
      position: parsed.data.position,
    })
    .eq("id", parsed.data.statusId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${status.project_id}`);
  return { success: "Cột workflow đã được cập nhật." };
}

export async function deleteTaskStatusAction(formData: FormData) {
  const statusId = String(formData.get("statusId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!statusId || !projectId) return;

  const supabase = await createClient();
  await supabase.from("task_statuses").delete().eq("id", statusId);

  revalidatePath(`/projects/${projectId}`);
}

export async function createSubtaskAction(_prevState: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const parsed = subtaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bạn cần đăng nhập để tạo subtask." };

  const { data: lastSubtask, error: positionError } = await supabase
    .from("subtasks")
    .select("position")
    .eq("task_id", parsed.data.taskId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (positionError) return { error: positionError.message };

  const { error } = await supabase.from("subtasks").insert({
    task_id: parsed.data.taskId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    position: (lastSubtask?.position ?? 0) + 1000,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  const context = await getTaskAccessContext(parsed.data.taskId);
  if (context.data) {
    await recordActivity(supabase, {
      workspaceId: context.data.workspaceId,
      projectId: context.data.projectId,
      taskId: parsed.data.taskId,
      userId: user.id,
      action: "subtask.created",
      metadata: { title: parsed.data.title },
    });
    revalidatePath(`/projects/${context.data.projectId}`);
  }

  revalidatePath(`/tasks/${parsed.data.taskId}`);
  return { success: "Subtask đã được tạo." };
}

export async function toggleSubtaskAction(formData: FormData) {
  const parsed = updateSubtaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("subtasks").update({ is_completed: parsed.data.isCompleted }).eq("id", parsed.data.subtaskId);

  const context = await getTaskAccessContext(parsed.data.taskId);
  if (context.data) revalidatePath(`/projects/${context.data.projectId}`);
  revalidatePath(`/tasks/${parsed.data.taskId}`);
}

export async function createAiTasksAction(_prevState: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const parsed = aiBulkTaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  let rawDrafts: unknown;
  try {
    rawDrafts = JSON.parse(parsed.data.tasksJson);
  } catch {
    return { error: "Danh sách task AI không phải JSON hợp lệ." };
  }

  const drafts = aiTaskDraftSchema.safeParse(rawDrafts);
  if (!drafts.success) return { error: "Danh sách task AI không hợp lệ." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bạn cần đăng nhập để tạo task." };

  for (const [index, draft] of drafts.data.entries()) {
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        project_id: parsed.data.projectId,
        status_id: parsed.data.statusId,
        title: draft.title,
        description: draft.description || null,
        priority: draft.priority,
        due_date: draft.due_date || null,
        created_by: user.id,
        reporter_id: user.id,
        position: (index + 1) * 1000,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };

    if (task && draft.subtasks.length > 0) {
      await supabase.from("subtasks").insert(
        draft.subtasks.map((title, subtaskIndex) => ({
          task_id: task.id,
          title,
          created_by: user.id,
          position: (subtaskIndex + 1) * 1000,
        })),
      );
    }
  }

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: "Các task AI đã được tạo." };
}
