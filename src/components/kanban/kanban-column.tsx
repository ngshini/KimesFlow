"use client";

import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";

type KanbanColumnProps = {
  id: string;
  title: string;
  count: number;
  color?: string | null;
  children: ReactNode;
};

export function KanbanColumn({ id, title, count, color, children }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <section ref={setNodeRef} className="flex min-h-[520px] w-80 shrink-0 flex-col rounded-lg border border-slate-200 bg-slate-50" data-column-id={id}>
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color ?? "#64748b" }} />
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        </div>
        <Badge className="bg-white text-slate-600">{count}</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">{children}</div>
    </section>
  );
}
