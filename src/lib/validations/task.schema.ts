import { z } from "zod";
import { PRIORITIES } from "@/constants/task-status";

export const taskSchema = z.object({
  projectId: z.uuid(),
  statusId: z.uuid("Trạng thái không hợp lệ"),
  title: z.string().min(2, "Tiêu đề task tối thiểu 2 ký tự"),
  description: z.string().max(2000).optional(),
  assigneeId: z.union([z.uuid(), z.literal("")]).optional(),
  startDate: z.union([z.iso.date(), z.literal("")]).optional(),
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

export const taskStatusSchema = z.object({
  projectId: z.uuid(),
  name: z.string().trim().min(2, "Tên cột tối thiểu 2 ký tự").max(80, "Tên cột tối đa 80 ký tự"),
  color: z.string().trim().min(1).optional(),
});

export const updateTaskStatusSchema = taskStatusSchema.omit({ projectId: true }).extend({
  statusId: z.uuid(),
  position: z.coerce.number().int().nonnegative().optional(),
});

export const subtaskSchema = z.object({
  taskId: z.uuid(),
  title: z.string().trim().min(2, "Tên subtask tối thiểu 2 ký tự").max(200, "Tên subtask tối đa 200 ký tự"),
  description: z.string().max(1000).optional(),
});

export const updateSubtaskSchema = z.object({
  subtaskId: z.uuid(),
  taskId: z.uuid(),
  isCompleted: z.coerce.boolean(),
});

export type TaskInput = z.infer<typeof taskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type TaskStatusInput = z.infer<typeof taskStatusSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type SubtaskInput = z.infer<typeof subtaskSchema>;
