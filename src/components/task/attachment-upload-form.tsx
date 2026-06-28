"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Upload } from "lucide-react";
import { uploadTaskAttachmentAction, type AttachmentActionState } from "@/actions/attachment.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AttachmentUploadFormProps = {
  taskId: string;
};

export function AttachmentUploadForm({ taskId }: AttachmentUploadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isTransitionPending, startTransition] = useTransition();
  const [state, formAction, isActionPending] = useActionState(uploadTaskAttachmentAction, {} satisfies AttachmentActionState);
  const isPending = isTransitionPending || isActionPending;

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      className="space-y-3"
      encType="multipart/form-data"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      <input name="taskId" type="hidden" value={taskId} />
      <Input name="file" type="file" />
      {state.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p> : null}
      <Button className="w-full" disabled={isPending} type="submit" variant="secondary">
        <Upload className="h-4 w-4" />
        {isPending ? "Đang upload..." : "Upload file"}
      </Button>
    </form>
  );
}
