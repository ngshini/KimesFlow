import Link from "next/link";
import { TaskCard } from "@/components/task/task-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PRIORITIES } from "@/constants/task-status";
import { getUserProjects } from "@/lib/data/projects";
import { getUserTaskList } from "@/lib/data/tasks";

type TasksPageProps = {
  searchParams: Promise<{
    projectId?: string;
    statusId?: string;
    priority?: string;
    assignee?: string;
    overdue?: string;
    query?: string;
  }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const [projects, tasks] = await Promise.all([
    getUserProjects(),
    getUserTaskList({
      projectId: params.projectId,
      statusId: params.statusId,
      priority: params.priority,
      assignee: params.assignee,
      overdue: params.overdue === "true",
      query: params.query,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">Danh sách task thật từ các workspace/project bạn tham gia.</p>
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">Bộ lọc</h2>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-4">
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" name="projectId" defaultValue={params.projectId ?? ""}>
              <option value="">Tất cả project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" name="priority" defaultValue={params.priority ?? ""}>
              <option value="">Tất cả priority</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" name="assignee" defaultValue={params.assignee ?? ""}>
              <option value="">Tất cả assignee</option>
              <option value="me">Task của tôi</option>
            </select>
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" name="overdue" defaultValue={params.overdue ?? ""}>
              <option value="">Tất cả deadline</option>
              <option value="true">Quá hạn</option>
            </select>
            <button className="h-10 rounded-md bg-blue-600 px-4 text-sm font-medium text-white md:w-28" type="submit">
              Lọc
            </button>
            <Link className="inline-flex h-10 items-center text-sm font-medium text-slate-500" href="/tasks">
              Xóa lọc
            </Link>
          </form>
        </CardContent>
      </Card>
      {tasks.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500">Không có task phù hợp bộ lọc.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
