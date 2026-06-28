import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/constants/routes";
import type { Workspace, WorkspaceRole } from "@/types/workspace";

type WorkspaceRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

function mapWorkspace(row: WorkspaceRow, role?: WorkspaceRole): Workspace {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    role,
  };
}

export async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(routes.login);

  return user.id;
}

export async function getUserWorkspaces() {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  const { data: memberships, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId);

  if (membershipError) throw new Error(membershipError.message);

  const workspaceIds = memberships.map((membership) => membership.workspace_id);
  if (workspaceIds.length === 0) return [];

  const { data: workspaces, error } = await supabase
    .from("workspaces")
    .select("id, owner_id, name, slug, description, created_at, updated_at")
    .in("id", workspaceIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rolesByWorkspaceId = new Map(memberships.map((membership) => [membership.workspace_id, membership.role]));

  return workspaces.map((workspace) => mapWorkspace(workspace, rolesByWorkspaceId.get(workspace.id)));
}
