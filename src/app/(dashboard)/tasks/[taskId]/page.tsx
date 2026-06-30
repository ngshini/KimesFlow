import { TaskDetailPanel } from "@/components/task/task-detail-panel";
import { getTaskDetailData } from "@/lib/data/tasks";

type TaskDetailPageProps = {
  params: Promise<{ taskId: string }>;
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { taskId } = await params;
  const { task, assignees, comments, attachments, subtasks } = await getTaskDetailData(taskId);

  return <TaskDetailPanel assignees={assignees} attachments={attachments} comments={comments} subtasks={subtasks} task={task} />;
}
