"use client";

import { Copy, UserPlus } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { createInviteAction, type CollaborationActionState } from "@/actions/collaboration.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type InviteFormProps = {
  workspaceId: string;
  projectId?: string;
  scopeLabel: string;
};

const roles = ["admin", "member", "viewer"] as const;

export function InviteForm({ workspaceId, projectId, scopeLabel }: InviteFormProps) {
  const [state, formAction, isActionPending] = useActionState(createInviteAction, {} satisfies CollaborationActionState);
  const [isTransitionPending, startTransition] = useTransition();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const isPending = isActionPending || isTransitionPending;
  const copied = Boolean(state.inviteUrl && copiedUrl === state.inviteUrl);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      <input name="workspaceId" type="hidden" value={workspaceId} />
      <input name="projectId" type="hidden" value={projectId ?? ""} />
      <div className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
        <Input name="email" placeholder="email@example.com (tùy chọn)" type="email" />
        <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" name="role" defaultValue="member">
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <Button disabled={isPending} type="submit">
          <UserPlus className="h-4 w-4" />
          {isPending ? "Đang tạo..." : `Mời ${scopeLabel}`}
        </Button>
      </div>
      {state.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p> : null}
      {state.inviteUrl ? (
        <div className="flex gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
          <input className="min-w-0 flex-1 bg-transparent px-2 text-sm text-slate-700 outline-none" readOnly value={state.inviteUrl} />
          <Button
            className="h-9 px-3"
            type="button"
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(state.inviteUrl ?? "");
              setCopiedUrl(state.inviteUrl ?? null);
            }}
          >
            <Copy className="h-4 w-4" />
            {copied ? "Đã copy" : "Copy"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
