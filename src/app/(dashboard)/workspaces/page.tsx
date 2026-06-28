import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { WorkspaceCreateForm } from "@/components/workspace/workspace-create-form";
import { Card, CardContent } from "@/components/ui/card";
import { getUserWorkspaces } from "@/lib/data/workspaces";

export default async function WorkspacesPage() {
  const workspaces = await getUserWorkspaces();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Workspaces</h1>
        <p className="mt-1 text-sm text-slate-500">Danh sách workspace mà bạn đang tham gia.</p>
      </div>
      <WorkspaceCreateForm />
      {workspaces.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500">Bạn chưa tham gia workspace nào. Hãy tạo workspace đầu tiên ở form phía trên.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
