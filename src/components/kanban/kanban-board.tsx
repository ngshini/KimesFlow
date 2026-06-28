"use client";

import { useMemo, useState, useTransition } from "react";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { moveTaskAction } from "@/actions/task.actions";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { TaskCard } from "@/components/task/task-card";
import type { Task, TaskStatus } from "@/types/task";

type KanbanBoardProps = {
  statuses: TaskStatus[];
  tasks: Task[];
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

export function KanbanBoard({ statuses, tasks }: KanbanBoardProps) {
  const [items, setItems] = useState(tasks);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

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
            </KanbanColumn>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
