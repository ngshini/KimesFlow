"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordActivity } from "@/lib/activity";
import { getTaskAccessContext } from "@/lib/data/task-access";
import { createClient } from "@/lib/supabase/server";

const commentSchema = z.object({
  taskId: z.uuid(),
  content: z.string().trim().min(1, "Nội dung bình luận không được trống").max(4000, "Bình luận tối đa 4000 ký tự"),
});

export type CommentActionState = {
  error?: string;
  success?: string;
};

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

  const { error } = await supabase.from("comments").insert({
    task_id: parsed.data.taskId,
    user_id: user.id,
    content: parsed.data.content,
  });

  if (error) return { error: error.message };

  await recordActivity(supabase, {
    workspaceId: context.data.workspaceId,
    projectId: context.data.projectId,
    taskId: parsed.data.taskId,
    userId: user.id,
    action: "comment.created",
    metadata: { taskTitle: context.data.taskTitle },
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
