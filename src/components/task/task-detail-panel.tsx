import { CalendarDays, Paperclip, Trash2 } from "lucide-react";
import { deleteTaskAction } from "@/actions/task.actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { AttachmentList } from "@/components/task/attachment-list";
import { AttachmentUploadForm } from "@/components/task/attachment-upload-form";
import { CommentForm } from "@/components/task/comment-form";
import { CommentList } from "@/components/task/comment-list";
import { SubtaskForm } from "@/components/task/subtask-form";
import { SubtaskList } from "@/components/task/subtask-list";
import { TaskEditForm } from "@/components/task/task-edit-form";
import { TaskRealtimeRefresh } from "@/components/task/task-realtime-refresh";
import type { Subtask, Task, TaskAttachment, TaskComment } from "@/types/task";

type TaskDetailPanelProps = {
  task: Task;
  assignees: {
    id: string;
    name: string;
  }[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  subtasks: Subtask[];
};

export function TaskDetailPanel({ task, assignees, comments, attachments, subtasks }: TaskDetailPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <TaskRealtimeRefresh taskId={task.id} />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Task detail</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">{task.title}</h1>
            </div>
            <Badge className="bg-blue-100 text-blue-700">{task.priority}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-slate-900">Chỉnh sửa task</h2>
            <div className="mt-4">
              <TaskEditForm assignees={assignees} task={task} />
            </div>
          </section>
          <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Subtask</h2>
            <div className="mt-4">
              <SubtaskForm taskId={task.id} />
            </div>
            <div className="mt-5">
              <SubtaskList subtasks={subtasks} />
            </div>
          </section>
          <section className="rounded-xl border border-dashed border-slate-300 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Comment</h2>
            <div className="mt-4">
              <CommentForm taskId={task.id} />
            </div>
            <div className="mt-5">
              <CommentList comments={comments} />
            </div>
          </section>
        </CardContent>
      </Card>
      <aside className="space-y-4">
        <Card className="sticky top-24">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={task.assignee?.name ?? "Unassigned"} src={task.assignee?.avatarUrl} />
              <div>
                <p className="text-xs text-slate-500">Người phụ trách</p>
                <p className="text-sm font-medium text-slate-900">{task.assignee?.name ?? "Chưa gán"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <CalendarDays className="h-4 w-4" />
              {task.dueDate ?? "Chưa có deadline"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Paperclip className="h-4 w-4" />
              File đính kèm
            </div>
            <AttachmentUploadForm taskId={task.id} />
            <AttachmentList attachments={attachments} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <form action={deleteTaskAction}>
              <input name="taskId" type="hidden" value={task.id} />
              <input name="projectId" type="hidden" value={task.projectId} />
              <ConfirmSubmitButton className="w-full" confirmMessage="Bạn chắc chắn muốn xóa task này?">
                <Trash2 className="h-4 w-4" />
                Xóa task
              </ConfirmSubmitButton>
            </form>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
