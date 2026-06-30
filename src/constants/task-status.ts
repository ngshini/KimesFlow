export const DEFAULT_TASK_STATUSES = [
  { slug: "todo", name: "Cần làm", color: "#64748b", position: 1000 },
  { slug: "in_progress", name: "Đang làm", color: "#2563eb", position: 2000 },
  { slug: "done", name: "Hoàn thành", color: "#059669", position: 3000 },
] as const;

export const OPTIONAL_TASK_STATUSES = [{ slug: "review", name: "Đang kiểm tra", color: "#d97706", position: 2500 }] as const;

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof PRIORITIES)[number];
