import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId, getUserWorkspaces } from "@/lib/data/workspaces";
import type { Project, ProjectRole } from "@/types/project";

type ProjectRow = {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
};

function mapProject(row: ProjectRow, workspaceName?: string, role?: ProjectRole): Project {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    workspaceName,
    name: row.name,
    slug: row.slug,
    description: row.description,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    role,
  };
}

export async function getUserProjects() {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const workspaces = await getUserWorkspaces();
  const workspaceIds = workspaces.map((workspace) => workspace.id);

  if (workspaceIds.length === 0) return [];

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, workspace_id, name, slug, description, color, created_at, updated_at")
    .in("workspace_id", workspaceIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const projectIds = projects.map((project) => project.id);
  const { data: memberships, error: membershipError } =
    projectIds.length > 0
      ? await supabase.from("project_members").select("project_id, role").eq("user_id", userId).in("project_id", projectIds)
      : { data: [], error: null };

  if (membershipError) throw new Error(membershipError.message);

  const workspaceNames = new Map(workspaces.map((workspace) => [workspace.id, workspace.name]));
  const rolesByProjectId = new Map(memberships.map((membership) => [membership.project_id, membership.role]));

  return projects.map((project) => mapProject(project, workspaceNames.get(project.workspace_id), rolesByProjectId.get(project.id)));
}

export async function getProjectById(projectId: string) {
  const supabase = await createClient();
  const workspaces = await getUserWorkspaces();

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, workspace_id, name, slug, description, color, created_at, updated_at")
    .eq("id", projectId)
    .single();

  if (error || !project) notFound();

  const workspace = workspaces.find((item) => item.id === project.workspace_id);
  if (!workspace) notFound();

  return mapProject(project, workspace.name, workspace.role === "owner" || workspace.role === "admin" ? "owner" : undefined);
}

export async function getWorkspaceProjects(workspaceId: string) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, workspace_id, name, slug, description, color, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (projects.length === 0) return [];

  const { data: memberships, error: membershipError } = await supabase
    .from("project_members")
    .select("project_id, role")
    .eq("user_id", userId)
    .in(
      "project_id",
      projects.map((project) => project.id),
    );

  if (membershipError) throw new Error(membershipError.message);

  const rolesByProjectId = new Map(memberships.map((membership) => [membership.project_id, membership.role]));

  return projects.map((project) => mapProject(project, undefined, rolesByProjectId.get(project.id)));
}
