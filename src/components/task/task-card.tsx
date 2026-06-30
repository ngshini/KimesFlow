import { format } from "date-fns";
import { CalendarDays, MessageSquare, Paperclip } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types/task";

const priorityClass = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-rose-100 text-rose-700",
};

type TaskCardProps = {
  task: Task;
};

export function TaskCard({ task }: TaskCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Link className="text-sm font-semibold leading-5 text-slate-950 hover:text-blue-600" href={`/tasks/${task.id}`}>
          {task.title}
        </Link>
        <Badge className={priorityClass[task.priority]}>{task.priority}</Badge>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{task.description}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7" name={task.assignee?.name ?? "Unassigned"} src={task.assignee?.avatarUrl} />
          <span>{task.assignee?.name ?? "Chưa gán"}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {task.dueDate ? (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {format(new Date(task.dueDate), "dd/MM/yyyy")}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          {task.commentCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <Paperclip className="h-3.5 w-3.5" />
          {task.attachmentCount}
        </span>
        {(task.subtaskCount ?? 0) > 0 ? (
          <span>
            Subtask {task.completedSubtaskCount}/{task.subtaskCount}
          </span>
        ) : null}
      </div>
    </article>
  );
}
