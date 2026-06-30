import Link from "next/link";
import { CalendarDays, GitFork, KanbanSquare, ListTodo, Settings, Users } from "lucide-react";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { MemberManagement } from "@/components/collaboration/member-management";
import { WorkflowManager } from "@/components/kanban/workflow-manager";
import { AiTaskGenerator } from "@/components/project/ai-task-generator";
import { ProjectDeleteButton } from "@/components/project/project-delete-button";
import { ProjectEditForm } from "@/components/project/project-edit-form";
import { ProjectMindmap } from "@/components/project/project-mindmap";
import { TaskCreateForm } from "@/components/task/task-create-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getProjectInvites, getProjectMembers } from "@/lib/data/collaboration";
import { getProjectAssignees, getProjectKanbanData, getProjectSubtasks } from "@/lib/data/tasks";

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params;
  const [{ project, statuses, tasks }, assignees, subtasks, projectMembers, projectInvites] = await Promise.all([
    getProjectKanbanData(projectId),
    getProjectAssignees(projectId),
    getProjectSubtasks(projectId),
    getProjectMembers(projectId),
    getProjectInvites(projectId),
  ]);
  const canManageProject = project.role === "owner" || project.role === "admin";
  const canWriteProject = project.role !== "viewer";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-950">{project.name}</h1>
            <Badge className="bg-blue-100 text-blue-700">{project.status ?? "active"}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">Workspace: {project.workspaceName}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{project.description}</p>
        </div>
        {canManageProject ? <ProjectDeleteButton projectId={project.id} /> : null}
        </div>
        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-slate-400">Progress</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${tasks.length ? Math.round((tasks.filter((task) => task.completedAt).length / tasks.length) * 100) : 0}%` }} />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">Task</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{tasks.length} task</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">Deadline</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{project.endDate ? new Date(project.endDate).toLocaleDateString("vi-VN") : "Chưa có"}</p>
          </div>
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {[
          ["Overview", "#overview", ListTodo],
          ["Kanban", "#kanban", KanbanSquare],
          ["Mindmap", "#mindmap", GitFork],
          ["Calendar", "#calendar", CalendarDays],
          ["Members", "#members", Users],
          ["Settings", "#settings", Settings],
        ].map(([label, href, Icon]) => (
          <Link key={String(label)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700" href={String(href)}>
            <Icon className="h-4 w-4" />
            {String(label)}
          </Link>
        ))}
      </nav>
      <Card id="overview">
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
      {canWriteProject ? (
        <section id="create-task">
          <TaskCreateForm assignees={assignees} projectId={project.id} statuses={statuses} />
        </section>
      ) : null}
      {canWriteProject ? <AiTaskGenerator projectId={project.id} statuses={statuses} /> : null}
      {canManageProject ? <div id="settings"><ProjectEditForm project={project} /></div> : null}
      {canManageProject ? <WorkflowManager projectId={project.id} statuses={statuses} tasks={tasks} /> : null}
      <div id="members">
      <MemberManagement
        canManage={canManageProject}
        invites={projectInvites}
        members={projectMembers}
        projectId={project.id}
        scope="project"
        title="Thành viên project"
        workspaceId={project.workspaceId}
      />
      </div>
      <div id="mindmap">
        <ProjectMindmap project={project} subtasks={subtasks} tasks={tasks} />
      </div>
      <div id="kanban">
      <KanbanBoard
        key={tasks.map((task) => `${task.id}:${task.statusId}:${task.position}`).join("|")}
        assignees={assignees}
        projectId={project.id}
        statuses={statuses}
        tasks={tasks}
      />
      </div>
    </div>
  );
}
