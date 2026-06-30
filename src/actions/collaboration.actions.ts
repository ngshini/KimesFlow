"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";

const roleSchema = z.enum(["owner", "admin", "member", "viewer"]);

const createInviteSchema = z.object({
  workspaceId: z.uuid(),
  projectId: z.union([z.uuid(), z.literal("")]).optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  role: roleSchema,
});

const updateMemberSchema = z.object({
  scope: z.enum(["workspace", "project"]),
  workspaceId: z.uuid(),
  projectId: z.union([z.uuid(), z.literal("")]).optional(),
  memberId: z.uuid(),
  role: roleSchema,
});

const removeMemberSchema = updateMemberSchema.omit({ role: true });

export type CollaborationActionState = {
  error?: string;
  success?: string;
  inviteUrl?: string;
};

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function canManageWorkspace(workspaceId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role === "owner" || data?.role === "admin";
}

async function canManageProject(projectId: string, userId: string) {
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("workspace_id").eq("id", projectId).maybeSingle();
  if (!project) return false;
  if (await canManageWorkspace(project.workspace_id, userId)) return true;

  const { data } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  return data?.role === "owner" || data?.role === "admin";
}

async function notifyInviteRecipient(input: {
  workspaceId: string;
  projectId: string | null;
  email: string | null;
  inviteUrl: string;
  workspaceName: string;
  role: string;
}) {
  if (!input.email) return;

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("id, telegram_chat_id").ilike("email", input.email).maybeSingle();
  if (!profile) return;

  await supabase.from("notifications").insert({
    user_id: profile.id,
    workspace_id: input.workspaceId,
    project_id: input.projectId,
    title: "Bạn được mời tham gia workspace",
    body: `${input.workspaceName} · role ${input.role}`,
    message: input.inviteUrl,
    type: "invite.created",
    channel: "in_app",
    delivery_status: "sent",
    status: "pending",
  });

  await sendTelegramMessage(profile.telegram_chat_id, `KimesFlow invite\n${input.workspaceName}\nRole: ${input.role}\n${input.inviteUrl}`);
}

export async function createInviteAction(_prevState: CollaborationActionState, formData: FormData): Promise<CollaborationActionState> {
  const parsed = createInviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const { supabase, user } = await getCurrentUser();
  if (!user) return { error: "Bạn cần đăng nhập để mời thành viên." };

  const projectId = parsed.data.projectId || null;
  if (projectId) {
    const { data: project } = await supabase.from("projects").select("workspace_id").eq("id", projectId).eq("workspace_id", parsed.data.workspaceId).maybeSingle();
    if (!project) return { error: "Project không thuộc workspace hiện tại." };
    if (!(await canManageProject(projectId, user.id))) return { error: "Chỉ owner/admin mới được mời thành viên project." };
  } else {
    if (!(await canManageWorkspace(parsed.data.workspaceId, user.id))) {
      return { error: "Chỉ owner/admin mới được mời thành viên workspace." };
    }
  }

  const token = crypto.randomUUID().replaceAll("-", "");
  const { data: workspace } = await supabase.from("workspaces").select("name").eq("id", parsed.data.workspaceId).maybeSingle();
  const { error } = await supabase.from("workspace_invites").insert({
    workspace_id: parsed.data.workspaceId,
    project_id: projectId,
    email: parsed.data.email || null,
    role: parsed.data.role,
    token,
    invited_by: user.id,
  });

  if (error) return { error: error.message };

  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";
  const inviteUrl = `${origin}/invite/${token}`;

  await notifyInviteRecipient({
    workspaceId: parsed.data.workspaceId,
    projectId,
    email: parsed.data.email || null,
    inviteUrl,
    workspaceName: workspace?.name ?? "Workspace",
    role: parsed.data.role,
  });

  revalidatePath(`/workspaces/${parsed.data.workspaceId}`);
  if (projectId) revalidatePath(`/projects/${projectId}`);

  return { success: "Invite đã được tạo.", inviteUrl };
}

