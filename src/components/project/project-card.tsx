import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Project } from "@/types/project";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card>
      <CardContent>
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
          <Link className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100" href={`/projects/${project.id}`}>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
