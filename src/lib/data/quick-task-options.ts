import { getUserProjects } from "@/lib/data/projects";
import { createClient } from "@/lib/supabase/server";

export async function getQuickTaskOptions() {
  const supabase = await createClient();
  const projects = await getUserProjects();
  const projectIds = projects.map((project) => project.id);

  if (projectIds.length === 0) return [];

  const { data: statuses, error: statusError } = await supabase
    .from("task_statuses")
    .select("id, project_id, name, position")
    .in("project_id", projectIds)
    .order("position", { ascending: true });

  if (statusError) throw new Error(statusError.message);

  const workspaceIds = [...new Set(projects.map((project) => project.workspaceId))];
  const { data: members, error: memberError } = await supabase
    .from("workspace_members")
    .select("workspace_id, user_id")
    .in("workspace_id", workspaceIds);

  if (memberError) throw new Error(memberError.message);

  const userIds = [...new Set(members.map((member) => member.user_id))];
  const { data: profiles, error: profileError } =
    userIds.length > 0 ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds) : { data: [], error: null };

  if (profileError) throw new Error(profileError.message);

  const profileById = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      {
        id: profile.id,
        name: profile.full_name ?? profile.email ?? "Người dùng",
      },
    ]),
  );

  return projects.map((project) => {
    const assignees = members
      .filter((member) => member.workspace_id === project.workspaceId)
      .map((member) => profileById.get(member.user_id))
      .filter((profile): profile is { id: string; name: string } => Boolean(profile));

    return {
      id: project.id,
      name: project.name,
      workspaceName: project.workspaceName ?? "Workspace",
      statuses: statuses
        .filter((status) => status.project_id === project.id)
        .map((status) => ({
          id: status.id,
          name: status.name,
        })),
      assignees,
    };
  });
}

export type QuickTaskProjectOption = Awaited<ReturnType<typeof getQuickTaskOptions>>[number];
