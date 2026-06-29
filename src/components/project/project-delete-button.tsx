import { Trash2 } from "lucide-react";
import { deleteProjectAction } from "@/actions/project.actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

type ProjectDeleteButtonProps = {
  projectId: string;
};

export function ProjectDeleteButton({ projectId }: ProjectDeleteButtonProps) {
  return (
    <form action={deleteProjectAction}>
      <input name="projectId" type="hidden" value={projectId} />
      <ConfirmSubmitButton confirmMessage="Xóa project sẽ xóa toàn bộ task, comment và file metadata liên quan. Bạn chắc chắn muốn tiếp tục?">
        <Trash2 className="h-4 w-4" />
        Xóa project
      </ConfirmSubmitButton>
    </form>
  );
}
