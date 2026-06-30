"use client";

import { useActionState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import {
  createTaskStatusAction,
  deleteTaskStatusAction,
  updateTaskStatusAction,
  type TaskActionState,
} from "@/actions/task.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Input } from "@/components/ui/input";
import type { Task, TaskStatus } from "@/types/task";

type WorkflowManagerProps = {
  projectId: string;
  statuses: TaskStatus[];
  tasks: Task[];
};

export function WorkflowManager({ projectId, statuses, tasks }: WorkflowManagerProps) {
  const [createState, createAction, createPending] = useActionState(createTaskStatusAction, {} satisfies TaskActionState);
  const [updateState, updateAction, updatePending] = useActionState(updateTaskStatusAction, {} satisfies TaskActionState);
  const [, startTransition] = useTransition();
  const taskCounts = new Map<string, number>();
  tasks.forEach((task) => taskCounts.set(task.statusId, (taskCounts.get(task.statusId) ?? 0) + 1));

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">Workflow</h2>
        <p className="mt-1 text-sm text-slate-500">Quản lý các cột Kanban riêng của project.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={createAction} className="grid gap-3 md:grid-cols-[1fr_120px_auto]">
          <input name="projectId" type="hidden" value={projectId} />
          <Input name="name" placeholder="Tên cột mới" />
          <Input name="color" type="color" defaultValue="#64748b" />
          <Button disabled={createPending} type="submit">
            {createPending ? "Đang tạo..." : "Thêm cột"}
          </Button>
          {createState.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 md:col-span-3">{createState.error}</p> : null}
          {createState.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 md:col-span-3">{createState.success}</p> : null}
        </form>

        <div className="space-y-3">
          {statuses.map((status) => {
            const count = taskCounts.get(status.id) ?? 0;
            return (
              <div key={status.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-[1fr_120px_90px_auto]">
                <form
                  action={(formData) => {
                    startTransition(() => updateAction(formData));
                  }}
                  className="contents"
                >
                  <input name="statusId" type="hidden" value={status.id} />
                  <Input name="name" defaultValue={status.name} />
                  <Input name="color" type="color" defaultValue={status.color ?? "#64748b"} />
                  <Input name="position" type="number" defaultValue={status.position} />
                  <Button disabled={updatePending} type="submit" variant="secondary">
                    Lưu
                  </Button>
                </form>
                <form action={deleteTaskStatusAction} className="md:col-start-4">
                  <input name="statusId" type="hidden" value={status.id} />
                  <input name="projectId" type="hidden" value={projectId} />
                  <ConfirmSubmitButton
                    className="w-full"
                    confirmMessage={count > 0 ? "Cột này đang có task. Database sẽ không cho xóa nếu còn task." : "Bạn chắc chắn muốn xóa cột này?"}
                    variant="danger"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa ({count})
                  </ConfirmSubmitButton>
                </form>
              </div>
            );
          })}
        </div>
        {updateState.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{updateState.error}</p> : null}
        {updateState.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{updateState.success}</p> : null}
      </CardContent>
    </Card>
  );
}
