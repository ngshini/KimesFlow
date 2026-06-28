import { Download, ExternalLink } from "lucide-react";
import type { TaskAttachment } from "@/types/task";

type AttachmentListProps = {
  attachments: TaskAttachment[];
};

function formatBytes(size?: number | null) {
  if (!size) return "Không rõ dung lượng";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentList({ attachments }: AttachmentListProps) {
  if (attachments.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có file đính kèm.</p>;
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="rounded-lg border border-slate-200 p-3">
          <p className="break-words text-sm font-medium text-slate-900">{attachment.fileName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {attachment.fileType ?? "application/octet-stream"} · {formatBytes(attachment.fileSize)}
          </p>
          {attachment.signedUrl ? (
            <div className="mt-3 flex gap-2">
              <a
                className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                href={attachment.signedUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Mở
              </a>
              <a
                className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                download={attachment.fileName}
                href={attachment.signedUrl}
              >
                <Download className="h-3.5 w-3.5" />
                Tải
              </a>
            </div>
          ) : (
            <p className="mt-2 text-xs text-rose-600">Không thể tạo link tải file.</p>
          )}
        </div>
      ))}
    </div>
  );
}
