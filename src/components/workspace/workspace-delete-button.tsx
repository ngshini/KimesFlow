import { Trash2 } from "lucide-react";
import { deleteWorkspaceAction } from "@/actions/workspace.actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

type WorkspaceDeleteButtonProps = {
  workspaceId: string;
};

export function WorkspaceDeleteButton({ workspaceId }: WorkspaceDeleteButtonProps) {
  return (
    <form action={deleteWorkspaceAction}>
      <input name="workspaceId" type="hidden" value={workspaceId} />
      <ConfirmSubmitButton confirmMessage="Xóa workspace sẽ xóa toàn bộ project và task bên trong. Bạn chắc chắn muốn tiếp tục?">
        <Trash2 className="h-4 w-4" />
        Xóa workspace
      </ConfirmSubmitButton>
    </form>
  );
}
