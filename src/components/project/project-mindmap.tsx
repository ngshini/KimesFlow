import { GitFork, ListTodo } from "lucide-react";
import Link from "next/link";
import { SubtaskForm } from "@/components/task/subtask-form";
import { SubtaskList } from "@/components/task/subtask-list";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Project } from "@/types/project";
import type { Subtask, Task } from "@/types/task";

type ProjectMindmapProps = {
  project: Project;
  tasks: Task[];
  subtasks: Subtask[];
};

export function ProjectMindmap({ project, tasks, subtasks }: ProjectMindmapProps) {
  const subtasksByTaskId = new Map<string, Subtask[]>();
  subtasks.forEach((subtask) => {
    subtasksByTaskId.set(subtask.taskId, [...(subtasksByTaskId.get(subtask.taskId) ?? []), subtask]);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GitFork className="h-4 w-4 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-950">Mindmap Project → Task → Subtask</h2>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="font-semibold text-slate-950">{project.name}</div>
            <Link className="text-sm font-medium text-blue-600 hover:text-blue-700" href="#create-task">
              Tạo task
            </Link>
          </div>
          {tasks.length === 0 ? <p className="mt-3 text-sm text-slate-500">Chưa có task để hiển thị cây công việc.</p> : null}
          <div className="mt-4 space-y-3 border-l border-slate-300 pl-4">
            {tasks.map((task) => (
              <div key={task.id} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <ListTodo className="h-4 w-4 text-slate-500" />
                  {task.title}
                  <span className="text-xs font-normal text-slate-400">
                    {task.completedSubtaskCount ?? 0}/{task.subtaskCount ?? 0}
                  </span>
                </div>
                <div className="ml-6 space-y-3 border-l border-slate-200 pl-3">
                  <SubtaskList subtasks={subtasksByTaskId.get(task.id) ?? []} />
                  <details className="rounded-md border border-slate-200 bg-white p-3">
                    <summary className="cursor-pointer text-xs font-medium text-blue-600">Thêm subtask</summary>
                    <div className="mt-3">
                      <SubtaskForm taskId={task.id} />
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
