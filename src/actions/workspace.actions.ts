"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { workspaceSchema, workspaceUpdateSchema } from "@/lib/validations/workspace.schema";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/constants/routes";

export type WorkspaceActionState = {
  error?: string;
  success?: string;
};

export async function createWorkspaceAction(_prevState: WorkspaceActionState, formData: FormData): Promise<WorkspaceActionState> {
  const parsed = workspaceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Bạn cần đăng nhập để tạo workspace." };

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Slug workspace đã tồn tại. Vui lòng chọn slug khác." };
    return { error: error.message };
  }

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) return { error: "Workspace đã tạo nhưng chưa thể gán quyền owner. Vui lòng kiểm tra RLS policy." };

  revalidatePath(routes.workspaces);
  revalidatePath(routes.projects);

  return { success: "Workspace đã được tạo." };
}

export async function updateWorkspaceAction(_prevState: WorkspaceActionState, formData: FormData): Promise<WorkspaceActionState> {
  const parsed = workspaceUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Bạn cần đăng nhập để cập nhật workspace." };

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("owner_id")
    .eq("id", parsed.data.workspaceId)
    .single();

  if (workspaceError || !workspace) return { error: "Không tìm thấy workspace." };
  if (workspace.owner_id !== user.id) return { error: "Chỉ owner mới có quyền cập nhật workspace này." };

  const { error } = await supabase
    .from("workspaces")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
    })
    .eq("id", parsed.data.workspaceId);

  if (error) {
    if (error.code === "23505") return { error: "Slug workspace đã tồn tại. Vui lòng chọn slug khác." };
    return { error: error.message };
  }

  revalidatePath(routes.workspaces);
  revalidatePath(`/workspaces/${parsed.data.workspaceId}`);
  revalidatePath(routes.projects);

  return { success: "Workspace đã được cập nhật." };
}

export async function deleteWorkspaceAction(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  if (!workspaceId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(routes.login);

  const { data: workspace, error: workspaceError } = await supabase.from("workspaces").select("owner_id").eq("id", workspaceId).single();

  if (workspaceError || !workspace || workspace.owner_id !== user.id) {
    redirect(`/workspaces/${workspaceId}?error=delete_not_allowed`);
  }

  await supabase.from("workspaces").delete().eq("id", workspaceId);

  revalidatePath(routes.workspaces);
  revalidatePath(routes.projects);
  redirect(routes.workspaces);
}