export async function acceptInviteAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Token invite không hợp lệ." };

  const { supabase, user } = await getCurrentUser();
  if (!user) redirect(`/login?next=/invite/${token}`);

  const { data, error } = await supabase.rpc("accept_workspace_invite", { invite_token: token });
  if (error) {
    const message = error.message.includes("invite_expired")
      ? "Invite đã hết hạn."
      : error.message.includes("invite_already_accepted")
        ? "Invite đã được sử dụng."
        : error.message.includes("invalid_invite")
          ? "Invite không hợp lệ."
          : error.message;
    return { error: message };
  }

  const result = data?.[0];
  if (!result) return { error: "Không thể tham gia invite này." };

  revalidatePath("/workspaces");
  revalidatePath("/projects");
  redirect(result.project_id ? `/projects/${result.project_id}` : `/workspaces/${result.workspace_id}`);
}

export async function updateMemberRoleAction(_prevState: CollaborationActionState, formData: FormData): Promise<CollaborationActionState> {
  const parsed = updateMemberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const { supabase, user } = await getCurrentUser();
  if (!user) return { error: "Bạn cần đăng nhập." };
  if (parsed.data.scope === "workspace") {
    if (!(await canManageWorkspace(parsed.data.workspaceId, user.id))) return { error: "Bạn không có quyền đổi role." };
    const { data: owners } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", parsed.data.workspaceId)
      .eq("role", "owner");
    const changingLastOwner = parsed.data.role !== "owner" && owners?.length === 1 && owners[0]?.id === parsed.data.memberId;
    if (changingLastOwner) return { error: "Không thể hạ quyền owner cuối cùng." };

    const { error } = await supabase.from("workspace_members").update({ role: parsed.data.role }).eq("id", parsed.data.memberId);
    if (error) return { error: error.message };
    revalidatePath(`/workspaces/${parsed.data.workspaceId}`);
  } else {
    if (!parsed.data.projectId) return { error: "Thiếu project." };
    if (!(await canManageProject(parsed.data.projectId, user.id))) return { error: "Bạn không có quyền đổi role project." };
    const { data: owners } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", parsed.data.projectId)
      .eq("role", "owner");
    const changingLastOwner = parsed.data.role !== "owner" && owners?.length === 1 && owners[0]?.id === parsed.data.memberId;
    if (changingLastOwner) return { error: "Không thể hạ quyền owner cuối cùng." };

    const { error } = await supabase.from("project_members").update({ role: parsed.data.role }).eq("id", parsed.data.memberId);
    if (error) return { error: error.message };
    revalidatePath(`/projects/${parsed.data.projectId}`);
  }

  return { success: "Role đã được cập nhật." };
}

export async function updateMemberRoleFormAction(formData: FormData) {
  await updateMemberRoleAction({}, formData);
}

export async function removeMemberAction(formData: FormData) {
  const parsed = removeMemberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const { supabase, user } = await getCurrentUser();
  if (!user) return;

  if (parsed.data.scope === "workspace") {
    if (!(await canManageWorkspace(parsed.data.workspaceId, user.id))) return;
    const { data: member } = await supabase.from("workspace_members").select("role").eq("id", parsed.data.memberId).maybeSingle();
    if (member?.role === "owner") {
      const { count } = await supabase
        .from("workspace_members")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", parsed.data.workspaceId)
        .eq("role", "owner");
      if ((count ?? 0) <= 1) return;
    }
    await supabase.from("workspace_members").delete().eq("id", parsed.data.memberId);
    revalidatePath(`/workspaces/${parsed.data.workspaceId}`);
  } else if (parsed.data.projectId) {
    if (!(await canManageProject(parsed.data.projectId, user.id))) return;
    const { data: member } = await supabase.from("project_members").select("role").eq("id", parsed.data.memberId).maybeSingle();
    if (member?.role === "owner") {
      const { count } = await supabase
        .from("project_members")
        .select("id", { count: "exact", head: true })
        .eq("project_id", parsed.data.projectId)
        .eq("role", "owner");
      if ((count ?? 0) <= 1) return;
    }
    await supabase.from("project_members").delete().eq("id", parsed.data.memberId);
    revalidatePath(`/projects/${parsed.data.projectId}`);
  }
}
