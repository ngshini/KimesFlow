"use server";

import { revalidatePath } from "next/cache";
import { projectSchema } from "@/lib/validations/project.schema";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/constants/routes";
import { DEFAULT_TASK_STATUSES } from "@/constants/task-status";

export type ProjectActionState = {
  error?: string;
  success?: string;
};

export async function createProjectAction(_prevState: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Bạn cần đăng nhập để tạo project." };

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", parsed.data.workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) return { error: membershipError.message };
  if (!membership || membership.role === "viewer") return { error: "Bạn không có quyền tạo project trong workspace này." };

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: parsed.data.workspaceId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      color: parsed.data.color || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Slug project đã tồn tại trong workspace này. Vui lòng chọn slug khác." };
    return { error: error.message };
  }

  const { error: memberError } = await supabase.from("project_members").insert({
    project_id: project.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) return { error: "Project đã tạo nhưng chưa thể gán quyền owner. Vui lòng kiểm tra RLS policy." };

  const { error: statusError } = await supabase.from("task_statuses").insert(
    DEFAULT_TASK_STATUSES.map((status) => ({
      project_id: project.id,
      name: status.name,
      slug: status.slug,
      color: status.color,
      position: status.position,
    })),
  );

  if (statusError) return { error: "Project đã tạo nhưng chưa thể tạo trạng thái Kanban mặc định. Vui lòng kiểm tra RLS policy." };

  revalidatePath(routes.projects);
  revalidatePath(`/projects/${project.id}`);

  return { success: "Project đã được tạo." };
}
