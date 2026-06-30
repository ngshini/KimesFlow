import { TaskDetailPanel } from "@/components/task/task-detail-panel";
import { getProjectAssignees, getTaskAttachments, getTaskById, getTaskComments, getTaskSubtasks } from "@/lib/data/tasks";

type TaskDetailPageProps = {
  params: Promise<{ taskId: string }>;
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { taskId } = await params;
  const task = await getTaskById(taskId);
  const [assignees, comments, attachments, subtasks] = await Promise.all([
    getProjectAssignees(task.projectId),
    getTaskComments(taskId),
    getTaskAttachments(taskId),
    getTaskSubtasks(taskId),
  ]);

  return <TaskDetailPanel assignees={assignees} attachments={attachments} comments={comments} subtasks={subtasks} task={task} />;
}
