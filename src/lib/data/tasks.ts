import { notFound } from "next/navigation";
import { DEFAULT_TASK_STATUSES } from "@/constants/task-status";
import { getProjectById } from "@/lib/data/projects";
import { createClient } from "@/lib/supabase/server";
import type { Task, TaskAttachment, TaskComment, TaskStatus } from "@/types/task";

const ATTACHMENT_BUCKET = "task-attachments";

type ProfileOption = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type TaskRow = {
  id: string;
  project_id: string;
  status_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  position: number;
};

function mapTask(row: TaskRow, assignee?: ProfileOption | null, commentCount = 0, attachmentCount = 0): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    statusId: row.status_id,
    title: row.title,
    description: row.description,
    assignee: assignee ?? null,
    dueDate: row.due_date,
    priority: row.priority,
    position: row.position,
    commentCount,
    attachmentCount,
  };
}

function countByTaskId(rows: { task_id: string | null }[]) {
  return rows.reduce<Map<string, number>>((acc, row) => {
    if (!row.task_id) return acc;
    acc.set(row.task_id, (acc.get(row.task_id) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());
}

function countAttachmentsByTask(
  attachments: { task_id: string | null; comment_id: string | null }[],
  commentsById: Map<string, string>,
) {
  return attachments.reduce<Map<string, number>>((acc, attachment) => {
    const taskId = attachment.task_id ?? (attachment.comment_id ? commentsById.get(attachment.comment_id) : undefined);
    if (!taskId) return acc;
    acc.set(taskId, (acc.get(taskId) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());
}

export async function ensureDefaultTaskStatuses(projectId: string) {
  const supabase = await createClient();
  const { data: existing, error } = await supabase
    .from("task_statuses")
    .select("id, project_id, name, slug, color, position")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  if (existing.length > 0) {
    return existing.map((status): TaskStatus => ({
      id: status.id,
      projectId: status.project_id,
      name: status.name,
      slug: status.slug,
      color: status.color,
      position: status.position,
    }));
  }

  const { data: inserted, error: insertError } = await supabase
    .from("task_statuses")
    .insert(
      DEFAULT_TASK_STATUSES.map((status) => ({
        project_id: projectId,
        name: status.name,
        slug: status.slug,
        color: status.color,
        position: status.position,
      })),
    )
    .select("id, project_id, name, slug, color, position")
    .order("position", { ascending: true });

  if (insertError) throw new Error(insertError.message);

  return inserted.map((status): TaskStatus => ({
    id: status.id,
    projectId: status.project_id,
    name: status.name,
    slug: status.slug,
    color: status.color,
    position: status.position,
  }));
}

export async function getProjectKanbanData(projectId: string) {
  const project = await getProjectById(projectId);
  const supabase = await createClient();
  const statuses = await ensureDefaultTaskStatuses(projectId);

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, project_id, status_id, title, description, assignee_id, due_date, priority, position")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);

  const taskIds = tasks.map((task) => task.id);
  const assigneeIds = [...new Set(tasks.map((task) => task.assignee_id).filter((id): id is string => Boolean(id)))];

  const [{ data: profiles, error: profileError }, { data: comments, error: commentError }] = await Promise.all([
    assigneeIds.length > 0 ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", assigneeIds) : Promise.resolve({ data: [], error: null }),
    taskIds.length > 0 ? supabase.from("comments").select("id, task_id").in("task_id", taskIds) : Promise.resolve({ data: [], error: null }),
  ]);

  if (profileError) throw new Error(profileError.message);
  if (commentError) throw new Error(commentError.message);

  const commentIds = comments.map((comment) => comment.id);
  const attachmentFilter =
    commentIds.length > 0 ? `task_id.in.(${taskIds.join(",")}),comment_id.in.(${commentIds.join(",")})` : `task_id.in.(${taskIds.join(",")})`;
  const { data: attachments, error: attachmentError } =
    taskIds.length > 0 ? await supabase.from("attachments").select("task_id, comment_id").or(attachmentFilter) : { data: [], error: null };

  if (attachmentError) throw new Error(attachmentError.message);

  const profilesById = new Map(
    profiles.map((profile) => [
      profile.id,
      {
        id: profile.id,
        name: profile.full_name ?? "Người dùng",
        avatarUrl: profile.avatar_url,
      },
    ]),
  );
  const commentsById = new Map(comments.map((comment) => [comment.id, comment.task_id]));
  const commentCounts = countByTaskId(comments);
  const attachmentCounts = countAttachmentsByTask(attachments, commentsById);

  return {
    project,
    statuses,
    tasks: tasks.map((task) => mapTask(task, task.assignee_id ? profilesById.get(task.assignee_id) : null, commentCounts.get(task.id), attachmentCounts.get(task.id))),
  };
}

export async function getTaskById(taskId: string) {
  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .select("id, project_id, status_id, title, description, assignee_id, due_date, priority, position")
    .eq("id", taskId)
    .single();

  if (error || !task) notFound();

  await getProjectById(task.project_id);

  const [{ data: profiles }, { data: comments }] = await Promise.all([
    task.assignee_id ? supabase.from("profiles").select("id, full_name, avatar_url").eq("id", task.assignee_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("comments").select("id, task_id").eq("task_id", task.id),
  ]);

  const commentIds = (comments ?? []).map((comment) => comment.id);
  const attachmentFilter = commentIds.length > 0 ? `task_id.eq.${task.id},comment_id.in.(${commentIds.join(",")})` : `task_id.eq.${task.id}`;
  const { data: attachments } = await supabase.from("attachments").select("task_id, comment_id").or(attachmentFilter);

  const assignee = profiles
    ? {
        id: profiles.id,
        name: profiles.full_name ?? "Người dùng",
        avatarUrl: profiles.avatar_url,
      }
    : null;

  const commentsById = new Map((comments ?? []).map((comment) => [comment.id, comment.task_id]));
  const attachmentCount = countAttachmentsByTask(attachments ?? [], commentsById).get(task.id) ?? 0;

  return mapTask(task, assignee, comments?.length ?? 0, attachmentCount);
}

export async function getTaskComments(taskId: string) {
  await getTaskById(taskId);
  const supabase = await createClient();
  const { data: comments, error } = await supabase
    .from("comments")
    .select("id, task_id, user_id, content, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const userIds = [...new Set(comments.map((comment) => comment.user_id))];
  const { data: profiles, error: profileError } =
    userIds.length > 0 ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds) : { data: [], error: null };

  if (profileError) throw new Error(profileError.message);

  const profilesById = new Map(
    profiles.map((profile) => [
      profile.id,
      {
        id: profile.id,
        name: profile.full_name ?? "Người dùng",
        avatarUrl: profile.avatar_url,
      },
    ]),
  );

  return comments.map((comment): TaskComment => {
    const author = profilesById.get(comment.user_id) ?? { id: comment.user_id, name: "Người dùng" };

    return {
      id: comment.id,
      taskId: comment.task_id,
      content: comment.content,
      createdAt: comment.created_at,
      author,
    };
  });
}

export async function getTaskAttachments(taskId: string) {
  await getTaskById(taskId);
  const supabase = await createClient();
  const { data: attachments, error } = await supabase
    .from("attachments")
    .select("id, task_id, uploaded_by, file_url, file_name, file_type, file_size, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const userIds = [...new Set(attachments.map((attachment) => attachment.uploaded_by))];
  const [{ data: profiles, error: profileError }, signedResults] = await Promise.all([
    userIds.length > 0 ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds) : Promise.resolve({ data: [], error: null }),
    Promise.all(
      attachments.map(async (attachment) => {
        const { data } = await supabase.storage.from(ATTACHMENT_BUCKET).createSignedUrl(attachment.file_url, 60 * 10);
        return [attachment.id, data?.signedUrl ?? null] as const;
      }),
    ),
  ]);

  if (profileError) throw new Error(profileError.message);

  const profilesById = new Map(
    profiles.map((profile) => [
      profile.id,
      {
        id: profile.id,
        name: profile.full_name ?? "Người dùng",
        avatarUrl: profile.avatar_url,
      },
    ]),
  );
  const signedUrlById = new Map(signedResults);

  return attachments.map((attachment): TaskAttachment => {
    const uploadedBy = profilesById.get(attachment.uploaded_by) ?? { id: attachment.uploaded_by, name: "Người dùng" };

    return {
      id: attachment.id,
      taskId: attachment.task_id ?? taskId,
      fileUrl: attachment.file_url,
      fileName: attachment.file_name,
      fileType: attachment.file_type,
      fileSize: attachment.file_size,
      signedUrl: signedUrlById.get(attachment.id) ?? null,
      createdAt: attachment.created_at,
      uploadedBy,
    };
  });
}

export async function getProjectAssignees(projectId: string) {
  const project = await getProjectById(projectId);
  const supabase = await createClient();

  const { data: members, error } = await supabase.from("workspace_members").select("user_id").eq("workspace_id", project.workspaceId);
  if (error) throw new Error(error.message);

  const userIds = members.map((member) => member.user_id);
  if (userIds.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
  if (profileError) throw new Error(profileError.message);

  return profiles.map((profile): ProfileOption => ({
    id: profile.id,
    name: profile.full_name ?? "Người dùng",
    avatarUrl: profile.avatar_url,
  }));
}
