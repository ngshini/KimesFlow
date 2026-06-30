"use client";

import { Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { createTaskAction } from "@/actions/task.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseQuickTaskInput, type QuickAssigneeOption } from "@/lib/tasks/quick-task";
import type { Task } from "@/types/task";

type QuickAddTaskProps = {
  projectId: string;
  statusId: string;
  assignees: QuickAssigneeOption[];
  onCreated: (task: Task) => void;
};

export function QuickAddTask({ projectId, statusId, assignees, onCreated }: QuickAddTaskProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitTask(keepOpen: boolean) {
    const parsed = parseQuickTaskInput(title, assignees);
    if (!parsed.title) {
      setError("Tiêu đề task không được trống.");
      return;
    }

    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("statusId", statusId);
    formData.set("title", parsed.title);
    formData.set("description", "");
    formData.set("assigneeId", parsed.assigneeId ?? "");
    formData.set("startDate", "");
    formData.set("dueDate", parsed.dueDate ?? "");
    formData.set("priority", parsed.priority ?? "medium");

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await createTaskAction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.task) onCreated(result.task);
      setTitle("");
      setMessage(result.success ?? "Task đã được tạo.");
      if (!keepOpen) setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-white text-sm font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600"
        type="button"
        onClick={() => {
          setOpen(true);
          setMessage(null);
          setError(null);
        }}
      >
        <Plus className="h-4 w-4" />
        Thêm task
      </button>
    );
  }

  return (
    <div className="rounded-md border border-blue-100 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          disabled={isPending}
          placeholder="Task #high @Nguyen due:2026-07-05"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitTask(true);
            }
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        <Button
          aria-label="Đóng quick add"
          className="h-10 w-10 shrink-0 p-0"
          disabled={isPending}
          type="button"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {error ? <p className="mt-2 rounded-md bg-rose-50 px-2 py-1.5 text-xs text-rose-700">{error}</p> : null}
      {message ? <p className="mt-2 rounded-md bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700">{message}</p> : null}
      <div className="mt-3 flex items-center gap-2">
        <Button className="h-9 px-3" disabled={isPending} type="button" onClick={() => submitTask(false)}>
          {isPending ? "Đang tạo..." : "Tạo"}
        </Button>
        <Button className="h-9 px-3" disabled={isPending} type="button" variant="secondary" onClick={() => submitTask(true)}>
          Tạo thêm
        </Button>
      </div>
    </div>
  );
}
