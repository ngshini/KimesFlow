import { z } from "zod";

export const workspaceSchema = z.object({
  name: z.string().min(2, "Tên workspace tối thiểu 2 ký tự"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang"),
  description: z.string().max(500).optional(),
});

export type WorkspaceInput = z.infer<typeof workspaceSchema>;

export const workspaceUpdateSchema = workspaceSchema.extend({
  workspaceId: z.uuid(),
});

export type WorkspaceUpdateInput = z.infer<typeof workspaceUpdateSchema>;
