import { z } from "zod";

export const projectSchema = z.object({
  workspaceId: z.uuid(),
  name: z.string().min(2, "Tên project tối thiểu 2 ký tự"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang"),
  description: z.string().max(800).optional(),
  color: z.string().optional(),
  startDate: z.union([z.iso.date(), z.literal("")]).optional(),
  endDate: z.union([z.iso.date(), z.literal("")]).optional(),
  status: z.enum(["planned", "active", "paused", "completed", "archived"]).optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;

export const projectUpdateSchema = projectSchema.omit({ workspaceId: true }).extend({
  projectId: z.uuid(),
});

export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
