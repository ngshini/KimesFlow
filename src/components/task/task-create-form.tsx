"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createTaskAction, type TaskActionState } from "@/actions/task.actions";
import { PRIORITIES } from "@/constants/task-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { taskSchema, type TaskInput } from "@/lib/validations/task.schema";
import type { TaskStatus } from "@/types/task";

type AssigneeOption = {
  id: string;
  name: string;
};

type TaskCreateFormProps = {
  projectId: string;
  statuses: TaskStatus[];
  assignees: AssigneeOption[];
};

export function TaskCreateForm({ projectId, statuses, assignees }: TaskCreateFormProps) {
  const firstStatusId = statuses[0]?.id ?? "";
  const [isTransitionPending, startTransition] = useTransition();
  const [state, formAction, isActionPending] = useActionState(createTaskAction, {} satisfies TaskActionState);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      projectId,
      statusId: firstStatusId,
      title: "",
      description: "",
      assigneeId: "",
      dueDate: "",
      priority: "medium",
    },
  });

  useEffect(() => {
    if (state.success) {
      reset({
        projectId,
        statusId: firstStatusId,
        title: "",
        description: "",
        assigneeId: "",
        dueDate: "",
        priority: "medium",
      });
    }
  }, [firstStatusId, projectId, reset, state.success]);

  const isPending = isTransitionPending || isActionPending;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">Tạo task</h2>
        <p className="mt-1 text-sm text-slate-500">Task mới sẽ được lưu vào project hiện tại.</p>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 lg:grid-cols-[1fr_180px_180px_140px_auto]"
          noValidate
          onSubmit={handleSubmit((values) => {
            const formData = new FormData();
            formData.set("projectId", projectId);
            formData.set("statusId", values.statusId);
            formData.set("title", values.title);
            formData.set("description", values.description ?? "");
            formData.set("assigneeId", values.assigneeId ?? "");
            formData.set("dueDate", values.dueDate ?? "");
            formData.set("priority", values.priority);

            startTransition(() => formAction(formData));
          })}
        >
          <div className="space-y-1.5">
            <Input placeholder="Tiêu đề task" {...register("title")} />
            {errors.title?.message ? <p className="text-xs text-rose-600">{errors.title.message}</p> : null}
          </div>
          <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" {...register("statusId")}>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
          <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" {...register("assigneeId")}>
            <option value="">Chưa gán</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
          <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" {...register("priority")}>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          <Button disabled={isPending || statuses.length === 0} type="submit">
            {isPending ? "Đang tạo..." : "Tạo"}
          </Button>
          <Input className="lg:col-span-2" type="date" {...register("dueDate")} />
          <div className="lg:col-span-3" />
          <div className="space-y-1.5 lg:col-span-5">
            <Textarea placeholder="Mô tả task" {...register("description")} />
            {errors.description?.message ? <p className="text-xs text-rose-600">{errors.description.message}</p> : null}
          </div>
          {state.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 lg:col-span-5">{state.error}</p> : null}
          {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 lg:col-span-5">{state.success}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
