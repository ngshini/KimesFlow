import { createClient } from "@/lib/supabase/server";

export type CollaborationRole = "owner" | "admin" | "member" | "viewer";

export type MemberListItem = {
  id: string;
  userId: string;
  role: CollaborationRole;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export type InviteListItem = {
  id: string;
  email: string | null;
  role: CollaborationRole;
  token: string;
  projectId: string | null;
  expiresAt: string;
  acceptedAt: string | null;
};

async function getProfilesByUserId(userIds: string[]) {
  const supabase = await createClient();
  if (userIds.length === 0) return new Map<string, { fullName: string | null; email: string | null; avatarUrl: string | null }>();

  const { data, error } = await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", userIds);
  if (error) throw new Error(error.message);

  return new Map(
    data.map((profile) => [
      profile.id,
      {
        fullName: profile.full_name,
        email: profile.email,
        avatarUrl: profile.avatar_url,
      },
    ]),
  );
}

export async function getWorkspaceMembers(workspaceId: string) {
  const supabase = await createClient();
  const { data: members, error } = await supabase
    .from("workspace_members")
    .select("id, user_id, role")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const profiles = await getProfilesByUserId(members.map((member) => member.user_id));
  return members.map((member): MemberListItem => {
    const profile = profiles.get(member.user_id);
    return {
      id: member.id,
      userId: member.user_id,
      role: member.role,
      fullName: profile?.fullName ?? null,
      email: profile?.email ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
    };
  });
}

export async function getProjectMembers(projectId: string) {
  const supabase = await createClient();
  const { data: members, error } = await supabase
    .from("project_members")
    .select("id, user_id, role")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const profiles = await getProfilesByUserId(members.map((member) => member.user_id));
  return members.map((member): MemberListItem => {
    const profile = profiles.get(member.user_id);
    return {
      id: member.id,
      userId: member.user_id,
      role: member.role,
      fullName: profile?.fullName ?? null,
      email: profile?.email ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
    };
  });
}

export async function getWorkspaceInvites(workspaceId: string, projectId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("workspace_invites")
    .select("id, email, role, token, project_id, expires_at, accepted_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  query = projectId ? query.eq("project_id", projectId) : query.is("project_id", null);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data.map((invite): InviteListItem => ({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    token: invite.token,
    projectId: invite.project_id,
    expiresAt: invite.expires_at,
    acceptedAt: invite.accepted_at,
  }));
}

export async function getProjectInvites(projectId: string) {
  const supabase = await createClient();
  const { data: project, error } = await supabase.from("projects").select("workspace_id").eq("id", projectId).single();
  if (error) throw new Error(error.message);
  return getWorkspaceInvites(project.workspace_id, projectId);
}

export async function getInviteByToken(token: string) {
  const supabase = await createClient();
  const { data: invite, error } = await supabase
    .from("workspace_invites")
    .select("id, workspace_id, project_id, email, role, token, invited_by, expires_at, accepted_at, created_at")
    .eq("token", token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!invite) return null;

  const [{ data: workspace }, { data: project }, profiles] = await Promise.all([
    supabase.from("workspaces").select("id, name").eq("id", invite.workspace_id).maybeSingle(),
    invite.project_id ? supabase.from("projects").select("id, name").eq("id", invite.project_id).maybeSingle() : Promise.resolve({ data: null }),
    getProfilesByUserId([invite.invited_by]),
  ]);

  const inviter = profiles.get(invite.invited_by);

  return {
    id: invite.id,
    workspaceId: invite.workspace_id,
    workspaceName: workspace?.name ?? "Workspace",
    projectId: invite.project_id,
    projectName: project?.name ?? null,
    email: invite.email,
    role: invite.role,
    token: invite.token,
    expiresAt: invite.expires_at,
    isExpired: new Date(invite.expires_at).getTime() < Date.now(),
    acceptedAt: invite.accepted_at,
    invitedBy: inviter?.fullName ?? inviter?.email ?? "Một thành viên",
  };
}
