import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { ProjectCard } from "@/components/project/project-card";
import { ProjectCreateForm } from "@/components/project/project-create-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getUserProjects } from "@/lib/data/projects";
import { getUserWorkspaces } from "@/lib/data/workspaces";

export default async function ProjectsPage() {
  const [projects, workspaces] = await Promise.all([getUserProjects(), getUserWorkspaces()]);
  const creatableWorkspaces = workspaces.filter((workspace) => workspace.role !== "viewer");

  return (
    <div className="space-y-6">
      <PageHeader description="Theo dõi tiến độ, deadline và workflow của các project bạn đang tham gia." title="Projects" />
      <section id="create-project">
        <ProjectCreateForm workspaces={creatableWorkspaces} />
      </section>
      {projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState
          action={
            <Link className="text-sm font-medium text-blue-600 hover:text-blue-700" href="#create-project">
              Tạo project đầu tiên
            </Link>
          }
          description="Project giúp bạn gom task, workflow, member và tài liệu theo mục tiêu cụ thể."
          icon={FolderKanban}
          title="Chưa có project"
        />
      )}
    </div>
  );
}
