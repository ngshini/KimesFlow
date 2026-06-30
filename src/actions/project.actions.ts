"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { projectSchema, projectUpdateSchema } from "@/lib/validations/project.schema";
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
      owner_id: user.id,
      created_by: user.id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      color: parsed.data.color || null,
      start_date: parsed.data.startDate || null,
      end_date: parsed.data.endDate || null,
      status: parsed.data.status ?? "active",
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
      is_default: true,
    })),
  );

  if (statusError) return { error: "Project đã tạo nhưng chưa thể tạo trạng thái Kanban mặc định. Vui lòng kiểm tra RLS policy." };

  revalidatePath(routes.projects);
  revalidatePath(`/projects/${project.id}`);

  return { success: "Project đã được tạo." };
}

export async function updateProjectAction(_prevState: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const parsed = projectUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Bạn cần đăng nhập để cập nhật project." };

  const { data: project, error: projectError } = await supabase.from("projects").select("workspace_id").eq("id", parsed.data.projectId).single();
  if (projectError || !project) return { error: "Không tìm thấy project." };

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", project.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) return { error: "Bạn không có quyền cập nhật project này." };

  const { error } = await supabase
    .from("projects")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      color: parsed.data.color || null,
      start_date: parsed.data.startDate || null,
      end_date: parsed.data.endDate || null,
      status: parsed.data.status ?? "active",
    })
    .eq("id", parsed.data.projectId);

  if (error) {
    if (error.code === "23505") return { error: "Slug project đã tồn tại trong workspace này." };
    return { error: error.message };
  }

  revalidatePath(routes.projects);
  revalidatePath(`/projects/${parsed.data.projectId}`);
  revalidatePath(`/workspaces/${project.workspace_id}`);

  return { success: "Project đã được cập nhật." };
}

export async function deleteProjectAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(routes.login);

  const { data: project, error: projectError } = await supabase.from("projects").select("id, workspace_id").eq("id", projectId).single();
  if (projectError || !project) redirect(routes.projects);

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", project.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    redirect(`/projects/${projectId}`);
  }

  await supabase.from("projects").delete().eq("id", projectId);

  revalidatePath(routes.projects);
  revalidatePath(`/workspaces/${project.workspace_id}`);
  redirect(routes.projects);
}
