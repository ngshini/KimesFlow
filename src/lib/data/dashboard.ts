import { addDays, format, isBefore, isWithinInterval, parseISO, startOfToday } from "date-fns";
import { getCurrentUserId, getUserWorkspaces } from "@/lib/data/workspaces";
import { getUserProjects } from "@/lib/data/projects";
import { createClient } from "@/lib/supabase/server";
import type { TaskPriority } from "@/constants/task-status";

type DashboardTaskRow = {
  id: string;
  project_id: string;
  status_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  due_date: string | null;
  priority: TaskPriority;
  created_at: string;
  completed_at?: string | null;
};

type DashboardStatusRow = {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  color: string | null;
};

function getPriorityLabel(priority: TaskPriority) {
  const labels: Record<TaskPriority, string> = {
    low: "Thấp",
    medium: "Trung bình",
    high: "Cao",
    urgent: "Khẩn cấp",
  };

  return labels[priority];
}

function mapDashboardTask(task: DashboardTaskRow, projectNameById: Map<string, string>, statusNameById: Map<string, string>) {
  return {
    id: task.id,
    title: task.title,
    projectId: task.project_id,
    projectName: projectNameById.get(task.project_id) ?? "Không rõ project",
    statusName: statusNameById.get(task.status_id) ?? "Không rõ trạng thái",
    dueDate: task.due_date,
    priority: task.priority,
  };
}

export async function getDashboardData() {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const [workspaces, projects] = await Promise.all([getUserWorkspaces(), getUserProjects()]);
  const projectIds = projects.map((project) => project.id);
  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));

  if (projectIds.length === 0) {
    return {
      stats: {
        workspaceCount: workspaces.length,
        projectCount: 0,
        taskCount: 0,
        doneTaskCount: 0,
        inProgressTaskCount: 0,
        overdueTaskCount: 0,
        dueSoonTaskCount: 0,
        completionRate: 0,
      },
      tasksByStatus: [],
      tasksByPriority: [],
      tasksByAssignee: [],
      tasksByDeadline: [],
      nearDeadlineTasks: [],
      assignedTasks: [],
      recentProjects: [],
      calendarDays: [],
    };
  }

  const [{ data: statuses, error: statusError }, { data: tasks, error: taskError }] = await Promise.all([
    supabase.from("task_statuses").select("id, project_id, name, slug, color").in("project_id", projectIds),
    supabase
      .from("tasks")
      .select("id, project_id, status_id, title, description, assignee_id, due_date, priority, created_at, completed_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false }),
  ]);

  if (statusError) throw new Error(statusError.message);
  if (taskError) throw new Error(taskError.message);

  const statusNameById = new Map(statuses.map((status: DashboardStatusRow) => [status.id, status.name]));
  const statusSlugById = new Map(statuses.map((status: DashboardStatusRow) => [status.id, status.slug]));
  const taskRows = tasks as DashboardTaskRow[];
  const today = startOfToday();
  const nextWeek = addDays(today, 7);

  const doneTaskCount = taskRows.filter((task) => statusSlugById.get(task.status_id) === "done").length;
  const inProgressTaskCount = taskRows.filter((task) => statusSlugById.get(task.status_id) === "in_progress").length;
  const overdueTaskCount = taskRows.filter((task) => {
    if (!task.due_date) return false;
    if (statusSlugById.get(task.status_id) === "done") return false;
    return isBefore(parseISO(task.due_date), today);
  }).length;
  const dueSoonTaskCount = taskRows.filter((task) => {
    if (!task.due_date || statusSlugById.get(task.status_id) === "done") return false;
    return isWithinInterval(parseISO(task.due_date), { start: today, end: nextWeek });
  }).length;
  const completionRate = taskRows.length > 0 ? Math.round((doneTaskCount / taskRows.length) * 100) : 0;

  const statusGroups = new Map<string, { name: string; tasks: number; fill: string }>();
  statuses.forEach((status: DashboardStatusRow) => {
    if (!statusGroups.has(status.slug)) {
      statusGroups.set(status.slug, {
        name: status.name,
        tasks: 0,
        fill: status.color ?? "#2563eb",
      });
    }
  });
  taskRows.forEach((task) => {
    const statusSlug = statusSlugById.get(task.status_id);
    if (!statusSlug) return;
    const current = statusGroups.get(statusSlug);
    if (!current) return;
    current.tasks += 1;
  });
  const statusCounts = Array.from(statusGroups.values());

  const priorityOrder: TaskPriority[] = ["low", "medium", "high", "urgent"];
  const priorityCounts = priorityOrder.map((priority) => ({
    name: getPriorityLabel(priority),
    priority,
    tasks: taskRows.filter((task) => task.priority === priority).length,
  }));

  const assigneeIds = [...new Set(taskRows.map((task) => task.assignee_id).filter((id): id is string => Boolean(id)))];
  const { data: assignees } =
    assigneeIds.length > 0 ? await supabase.from("profiles").select("id, full_name, email").in("id", assigneeIds) : { data: [] };
  const assigneeNameById = new Map((assignees ?? []).map((profile) => [profile.id, profile.full_name ?? profile.email ?? "Người dùng"]));
  const tasksByAssignee = assigneeIds.map((assigneeId) => ({
    name: assigneeNameById.get(assigneeId) ?? "Người dùng",
    tasks: taskRows.filter((task) => task.assignee_id === assigneeId).length,
  }));

  const tasksByDeadline = Array.from(
    taskRows
      .filter((task) => task.due_date)
      .reduce<Map<string, number>>((acc, task) => {
        const key = String(task.due_date);
        acc.set(key, (acc.get(key) ?? 0) + 1);
        return acc;
      }, new Map<string, number>()),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 10)
    .map(([date, taskCount]) => ({ name: format(parseISO(date), "dd/MM"), tasks: taskCount }));

  const nearDeadlineTasks = taskRows
    .filter((task) => task.due_date && statusSlugById.get(task.status_id) !== "done")
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
    .slice(0, 6)
    .map((task) => mapDashboardTask(task, projectNameById, statusNameById));

  const assignedTasks = taskRows
    .filter((task) => task.assignee_id === userId)
    .slice(0, 6)
    .map((task) => mapDashboardTask(task, projectNameById, statusNameById));

  const recentProjects = projects.slice(0, 6).map((project) => ({
    id: project.id,
    name: project.name,
    workspaceName: project.workspaceName ?? "Không rõ workspace",
    createdAt: format(parseISO(project.createdAt), "dd/MM/yyyy"),
    color: project.color ?? "#2563eb",
  }));

  const calendarDays = Array.from(
    taskRows
      .filter((task) => task.due_date)
      .reduce<Map<string, ReturnType<typeof mapDashboardTask>[]>>((acc, task) => {
        const key = String(task.due_date);
        acc.set(key, [...(acc.get(key) ?? []), mapDashboardTask(task, projectNameById, statusNameById)]);
        return acc;
      }, new Map<string, ReturnType<typeof mapDashboardTask>[]>()),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 14)
    .map(([date, dayTasks]) => ({ date, label: format(parseISO(date), "dd/MM/yyyy"), tasks: dayTasks }));

  return {
    stats: {
      workspaceCount: workspaces.length,
      projectCount: projects.length,
      taskCount: taskRows.length,
      doneTaskCount,
      inProgressTaskCount,
      overdueTaskCount,
      dueSoonTaskCount,
      completionRate,
    },
    tasksByStatus: statusCounts,
    tasksByPriority: priorityCounts,
    tasksByAssignee,
    tasksByDeadline,
    nearDeadlineTasks,
    assignedTasks,
    recentProjects,
    calendarDays,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
