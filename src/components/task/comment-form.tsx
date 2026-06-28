"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { createCommentAction, type CommentActionState } from "@/actions/comment.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommentFormProps = {
  taskId: string;
};

export function CommentForm({ taskId }: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isTransitionPending, startTransition] = useTransition();
  const [state, formAction, isActionPending] = useActionState(createCommentAction, {} satisfies CommentActionState);
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
      <Textarea name="content" placeholder="Viết bình luận..." />
      {state.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p> : null}
      <Button disabled={isPending} type="submit">
        {isPending ? "Đang gửi..." : "Gửi comment"}
      </Button>
    </form>
  );
}
