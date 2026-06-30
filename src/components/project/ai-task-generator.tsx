"use client";

import { useActionState, useState, useTransition } from "react";
import { createAiTasksAction, type TaskActionState } from "@/actions/task.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { TaskStatus } from "@/types/task";

type AiTaskDraft = {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  due_date?: string | null;
  subtasks: string[];
};

type AiTaskGeneratorProps = {
  projectId: string;
  statuses: TaskStatus[];
};

export function AiTaskGenerator({ projectId, statuses }: AiTaskGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [tasks, setTasks] = useState<AiTaskDraft[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [state, formAction, isActionPending] = useActionState(createAiTasksAction, {} satisfies TaskActionState);
  const firstStatusId = statuses[0]?.id ?? "";

  async function generateTasks() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/ai/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string; tasks?: AiTaskDraft[] };
      if (!response.ok || !data.ok || !data.tasks) {
        setError(data.error ?? "Không thể tạo task bằng AI.");
        return;
      }
      setTasks(data.tasks);
      setSelected(new Set(data.tasks.map((_, index) => index)));
    });
  }

  const selectedTasks = tasks.filter((_, index) => selected.has(index));

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">Tạo task bằng AI</h2>
        <p className="mt-1 text-sm text-slate-500">Nhập mô tả tiếng Việt, xem lại đề xuất rồi mới lưu vào Supabase.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea value={prompt} placeholder="Ví dụ: Chuẩn bị launch landing page trong tuần này..." onChange={(event) => setPrompt(event.target.value)} />
        <Button disabled={isPending || prompt.trim().length === 0} type="button" variant="secondary" onClick={generateTasks}>
          {isPending ? "Đang phân tích..." : "Tạo task bằng AI"}
        </Button>
        {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {tasks.length > 0 ? (
          <form action={formAction} className="space-y-3">
            <input name="projectId" type="hidden" value={projectId} />
            <input name="statusId" type="hidden" value={firstStatusId} />
            <input name="tasksJson" type="hidden" value={JSON.stringify(selectedTasks)} />
            {tasks.map((task, index) => (
              <label key={`${task.title}-${index}`} className="flex gap-3 rounded-md border border-slate-200 p-3">
                <input
                  checked={selected.has(index)}
                  type="checkbox"
                  onChange={(event) => {
                    setSelected((current) => {
                      const next = new Set(current);
                      if (event.target.checked) next.add(index);
                      else next.delete(index);
                      return next;
                    });
                  }}
                />
                <span>
                  <span className="block text-sm font-medium text-slate-950">{task.title}</span>
                  <span className="block text-sm text-slate-500">{task.description}</span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {task.priority} {task.due_date ? `· ${task.due_date}` : ""}
                  </span>
                </span>
              </label>
            ))}
            {state.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p> : null}
            {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p> : null}
            <Button disabled={isActionPending || selectedTasks.length === 0} type="submit">
              {isActionPending ? "Đang lưu..." : "Lưu task đã chọn"}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
