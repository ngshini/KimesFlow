import Link from "next/link";
import { Workflow } from "lucide-react";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { WorkspaceCreateForm } from "@/components/workspace/workspace-create-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getUserWorkspaces } from "@/lib/data/workspaces";

export default async function WorkspacesPage() {
  const workspaces = await getUserWorkspaces();

  return (
    <div className="space-y-6">
      <PageHeader description="Tổ chức project, thành viên và quyền truy cập theo từng không gian làm việc." title="Workspaces" />
      <section id="create-workspace">
        <WorkspaceCreateForm />
      </section>
      {workspaces.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      ) : (
        <EmptyState
          action={
            <Link className="text-sm font-medium text-blue-600 hover:text-blue-700" href="#create-workspace">
              Điền form tạo workspace phía trên
            </Link>
          }
          description="Bạn chưa tham gia workspace nào. Workspace là nơi gom project, member và task."
          icon={Workflow}
          title="Chưa có workspace"
        />
      )}
    </div>
  );
}
