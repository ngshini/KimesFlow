import { ProjectCard } from "@/components/project/project-card";
import { ProjectCreateForm } from "@/components/project/project-create-form";
import { Card, CardContent } from "@/components/ui/card";
import { getUserProjects } from "@/lib/data/projects";
import { getUserWorkspaces } from "@/lib/data/workspaces";

export default async function ProjectsPage() {
  const [projects, workspaces] = await Promise.all([getUserProjects(), getUserWorkspaces()]);
  const creatableWorkspaces = workspaces.filter((workspace) => workspace.role !== "viewer");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">Các project thuộc workspace mà bạn đang tham gia.</p>
      </div>
      <ProjectCreateForm workspaces={creatableWorkspaces} />
      {projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500">Chưa có project nào. Hãy tạo project đầu tiên trong một workspace.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
