import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { deleteCommentAction } from "@/actions/comment.actions";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import type { TaskComment } from "@/types/task";

type CommentListProps = {
  comments: TaskComment[];
};

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có bình luận nào.</p>;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <article key={comment.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <Avatar name={comment.author.name} src={comment.author.avatarUrl} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-slate-950">{comment.author.name}</p>
                <time className="text-xs text-slate-400">{format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm")}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{comment.content}</p>
              {comment.canDelete ? (
                <form action={deleteCommentAction} className="mt-3">
                  <input name="commentId" type="hidden" value={comment.id} />
                  <input name="taskId" type="hidden" value={comment.taskId} />
                  <ConfirmSubmitButton
                    className="h-8 px-2 text-xs"
                    confirmMessage="Bạn chắc chắn muốn xóa bình luận này?"
                    variant="secondary"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa
                  </ConfirmSubmitButton>
                </form>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
