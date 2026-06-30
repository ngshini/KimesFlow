"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createProjectAction, type ProjectActionState } from "@/actions/project.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { projectSchema, type ProjectInput } from "@/lib/validations/project.schema";
import type { Workspace } from "@/types/workspace";

type ProjectCreateFormProps = {
  workspaces: Workspace[];
};

export function ProjectCreateForm({ workspaces }: ProjectCreateFormProps) {
  const [isTransitionPending, startTransition] = useTransition();
  const [state, formAction, isActionPending] = useActionState(createProjectAction, {} satisfies ProjectActionState);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      workspaceId: workspaces[0]?.id ?? "",
      name: "",
      slug: "",
      description: "",
      color: "#2563eb",
      startDate: "",
      endDate: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (state.success) {
      reset({
        workspaceId: workspaces[0]?.id ?? "",
        name: "",
        slug: "",
        description: "",
        color: "#2563eb",
        startDate: "",
        endDate: "",
        status: "active",
      });
    }
  }, [reset, state.success, workspaces]);

  const isPending = isTransitionPending || isActionPending;
  const hasWorkspaces = workspaces.length > 0;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">Tạo project</h2>
        <p className="mt-1 text-sm text-slate-500">Chọn workspace mà bạn đang tham gia để tạo project mới.</p>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 lg:grid-cols-[1fr_1fr_120px_auto]"
          noValidate
          onSubmit={handleSubmit((values) => {
            const formData = new FormData();
            formData.set("workspaceId", values.workspaceId);
            formData.set("name", values.name);
            formData.set("slug", values.slug);
            formData.set("description", values.description ?? "");
            formData.set("color", values.color ?? "");
            formData.set("startDate", values.startDate ?? "");
            formData.set("endDate", values.endDate ?? "");
            formData.set("status", values.status ?? "active");

            startTransition(() => formAction(formData));
          })}
        >
          <div className="space-y-1.5">
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={!hasWorkspaces}
              {...register("workspaceId")}
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
            {errors.workspaceId?.message ? <p className="text-xs text-rose-600">{errors.workspaceId.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Input disabled={!hasWorkspaces} placeholder="Tên project" {...register("name")} />
            {errors.name?.message ? <p className="text-xs text-rose-600">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Input disabled={!hasWorkspaces} type="color" {...register("color")} />
            {errors.color?.message ? <p className="text-xs text-rose-600">{errors.color.message}</p> : null}
          </div>
          <Button className="lg:w-36" disabled={isPending || !hasWorkspaces} type="submit">
            {isPending ? "Đang tạo..." : "Tạo"}
          </Button>
          <div className="space-y-1.5 lg:col-span-4">
            <Input disabled={!hasWorkspaces} placeholder="slug-project" {...register("slug")} />
            {errors.slug?.message ? <p className="text-xs text-rose-600">{errors.slug.message}</p> : null}
          </div>
          <Input disabled={!hasWorkspaces} type="date" {...register("startDate")} />
          <Input disabled={!hasWorkspaces} type="date" {...register("endDate")} />
          <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" disabled={!hasWorkspaces} {...register("status")}>
            <option value="planned">Lên kế hoạch</option>
            <option value="active">Đang chạy</option>
            <option value="paused">Tạm dừng</option>
            <option value="completed">Hoàn thành</option>
            <option value="archived">Lưu trữ</option>
          </select>
          <div />
          <div className="space-y-1.5 lg:col-span-4">
            <Textarea disabled={!hasWorkspaces} placeholder="Mô tả project" {...register("description")} />
            {errors.description?.message ? <p className="text-xs text-rose-600">{errors.description.message}</p> : null}
          </div>
          {!hasWorkspaces ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 lg:col-span-4">Bạn cần tạo hoặc tham gia workspace trước khi tạo project.</p>
          ) : null}
          {state.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 lg:col-span-4">{state.error}</p> : null}
          {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 lg:col-span-4">{state.success}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
