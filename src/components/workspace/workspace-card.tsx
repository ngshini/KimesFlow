import Link from "next/link";
import { ArrowRight, Building2, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Workspace } from "@/types/workspace";

type WorkspaceCardProps = {
  workspace: Workspace;
};

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
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
          <Link className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-600" href={`/workspaces/${workspace.id}`}>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>/{workspace.slug}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {new Date(workspace.createdAt).toLocaleDateString("vi-VN")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
