import { KanbanBoard } from "@/components/kanban/kanban-board";
import { WorkflowManager } from "@/components/kanban/workflow-manager";
import { AiTaskGenerator } from "@/components/project/ai-task-generator";
import { ProjectDeleteButton } from "@/components/project/project-delete-button";
import { ProjectEditForm } from "@/components/project/project-edit-form";
import { ProjectMindmap } from "@/components/project/project-mindmap";
import { TaskCreateForm } from "@/components/task/task-create-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getProjectAssignees, getProjectKanbanData, getProjectSubtasks } from "@/lib/data/tasks";

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params;
  const [{ project, statuses, tasks }, assignees, subtasks] = await Promise.all([
    getProjectKanbanData(projectId),
    getProjectAssignees(projectId),
    getProjectSubtasks(projectId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-950">{project.name}</h1>
            <Badge className="bg-blue-100 text-blue-700">Kanban</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">Workspace: {project.workspaceName}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{project.description}</p>
        </div>
        {project.role === "owner" ? <ProjectDeleteButton projectId={project.id} /> : null}
      </div>
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-slate-400">Slug</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{project.slug}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">Workspace</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{project.workspaceName}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">Ngày tạo</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{new Date(project.createdAt).toLocaleDateString("vi-VN")}</p>
          </div>
        </CardContent>
      </Card>
      <TaskCreateForm assignees={assignees} projectId={project.id} statuses={statuses} />
      <AiTaskGenerator projectId={project.id} statuses={statuses} />
      {project.role === "owner" ? <ProjectEditForm project={project} /> : null}
      {project.role === "owner" ? <WorkflowManager projectId={project.id} statuses={statuses} tasks={tasks} /> : null}
      <ProjectMindmap project={project} subtasks={subtasks} tasks={tasks} />
      <KanbanBoard key={tasks.map((task) => `${task.id}:${task.statusId}:${task.position}`).join("|")} projectId={project.id} statuses={statuses} tasks={tasks} />
    </div>
  );
}
