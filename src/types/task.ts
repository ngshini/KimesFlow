import type { TaskPriority } from "@/constants/task-status";

export type TaskStatus = {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  color?: string | null;
  position: number;
  isDefault?: boolean;
};

export type Task = {
  id: string;
  projectId: string;
  statusId: string;
  title: string;
  description?: string | null;
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  priority: TaskPriority;
  position: number;
  commentCount: number;
  attachmentCount: number;
  subtaskCount?: number;
  completedSubtaskCount?: number;
};

export type Subtask = {
  id: string;
  taskId: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskComment = {
  id: string;
  taskId: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
};

export type TaskAttachment = {
  id: string;
  taskId: string;
  fileUrl: string;
  fileName: string;
  fileType?: string | null;
  fileSize?: number | null;
  signedUrl?: string | null;
  createdAt: string;
  uploadedBy: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
};
