import { NextResponse } from "next/server";
import { addDays, formatISO, startOfToday } from "date-fns";
import { createTelegramNotification } from "@/lib/notifications/telegram";
import { createClient } from "@/lib/supabase/server";
import { getTelegramEnv } from "@/lib/supabase/env";

export async function POST(request: Request) {
  const { reminderSecret } = getTelegramEnv();
  if (reminderSecret && request.headers.get("x-reminder-secret") !== reminderSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const today = formatISO(startOfToday(), { representation: "date" });
  const tomorrow = formatISO(addDays(startOfToday(), 1), { representation: "date" });

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, project_id, title, due_date, status_id")
    .eq("assignee_id", user.id)
    .gte("due_date", today)
    .lte("due_date", tomorrow);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const statusIds = [...new Set(tasks.map((task) => task.status_id))];
  const { data: statuses } =
    statusIds.length > 0 ? await supabase.from("task_statuses").select("id, slug").in("id", statusIds) : { data: [] };
  const doneStatusIds = new Set((statuses ?? []).filter((status) => status.slug === "done").map((status) => status.id));
  const pendingTasks = tasks.filter((task) => !doneStatusIds.has(task.status_id));
  let sent = 0;
  let failed = 0;

  for (const task of pendingTasks) {
    const { data: project } = await supabase.from("projects").select("id, workspace_id").eq("id", task.project_id).single();
    if (!project) {
      failed += 1;
      continue;
    }

    const result = await createTelegramNotification(supabase, {
      workspaceId: project.workspace_id,
      projectId: project.id,
      taskId: task.id,
      userId: user.id,
      title: "Nhắc deadline task",
      body: `${task.title}\nDeadline: ${task.due_date}`,
    });

    if (result.ok) sent += 1;
    else failed += 1;
  }

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    total: pendingTasks.length,
  });
}
