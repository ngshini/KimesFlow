"use client";

import { Plus, Wand2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createTaskAction } from "@/actions/task.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PRIORITIES, type TaskPriority } from "@/constants/task-status";
import { parseQuickTaskInput } from "@/lib/tasks/quick-task";
import type { QuickTaskProjectOption } from "@/lib/data/quick-task-options";

type QuickTaskModalProps = {
  triggerClassName?: string;
  triggerLabel?: string;
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
};

function getProjectIdFromPath(pathname: string, projects: QuickTaskProjectOption[]) {
  const match = pathname.match(/^\/projects\/([^/]+)/);
  const projectId = match?.[1];
  return projectId && projects.some((project) => project.id === projectId) ? projectId : undefined;
}

export function QuickTaskModal({ triggerClassName, triggerLabel = "Tạo task nhanh", triggerVariant = "primary" }: QuickTaskModalProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<QuickTaskProjectOption[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const defaultProjectId = getProjectIdFromPath(pathname, projects) ?? (projects.length === 1 ? projects[0]?.id : undefined) ?? "";
  const [open, setOpen] = useState(false);
  const [quickInput, setQuickInput] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [statusId, setStatusId] = useState("");
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isOptionsPending, startOptionsTransition] = useTransition();

  const selectedProject = useMemo(() => projects.find((project) => project.id === projectId), [projectId, projects]);
  const statuses = useMemo(() => selectedProject?.statuses ?? [], [selectedProject]);
  const assignees = useMemo(() => selectedProject?.assignees ?? [], [selectedProject]);
  const effectiveStatusId = statuses.some((status) => status.id === statusId) ? statusId : (statuses[0]?.id ?? "");
  const effectiveAssigneeId = assignees.some((assignee) => assignee.id === assigneeId) ? assigneeId : "";

  function applyQuickInput() {
    const parsed = parseQuickTaskInput(quickInput, assignees);
    if (parsed.title) setTitle(parsed.title);
    if (parsed.priority) setPriority(parsed.priority);
    if (parsed.dueDate) setDueDate(parsed.dueDate);
    if (parsed.assigneeId) setAssigneeId(parsed.assigneeId);
  }

  function submitTask(keepOpen: boolean) {
    const fallbackParsed = parseQuickTaskInput(title || quickInput, assignees);
    const nextTitle = (title || fallbackParsed.title).trim();

    if (!nextTitle) {
      setError("Tiêu đề task không được trống.");
      return;
    }

    if (!projectId || !effectiveStatusId) {
      setError("Vui lòng chọn project và trạng thái.");
      return;
    }

    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("statusId", effectiveStatusId);
    formData.set("title", nextTitle);
    formData.set("description", "");
    const usingQuickOnly = !title.trim() && Boolean(quickInput.trim());

    formData.set("assigneeId", effectiveAssigneeId || fallbackParsed.assigneeId || "");
    formData.set("startDate", "");
    formData.set("dueDate", dueDate || fallbackParsed.dueDate || "");
    formData.set("priority", usingQuickOnly ? (fallbackParsed.priority ?? priority) : priority);

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await createTaskAction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(result.success ?? "Task đã được tạo.");
      setTitle("");
      setQuickInput("");
      if (!pathname.startsWith("/projects/")) router.refresh();
      if (!keepOpen) setOpen(false);
    });
  }

  return (
    <>
      <Button
        className={triggerClassName}
        type="button"
        variant={triggerVariant}
        onClick={() => {
          setOpen(true);
          if (!optionsLoaded && !isOptionsPending) {
            startOptionsTransition(async () => {
              setOptionsError(null);
              const response = await fetch("/api/quick-task/options");
              const data = (await response.json()) as { ok: boolean; projects?: QuickTaskProjectOption[]; error?: string };
              if (!response.ok || !data.ok) {
                setOptionsError(data.error ?? "Không thể tải dữ liệu tạo task nhanh.");
                return;
              }
              const nextProjects = data.projects ?? [];
              setProjects(nextProjects);
              setProjectId((current) => current || getProjectIdFromPath(pathname, nextProjects) || (nextProjects.length === 1 ? (nextProjects[0]?.id ?? "") : ""));
              setOptionsLoaded(true);
            });
          }
        }}
      >
        <Plus className="h-4 w-4" />
        <span className={triggerLabel === "Tạo task nhanh" ? "hidden sm:inline" : undefined}>{triggerLabel}</span>
      </Button>
      <Modal
        open={open}
        title="Tạo task nhanh"
        onClose={() => {
          if (!isPending) setOpen(false);
        }}
      >
        {isOptionsPending ? (
          <div className="space-y-3">
            <div className="h-10 rounded-md bg-slate-100" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-10 rounded-md bg-slate-100" />
              <div className="h-10 rounded-md bg-slate-100" />
            </div>
          </div>
        ) : optionsError ? (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{optionsError}</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-slate-500">Bạn cần tạo project trước khi tạo task.</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="quick-task-syntax">
                Nhập nhanh
              </label>
              <div className="flex gap-2">
                <Input
                  id="quick-task-syntax"
                  placeholder="Thiết kế dashboard #high @Nguyen due:2026-07-05"
                  value={quickInput}
                  onChange={(event) => setQuickInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyQuickInput();
                    }
                  }}
                />
                <Button aria-label="Áp dụng cú pháp nhanh" className="h-10 w-10 p-0" type="button" variant="secondary" onClick={applyQuickInput}>
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="quick-task-title">
                  Tiêu đề
                </label>
                <Input id="quick-task-title" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  setStatusId("");
                  setAssigneeId("");
                }}
              >
                <option value="">Chọn project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} · {project.workspaceName}
                  </option>
                ))}
              </select>
              <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={effectiveStatusId} onChange={(event) => setStatusId(event.target.value)}>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
              <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={effectiveAssigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
                <option value="">Chưa gán</option>
                {assignees.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </option>
                ))}
              </select>
              <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
                {PRIORITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <Input className="sm:col-span-2" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </div>

            {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            {message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

            <div className="flex flex-wrap justify-end gap-2">
              <Button disabled={isPending} type="button" variant="secondary" onClick={() => submitTask(true)}>
                Tạo thêm
              </Button>
              <Button disabled={isPending} type="button" onClick={() => submitTask(false)}>
                {isPending ? "Đang tạo..." : "Tạo"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
