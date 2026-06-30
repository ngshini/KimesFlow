"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { createSubtaskAction, type TaskActionState } from "@/actions/task.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type SubtaskFormProps = {
  taskId: string;
};

export function SubtaskForm({ taskId }: SubtaskFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isTransitionPending, startTransition] = useTransition();
  const [state, formAction, isActionPending] = useActionState(createSubtaskAction, {} satisfies TaskActionState);
  const isPending = isTransitionPending || isActionPending;

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      <input name="taskId" type="hidden" value={taskId} />
      <Input name="title" placeholder="Tên subtask" />
      <Textarea name="description" placeholder="Mô tả subtask" />
      {state.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p> : null}
      <Button disabled={isPending} type="submit" variant="secondary">
        {isPending ? "Đang tạo..." : "Thêm subtask"}
      </Button>
    </form>
  );
}
