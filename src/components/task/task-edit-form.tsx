"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { updateTaskAction, type TaskActionState } from "@/actions/task.actions";
import { PRIORITIES } from "@/constants/task-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateTaskSchema, type UpdateTaskInput } from "@/lib/validations/task.schema";
import type { Task } from "@/types/task";

type AssigneeOption = {
  id: string;
  name: string;
};

type TaskEditFormProps = {
  task: Task;
  assignees: AssigneeOption[];
};

export function TaskEditForm({ task, assignees }: TaskEditFormProps) {
  const [isTransitionPending, startTransition] = useTransition();
  const [state, formAction, isActionPending] = useActionState(updateTaskAction, {} satisfies TaskActionState);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      taskId: task.id,
      title: task.title,
      description: task.description ?? "",
      assigneeId: task.assignee?.id ?? "",
      dueDate: task.dueDate ?? "",
      priority: task.priority,
    },
  });

  const isPending = isTransitionPending || isActionPending;

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit((values) => {
        const formData = new FormData();
        formData.set("taskId", task.id);
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
      <Textarea placeholder="Mô tả task" {...register("description")} />
      <div className="grid gap-4 md:grid-cols-3">
        <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" {...register("assigneeId")}>
          <option value="">Chưa gán</option>
          {assignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.name}
            </option>
          ))}
        </select>
        <Input type="date" {...register("dueDate")} />
        <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" {...register("priority")}>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>
      {state.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p> : null}
      <Button disabled={isPending} type="submit">
        {isPending ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </form>
  );
}
