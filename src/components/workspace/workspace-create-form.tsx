"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createWorkspaceAction, type WorkspaceActionState } from "@/actions/workspace.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { workspaceSchema, type WorkspaceInput } from "@/lib/validations/workspace.schema";

export function WorkspaceCreateForm() {
  const [isTransitionPending, startTransition] = useTransition();
  const [state, formAction, isActionPending] = useActionState(createWorkspaceAction, {} satisfies WorkspaceActionState);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkspaceInput>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  useEffect(() => {
    if (state.success) reset();
  }, [reset, state.success]);

  const isPending = isTransitionPending || isActionPending;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">Tạo workspace</h2>
        <p className="mt-1 text-sm text-slate-500">Người tạo workspace sẽ tự động có role owner.</p>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]"
          noValidate
          onSubmit={handleSubmit((values) => {
            const formData = new FormData();
            formData.set("name", values.name);
            formData.set("slug", values.slug);
            formData.set("description", values.description ?? "");

            startTransition(() => formAction(formData));
          })}
        >
          <div className="space-y-1.5">
            <Input placeholder="Tên workspace" {...register("name")} />
            {errors.name?.message ? <p className="text-xs text-rose-600">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Input placeholder="slug-workspace" {...register("slug")} />
            {errors.slug?.message ? <p className="text-xs text-rose-600">{errors.slug.message}</p> : null}
          </div>
          <Button className="lg:w-36" disabled={isPending} type="submit">
            {isPending ? "Đang tạo..." : "Tạo"}
          </Button>
          <div className="space-y-1.5 lg:col-span-3">
            <Textarea placeholder="Mô tả workspace" {...register("description")} />
            {errors.description?.message ? <p className="text-xs text-rose-600">{errors.description.message}</p> : null}
          </div>
          {state.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 lg:col-span-3">{state.error}</p> : null}
          {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 lg:col-span-3">{state.success}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
