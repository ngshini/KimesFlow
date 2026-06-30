"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TaskRealtimeRefreshProps = {
  taskId: string;
};

export function TaskRealtimeRefresh({ taskId }: TaskRealtimeRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`task-detail-${taskId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `task_id=eq.${taskId}` }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "subtasks", filter: `task_id=eq.${taskId}` }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "attachments", filter: `task_id=eq.${taskId}` }, () => router.refresh())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, taskId]);

  return null;
}
