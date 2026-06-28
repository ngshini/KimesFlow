import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DashboardData } from "@/lib/data/dashboard";

type TaskListProps = {
  title: string;
  emptyLabel: string;
  tasks: DashboardData["nearDeadlineTasks"];
};

export function DashboardTaskList({ title, emptyLabel, tasks }: TaskListProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Link key={task.id} className="block rounded-md border border-slate-200 p-3 hover:bg-slate-50" href={`/tasks/${task.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-950">{task.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{task.projectName}</p>
                  </div>
                  <Badge className="bg-slate-100 text-slate-600">{task.priority}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{task.statusName}</span>
                  {task.dueDate ? <span>Deadline {format(parseISO(task.dueDate), "dd/MM/yyyy")}</span> : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentProjectsList({ projects }: { projects: DashboardData["recentProjects"] }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">Project gần đây</h2>
      </CardHeader>
      <CardContent>
        {projects.length > 0 ? (
          <div className="space-y-3">
            {projects.map((project) => (
              <Link key={project.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50" href={`/projects/${project.id}`}>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
                  <div>
                    <p className="text-sm font-medium text-slate-950">{project.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{project.workspaceName}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{project.createdAt}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Chưa có project nào.</p>
        )}
      </CardContent>
    </Card>
  );
}
