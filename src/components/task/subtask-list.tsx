import { toggleSubtaskAction } from "@/actions/task.actions";
import type { Subtask } from "@/types/task";

type SubtaskListProps = {
  subtasks: Subtask[];
};

export function SubtaskList({ subtasks }: SubtaskListProps) {
  if (subtasks.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có subtask nào.</p>;
  }

  return (
    <div className="space-y-2">
      {subtasks.map((subtask) => (
        <form key={subtask.id} action={toggleSubtaskAction} className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3">
          <input name="subtaskId" type="hidden" value={subtask.id} />
          <input name="taskId" type="hidden" value={subtask.taskId} />
          <input name="isCompleted" type="hidden" value={String(!subtask.isCompleted)} />
          <button
            aria-label={subtask.isCompleted ? "Bỏ hoàn thành" : "Đánh dấu hoàn thành"}
            className="mt-0.5 h-4 w-4 rounded border border-slate-300 bg-white data-[checked=true]:bg-emerald-600"
            data-checked={subtask.isCompleted}
            type="submit"
          />
          <div className="min-w-0">
            <p className={`text-sm font-medium ${subtask.isCompleted ? "text-slate-400 line-through" : "text-slate-900"}`}>{subtask.title}</p>
            {subtask.description ? <p className="mt-1 text-sm text-slate-500">{subtask.description}</p> : null}
          </div>
        </form>
      ))}
    </div>
  );
}
