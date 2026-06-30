"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordActivity } from "@/lib/activity";
import { getTaskAccessContext } from "@/lib/data/task-access";
import { createInAppNotification } from "@/lib/notifications/in-app";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BUCKET = "task-attachments";

const commentSchema = z.object({
  taskId: z.uuid(),
  content: z.string().trim().min(1, "Nội dung bình luận không được trống").max(4000, "Bình luận tối đa 4000 ký tự"),
});

export type CommentActionState = {
  error?: string;
  success?: string;
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export async function createCommentAction(_prevState: CommentActionState, formData: FormData): Promise<CommentActionState> {
  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Bạn cần đăng nhập để bình luận." };

  const context = await getTaskAccessContext(parsed.data.taskId);
  if (context.error || !context.data) return { error: context.error ?? "Bạn không có quyền truy cập task này." };

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      task_id: parsed.data.taskId,
      user_id: user.id,
      content: parsed.data.content,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const file = formData.get("file");
  if (file instanceof File && file.size > 0 && comment) {
    if (file.size > MAX_FILE_SIZE) return { error: "Comment đã tạo nhưng file vượt quá 10MB nên chưa được upload." };

    const safeName = sanitizeFileName(file.name);
    const path = `${user.id}/${parsed.data.taskId}/comments/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (!uploadError) {
      await supabase.from("attachments").insert({
        task_id: parsed.data.taskId,
        comment_id: comment.id,
        uploaded_by: user.id,
        file_url: path,
        file_path: path,
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
        mime_type: file.type || "application/octet-stream",
        file_size: file.size,
      });
    }
  }

  await recordActivity(supabase, {
    workspaceId: context.data.workspaceId,
    projectId: context.data.projectId,
    taskId: parsed.data.taskId,
    userId: user.id,
    action: "comment.created",
    metadata: { taskTitle: context.data.taskTitle },
  });

  await createInAppNotification(supabase, {
    workspaceId: context.data.workspaceId,
    projectId: context.data.projectId,
    taskId: parsed.data.taskId,
    userId: user.id,
    type: "comment.created",
    title: "Comment mới đã được thêm",
    message: parsed.data.content,
  });

  revalidatePath(`/tasks/${parsed.data.taskId}`);
  revalidatePath(`/projects/${context.data.projectId}`);

  return { success: "Bình luận đã được thêm." };
}

export async function createLegacyCommentAction(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  if (content.length < 1) return { error: "Nội dung bình luận không được trống" };
  return { data: { content } };
}
