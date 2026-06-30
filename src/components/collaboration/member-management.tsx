import { Trash2 } from "lucide-react";
import { removeMemberAction, updateMemberRoleFormAction } from "@/actions/collaboration.actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { InviteForm } from "@/components/collaboration/invite-form";
import type { InviteListItem, MemberListItem } from "@/lib/data/collaboration";

type MemberManagementProps = {
  title: string;
  scope: "workspace" | "project";
  workspaceId: string;
  projectId?: string;
  canManage: boolean;
  members: MemberListItem[];
  invites: InviteListItem[];
};

const roles = ["owner", "admin", "member", "viewer"] as const;

export function MemberManagement({ title, scope, workspaceId, projectId, canManage, members, invites }: MemberManagementProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">Quản lý cộng tác viên và quyền truy cập.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {canManage ? <InviteForm projectId={projectId} scopeLabel={scope === "project" ? "project" : "workspace"} workspaceId={workspaceId} /> : null}

        <div className="space-y-3">
          {members.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có thành viên nào.</p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-[1fr_150px_auto]">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={member.fullName ?? member.email ?? "User"} src={member.avatarUrl} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-950">{member.fullName ?? member.email ?? "Người dùng"}</p>
                    <p className="truncate text-xs text-slate-500">{member.email ?? member.userId}</p>
                  </div>
                </div>
                {canManage ? (
                  <form action={updateMemberRoleFormAction} className="flex gap-2">
                    <input name="scope" type="hidden" value={scope} />
                    <input name="workspaceId" type="hidden" value={workspaceId} />
                    <input name="projectId" type="hidden" value={projectId ?? ""} />
                    <input name="memberId" type="hidden" value={member.id} />
                    <select className="h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm" name="role" defaultValue={member.role}>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="secondary">
                      Lưu
                    </Button>
                  </form>
                ) : (
                  <div className="text-sm font-medium text-slate-600">{member.role}</div>
                )}
                {canManage ? (
                  <form action={removeMemberAction}>
                    <input name="scope" type="hidden" value={scope} />
                    <input name="workspaceId" type="hidden" value={workspaceId} />
                    <input name="projectId" type="hidden" value={projectId ?? ""} />
                    <input name="memberId" type="hidden" value={member.id} />
                    <ConfirmSubmitButton className="w-full" confirmMessage="Bạn chắc chắn muốn xóa thành viên này?" variant="danger">
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </ConfirmSubmitButton>
                  </form>
                ) : null}
              </div>
            ))
          )}
        </div>

        {canManage ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Invite đang chờ</h3>
            {invites.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có invite nào đang chờ.</p>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <span className="text-slate-700">{invite.email ?? "Link invite không khóa email"}</span>
                    <span className="font-medium text-slate-500">{invite.role}</span>
                    <span className="text-xs text-slate-400">
                      {invite.acceptedAt ? "Đã tham gia" : `Hết hạn ${new Date(invite.expiresAt).toLocaleDateString("vi-VN")}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
