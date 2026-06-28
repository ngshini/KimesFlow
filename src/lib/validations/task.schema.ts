import { z } from "zod";
import { PRIORITIES } from "@/constants/task-status";

export const taskSchema = z.object({
  projectId: z.uuid(),
  statusId: z.uuid("Trạng thái không hợp lệ"),
  title: z.string().min(2, "Tiêu đề task tối thiểu 2 ký tự"),
  description: z.string().max(2000).optional(),
  assigneeId: z.union([z.uuid(), z.literal("")]).optional(),
  dueDate: z.union([z.iso.date(), z.literal("")]).optional(),
  priority: z.enum(PRIORITIES),
});

export const updateTaskSchema = taskSchema
  .omit({ projectId: true, statusId: true })
  .extend({
    taskId: z.uuid(),
  });

export const moveTaskSchema = z.object({
  taskId: z.uuid(),
  statusId: z.uuid(),
  position: z.coerce.number().int().nonnegative(),
});

export type TaskInput = z.infer<typeof taskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
