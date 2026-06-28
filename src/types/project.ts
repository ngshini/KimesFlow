export type ProjectRole = "owner" | "manager" | "member" | "viewer";

export type Project = {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
  role?: ProjectRole;
};
