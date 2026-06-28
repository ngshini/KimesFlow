"use server";

import { revalidatePath } from "next/cache";
import { workspaceSchema } from "@/lib/validations/workspace.schema";
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
