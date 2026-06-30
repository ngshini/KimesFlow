"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { moveTaskAction } from "@/actions/task.actions";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { QuickAddTask } from "@/components/kanban/quick-add-task";
import { TaskCard } from "@/components/task/task-card";
import { createClient } from "@/lib/supabase/client";
import type { Task, TaskStatus } from "@/types/task";

type AssigneeOption = {
  id: string;
  name: string;
};

type KanbanBoardProps = {
  projectId: string;
  statuses: TaskStatus[];
  tasks: Task[];
  assignees: AssigneeOption[];
};

function SortableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  );
}

function getColumnTasks(tasks: Task[], statusId: string) {
  return tasks.filter((task) => task.statusId === statusId).sort((a, b) => a.position - b.position);
}

function getNextPosition(columnTasks: Task[], insertIndex: number) {
  const previous = columnTasks[insertIndex - 1];
  const next = columnTasks[insertIndex];

  if (!previous && !next) return 1000;
  if (!previous) return Math.max(1, Math.floor(next.position / 2));
  if (!next) return previous.position + 1000;

  const between = Math.floor((previous.position + next.position) / 2);
  return between > previous.position ? between : previous.position + 1;
}

type RealtimeTaskRow = {
  id: string;
  project_id: string;
  status_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  priority: Task["priority"];
  position: number;
};

function mapRealtimeTask(row: RealtimeTaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    statusId: row.status_id,
    title: row.title,
    description: row.description,
    assignee: null,
    startDate: row.start_date,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    priority: row.priority,
    position: row.position,
    commentCount: 0,
    attachmentCount: 0,
    subtaskCount: 0,
    completedSubtaskCount: 0,
  };
}

export function KanbanBoard({ projectId, statuses, tasks, assignees }: KanbanBoardProps) {
  const [items, setItems] = useState(tasks);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`project-kanban-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` }, (payload) => {
        if (payload.eventType === "DELETE") {
          const oldTask = payload.old as Pick<RealtimeTaskRow, "id">;
          setItems((current) => current.filter((task) => task.id !== oldTask.id));
          return;
        }

        const nextTask = mapRealtimeTask(payload.new as RealtimeTaskRow);
        setItems((current) => {
          const existing = current.find((task) => task.id === nextTask.id);
          if (!existing) return [...current, nextTask];
          return current.map((task) =>
            task.id === nextTask.id
              ? {
                  ...task,
                  ...nextTask,
                  assignee: task.assignee,
                  commentCount: task.commentCount,
                  attachmentCount: task.attachmentCount,
                  subtaskCount: task.subtaskCount,
                  completedSubtaskCount: task.completedSubtaskCount,
                }
              : task,
          );
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "task_statuses", filter: `project_id=eq.${projectId}` }, () => router.refresh())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [projectId, router]);

  const grouped = useMemo(() => {
    return statuses.reduce<Record<string, Task[]>>(
      (acc, status) => {
        acc[status.id] = items.filter((task) => task.statusId === status.id).sort((a, b) => a.position - b.position);
        return acc;
      },
      {},
    );
  }, [items, statuses]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTask = items.find((task) => task.id === active.id);
    if (!activeTask) return;

    const overTask = items.find((task) => task.id === over.id);
    const overStatus = statuses.find((status) => status.id === over.id)?.id;
    const nextStatus = overTask?.statusId ?? overStatus ?? activeTask.statusId;
    const targetColumnWithoutActive = getColumnTasks(
      items.filter((task) => task.id !== activeTask.id),
      nextStatus,
    );
    const overIndex = overTask ? targetColumnWithoutActive.findIndex((task) => task.id === overTask.id) : targetColumnWithoutActive.length;
    const insertIndex = overIndex >= 0 ? overIndex : targetColumnWithoutActive.length;
    const nextPosition = getNextPosition(targetColumnWithoutActive, insertIndex);
    const previousItems = items;

    setItems((current) =>
      current.map((task) => (task.id === activeTask.id ? { ...task, statusId: nextStatus, position: nextPosition } : task)),
    );
    setError(null);

    startTransition(async () => {
      const result = await moveTaskAction({
        taskId: activeTask.id,
        statusId: nextStatus,
        position: nextPosition,
      });

      if (result.error) {
        setItems(previousItems);
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statuses.map((status) => (
            <KanbanColumn key={status.id} color={status.color} count={grouped[status.id]?.length ?? 0} id={status.id} title={status.name}>
              <SortableContext id={status.id} items={(grouped[status.id] ?? []).map((task) => task.id)} strategy={verticalListSortingStrategy}>
                {(grouped[status.id] ?? []).map((task) => (
                  <SortableTask key={task.id} task={task} />
                ))}
              </SortableContext>
              <QuickAddTask
                assignees={assignees}
                projectId={projectId}
                statusId={status.id}
                onCreated={(task) => {
                  setItems((current) => (current.some((item) => item.id === task.id) ? current : [...current, task]));
                }}
              />
            </KanbanColumn>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
