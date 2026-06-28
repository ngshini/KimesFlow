import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Workspace } from "@/types/workspace";

type WorkspaceCardProps = {
  workspace: Workspace;
};

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-blue-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-950">{workspace.name}</h3>
              {workspace.role ? <Badge className="bg-slate-100 text-slate-600">{workspace.role}</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-slate-500">{workspace.description}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">/{workspace.slug}</p>
      </CardContent>
    </Card>
  );
}
