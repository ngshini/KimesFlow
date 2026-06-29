"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { updateWorkspaceAction, type WorkspaceActionState } from "@/actions/workspace.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { workspaceUpdateSchema, type WorkspaceUpdateInput } from "@/lib/validations/workspace.schema";
import type { Workspace } from "@/types/workspace";

type WorkspaceEditFormProps = {
  workspace: Workspace;
};

export function WorkspaceEditForm({ workspace }: WorkspaceEditFormProps) {
  const [isTransitionPending, startTransition] = useTransition();
  const [state, formAction, isActionPending] = useActionState(updateWorkspaceAction, {} satisfies WorkspaceActionState);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkspaceUpdateInput>({
    resolver: zodResolver(workspaceUpdateSchema),
    defaultValues: {
      workspaceId: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description ?? "",
    },
  });

  const isPending = isTransitionPending || isActionPending;

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit((values) => {
        const formData = new FormData();
        formData.set("workspaceId", values.workspaceId);
        formData.set("name", values.name);
        formData.set("slug", values.slug);
        formData.set("description", values.description ?? "");

        startTransition(() => formAction(formData));
      })}
    >
      <input type="hidden" {...register("workspaceId")} />
      <div className="space-y-1.5">
        <Input placeholder="Tên workspace" {...register("name")} />
        {errors.name?.message ? <p className="text-xs text-rose-600">{errors.name.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Input placeholder="slug-workspace" {...register("slug")} />
        {errors.slug?.message ? <p className="text-xs text-rose-600">{errors.slug.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Textarea placeholder="Mô tả workspace" {...register("description")} />
        {errors.description?.message ? <p className="text-xs text-rose-600">{errors.description.message}</p> : null}
      </div>
      {state.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p> : null}
      <Button disabled={isPending} type="submit">
        {isPending ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </form>
  );
}
