import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Project } from "@/types/project";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 h-2 w-16 rounded-full" style={{ backgroundColor: project.color ?? "#2563eb" }} />
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-950">{project.name}</h3>
              {project.role ? <Badge className="bg-slate-100 text-slate-600">{project.role}</Badge> : null}
            </div>
            {project.workspaceName ? <p className="mt-1 text-xs text-slate-400">{project.workspaceName}</p> : null}
            <p className="mt-2 text-sm leading-6 text-slate-500">{project.description}</p>
          </div>
          <Link className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-600" href={`/projects/${project.id}`}>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/3 rounded-full bg-blue-500" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <Badge className="bg-blue-50 text-blue-700">{project.status ?? "active"}</Badge>
            {project.endDate ? (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(project.endDate).toLocaleDateString("vi-VN")}
              </span>
            ) : (
              <span>Chưa có deadline</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
