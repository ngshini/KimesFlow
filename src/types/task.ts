import type { TaskPriority } from "@/constants/task-status";

export type TaskStatus = {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  color?: string | null;
  position: number;
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
  dueDate?: string | null;
  priority: TaskPriority;
  position: number;
  commentCount: number;
  attachmentCount: number;
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
