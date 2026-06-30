"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordActivity } from "@/lib/activity";
import { getTaskAccessContext } from "@/lib/data/task-access";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BUCKET = "task-attachments";

const uploadSchema = z.object({
  taskId: z.uuid(),
});

export type AttachmentActionState = {
  error?: string;
  success?: string;
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export async function uploadTaskAttachmentAction(_prevState: AttachmentActionState, formData: FormData): Promise<AttachmentActionState> {
  const parsed = uploadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Vui lòng chọn file cần upload." };
  if (file.size > MAX_FILE_SIZE) return { error: "File tối đa 10MB." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Bạn cần đăng nhập để upload file." };

  const context = await getTaskAccessContext(parsed.data.taskId);
  if (context.error || !context.data) return { error: context.error ?? "Bạn không có quyền truy cập task này." };

  const safeName = sanitizeFileName(file.name);
  const path = `${user.id}/${parsed.data.taskId}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) return { error: uploadError.message };

  const { error: attachmentError } = await supabase.from("attachments").insert({
    task_id: parsed.data.taskId,
    uploaded_by: user.id,
    file_url: path,
    file_path: path,
    file_name: file.name,
    file_type: file.type || "application/octet-stream",
    mime_type: file.type || "application/octet-stream",
    file_size: file.size,
  });

  if (attachmentError) return { error: attachmentError.message };

  await recordActivity(supabase, {
    workspaceId: context.data.workspaceId,
    projectId: context.data.projectId,
    taskId: parsed.data.taskId,
    userId: user.id,
    action: "attachment.uploaded",
    metadata: {
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
    },
  });

  revalidatePath(`/tasks/${parsed.data.taskId}`);
  revalidatePath(`/projects/${context.data.projectId}`);

  return { success: "File đã được upload." };
}
