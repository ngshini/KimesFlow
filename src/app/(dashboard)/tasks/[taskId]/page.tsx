import { TaskDetailPanel } from "@/components/task/task-detail-panel";
import { getProjectAssignees, getTaskAttachments, getTaskById, getTaskComments } from "@/lib/data/tasks";

type TaskDetailPageProps = {
  params: Promise<{ taskId: string }>;
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { taskId } = await params;
  const task = await getTaskById(taskId);
  const [assignees, comments, attachments] = await Promise.all([getProjectAssignees(task.projectId), getTaskComments(taskId), getTaskAttachments(taskId)]);

  return <TaskDetailPanel assignees={assignees} attachments={attachments} comments={comments} task={task} />;
}
