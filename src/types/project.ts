export type ProjectRole = "owner" | "admin" | "member" | "viewer";
export type ProjectStatus = "planned" | "active" | "paused" | "completed" | "archived";

export type Project = {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  ownerId?: string | null;
  createdBy?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  role?: ProjectRole;
};
