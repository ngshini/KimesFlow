"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { updateProjectAction, type ProjectActionState } from "@/actions/project.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { projectUpdateSchema, type ProjectUpdateInput } from "@/lib/validations/project.schema";
import type { Project } from "@/types/project";

type ProjectEditFormProps = {
  project: Project;
};

export function ProjectEditForm({ project }: ProjectEditFormProps) {
  const [isTransitionPending, startTransition] = useTransition();
  const [state, formAction, isActionPending] = useActionState(updateProjectAction, {} satisfies ProjectActionState);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectUpdateInput>({
    resolver: zodResolver(projectUpdateSchema),
    defaultValues: {
      projectId: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description ?? "",
      color: project.color ?? "#2563eb",
      startDate: project.startDate ?? "",
      endDate: project.endDate ?? "",
      status: project.status ?? "active",
    },
  });
  const isPending = isTransitionPending || isActionPending;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">Cấu hình project</h2>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-2"
          noValidate
          onSubmit={handleSubmit((values) => {
            const formData = new FormData();
            formData.set("projectId", project.id);
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
          <input type="hidden" {...register("projectId")} />
          <div className="space-y-1.5">
            <Input placeholder="Tên project" {...register("name")} />
            {errors.name?.message ? <p className="text-xs text-rose-600">{errors.name.message}</p> : null}
          </div>
          <Input placeholder="slug-project" {...register("slug")} />
          <Input type="color" {...register("color")} />
          <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" {...register("status")}>
            <option value="planned">Lên kế hoạch</option>
            <option value="active">Đang chạy</option>
            <option value="paused">Tạm dừng</option>
            <option value="completed">Hoàn thành</option>
            <option value="archived">Lưu trữ</option>
          </select>
          <Input type="date" {...register("startDate")} />
          <Input type="date" {...register("endDate")} />
          <div className="md:col-span-2">
            <Textarea placeholder="Mô tả project" {...register("description")} />
          </div>
          {state.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 md:col-span-2">{state.error}</p> : null}
          {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 md:col-span-2">{state.success}</p> : null}
          <Button className="md:w-36" disabled={isPending} type="submit">
            {isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
