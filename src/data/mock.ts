import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import type { Workspace } from "@/types/workspace";

export const mockWorkspaces: Workspace[] = [
  {
    id: "workspace-1",
    name: "Kimes Operations",
    slug: "kimes-operations",
    description: "Quản lý vận hành nội bộ và triển khai khách hàng.",
    ownerId: "user-1",
    createdAt: "2026-01-05T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "workspace-2",
    name: "Client Delivery",
    slug: "client-delivery",
    description: "Theo dõi tiến độ các dự án khách hàng.",
    ownerId: "user-1",
    createdAt: "2026-02-11T00:00:00.000Z",
    updatedAt: "2026-06-15T00:00:00.000Z",
  },
];

export const mockProjects: Project[] = [
  {
    id: "project-1",
    workspaceId: "workspace-1",
    name: "CRM Launch",
    slug: "crm-launch",
    description: "Triển khai dashboard CRM và quy trình chăm sóc khách hàng.",
    color: "#2563eb",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
  },
  {
    id: "project-2",
    workspaceId: "workspace-1",
    name: "Marketing Sprint",
    slug: "marketing-sprint",
    description: "Lập kế hoạch nội dung, landing page và báo cáo funnel.",
    color: "#059669",
    createdAt: "2026-04-12T00:00:00.000Z",
    updatedAt: "2026-06-24T00:00:00.000Z",
  },
];

export const mockTasks: Task[] = [
  {
    id: "task-1",
    projectId: "project-1",
    statusId: "todo",
    title: "Chuẩn hóa schema khách hàng",
    description: "Rà soát field bắt buộc và mapping dữ liệu từ form.",
    assignee: { id: "user-1", name: "An Nguyen" },
    dueDate: "2026-07-02",
    priority: "high",
    position: 1000,
    commentCount: 4,
    attachmentCount: 2,
  },
  {
    id: "task-2",
    projectId: "project-1",
    statusId: "in_progress",
    title: "Thiết kế màn hình pipeline",
    description: "Tạo layout danh sách deal và trạng thái chăm sóc.",
    assignee: { id: "user-2", name: "Binh Tran" },
    dueDate: "2026-07-05",
    priority: "medium",
    position: 1000,
    commentCount: 2,
    attachmentCount: 1,
  },
  {
    id: "task-3",
    projectId: "project-1",
    statusId: "review",
    title: "Kiểm tra phân quyền project",
    description: "Xác nhận owner, manager, member và viewer đúng quyền.",
    assignee: { id: "user-3", name: "Chi Le" },
    dueDate: "2026-06-30",
    priority: "urgent",
    position: 1000,
    commentCount: 6,
    attachmentCount: 0,
  },
  {
    id: "task-4",
    projectId: "project-1",
    statusId: "done",
    title: "Tạo checklist onboarding",
    description: "Hoàn tất checklist kickoff cho khách hàng mới.",
    assignee: { id: "user-4", name: "Duc Pham" },
    dueDate: "2026-06-18",
    priority: "low",
    position: 1000,
    commentCount: 1,
    attachmentCount: 3,
  },
];
