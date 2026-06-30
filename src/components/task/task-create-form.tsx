"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useState, useTransition } from "react";
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
  const [submitMode, setSubmitMode] = useState<"create" | "create-more">("create");
  const [isTransitionPending, startTransition] = useTransition();
  const [state, formAction, isActionPending] = useActionState(createTaskAction, {} satisfies TaskActionState);
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      projectId,
      statusId: firstStatusId,
      title: "",
      description: "",
      assigneeId: "",
      startDate: "",
      dueDate: "",
      priority: "medium",
    },
  });

  useEffect(() => {
    if (state.success) {
      const currentStatusId = getValues("statusId") || firstStatusId;
      reset({
        projectId,
        statusId: submitMode === "create-more" ? currentStatusId : firstStatusId,
        title: "",
        description: "",
        assigneeId: "",
        startDate: "",
        dueDate: "",
        priority: "medium",
      });
    }
  }, [firstStatusId, getValues, projectId, reset, state.success, submitMode]);

  const isPending = isTransitionPending || isActionPending;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">Tạo task nhanh</h2>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 lg:grid-cols-[1fr_180px_180px_140px_180px]"
          noValidate
          onSubmit={handleSubmit((values) => {
            const formData = new FormData();
            formData.set("projectId", projectId);
            formData.set("statusId", values.statusId);
            formData.set("title", values.title);
            formData.set("description", values.description ?? "");
            formData.set("assigneeId", values.assigneeId ?? "");
            formData.set("startDate", values.startDate ?? "");
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
          <Input type="date" {...register("dueDate")} />
          <div className="flex gap-2 lg:col-span-5">
            <Button disabled={isPending || statuses.length === 0} type="submit" onClick={() => setSubmitMode("create")}>
              {isPending && submitMode === "create" ? "Đang tạo..." : "Tạo"}
            </Button>
            <Button disabled={isPending || statuses.length === 0} type="submit" variant="secondary" onClick={() => setSubmitMode("create-more")}>
              {isPending && submitMode === "create-more" ? "Đang tạo..." : "Tạo thêm"}
            </Button>
          </div>
          <details className="lg:col-span-5">
            <summary className="cursor-pointer text-sm font-medium text-slate-600">Tùy chọn nâng cao</summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Input type="date" {...register("startDate")} />
              <div className="space-y-1.5 md:col-span-2">
                <Textarea placeholder="Mô tả task" {...register("description")} />
                {errors.description?.message ? <p className="text-xs text-rose-600">{errors.description.message}</p> : null}
              </div>
            </div>
          </details>
          {state.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 lg:col-span-5">{state.error}</p> : null}
          {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 lg:col-span-5">{state.success}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
