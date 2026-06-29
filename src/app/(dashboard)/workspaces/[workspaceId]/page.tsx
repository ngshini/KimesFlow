import Link from "next/link";
import { ArrowLeft, FolderKanban } from "lucide-react";
import { ProjectCard } from "@/components/project/project-card";
import { ProjectCreateForm } from "@/components/project/project-create-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WorkspaceDeleteButton } from "@/components/workspace/workspace-delete-button";
import { WorkspaceEditForm } from "@/components/workspace/workspace-edit-form";
import { routes } from "@/constants/routes";
import { getWorkspaceProjects } from "@/lib/data/projects";
import { getWorkspaceById } from "@/lib/data/workspaces";

type WorkspaceDetailPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function WorkspaceDetailPage({ params }: WorkspaceDetailPageProps) {
  const { workspaceId } = await params;
  const [workspace, projects] = await Promise.all([getWorkspaceById(workspaceId), getWorkspaceProjects(workspaceId)]);
  const isOwner = workspace.role === "owner";
  const canCreateProject = workspace.role !== "viewer";

  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900" href={routes.workspaces}>
        <ArrowLeft className="h-4 w-4" />
        Quay lại workspaces
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-950">{workspace.name}</h1>
            {workspace.role ? <Badge className="bg-blue-100 text-blue-700">{workspace.role}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-slate-500">/{workspace.slug}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{workspace.description || "Workspace chưa có mô tả."}</p>
        </div>
        {isOwner ? <WorkspaceDeleteButton workspaceId={workspace.id} /> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">Thông tin workspace</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase text-slate-400">Ngày tạo</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{new Date(workspace.createdAt).toLocaleDateString("vi-VN")}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Cập nhật</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{new Date(workspace.updatedAt).toLocaleDateString("vi-VN")}</p>
              </div>
            </CardContent>
          </Card>

          {isOwner ? (
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-slate-950">Chỉnh sửa workspace</h2>
              </CardHeader>
              <CardContent>
                <WorkspaceEditForm workspace={workspace} />
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {canCreateProject ? <ProjectCreateForm workspaces={[workspace]} /> : null}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-950">Project trong workspace</h2>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {projects.map((project) => (
                    <ProjectCard key={project.id} project={{ ...project, workspaceName: workspace.name }} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Workspace này chưa có project nào.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
