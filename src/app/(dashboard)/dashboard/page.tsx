import { AlertTriangle, CheckCircle2, Clock, FolderKanban, ListTodo, Workflow } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { CalendarList } from "@/components/dashboard/calendar-list";
import { DashboardTaskList, RecentProjectsList } from "@/components/dashboard/dashboard-lists";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardData } from "@/lib/data/dashboard";
import { hasSupabaseEnv } from "@/lib/supabase/env";

function SupabaseSetupCard() {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-950">Thiếu cấu hình Supabase</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Hãy tạo file <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.local</code> từ <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.example</code>, điền URL và anon key thật từ Supabase, rồi restart dev server.
          </p>
        </div>
        <pre className="overflow-x-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
{`cp .env.example .env.local

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

npm run dev`}
        </pre>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  if (!hasSupabaseEnv()) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Cần cấu hình Supabase trước khi tải dữ liệu thật.</p>
        </div>
        <SupabaseSetupCard />
      </div>
    );
  }

  const data = await getDashboardData();
  const hasData = data.stats.workspaceCount > 0 || data.stats.projectCount > 0 || data.stats.taskCount > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Tổng quan tiến độ công việc từ dữ liệu Supabase.</p>
      </div>
      {!hasData ? (
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500">Chưa có dữ liệu. Hãy tạo workspace, project và task để dashboard bắt đầu hiển thị thống kê.</p>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Workflow} label="Tổng số workspace" tone="bg-cyan-50 text-cyan-700" value={String(data.stats.workspaceCount)} />
        <StatCard icon={FolderKanban} label="Tổng số project" tone="bg-blue-50 text-blue-600" value={String(data.stats.projectCount)} />
        <StatCard icon={ListTodo} label="Tổng số task" tone="bg-slate-100 text-slate-700" value={String(data.stats.taskCount)} />
        <StatCard icon={CheckCircle2} label="Task hoàn thành" tone="bg-emerald-50 text-emerald-600" value={String(data.stats.doneTaskCount)} />
        <StatCard icon={Clock} label="Task đang làm" tone="bg-amber-50 text-amber-600" value={String(data.stats.inProgressTaskCount)} />
        <StatCard icon={AlertTriangle} label="Task quá hạn" tone="bg-rose-50 text-rose-600" value={String(data.stats.overdueTaskCount)} />
        <StatCard icon={Clock} label="Đến hạn 7 ngày" tone="bg-violet-50 text-violet-600" value={String(data.stats.dueSoonTaskCount)} />
        <StatCard icon={CheckCircle2} label="Tỷ lệ hoàn thành" tone="bg-teal-50 text-teal-600" value={`${data.stats.completionRate}%`} />
      </div>
      <DashboardCharts
        tasksByAssignee={data.tasksByAssignee}
        tasksByDeadline={data.tasksByDeadline}
        tasksByPriority={data.tasksByPriority}
        tasksByStatus={data.tasksByStatus}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardTaskList emptyLabel="Không có task nào gần deadline." tasks={data.nearDeadlineTasks} title="Task gần deadline" />
        <DashboardTaskList emptyLabel="Bạn chưa được giao task nào." tasks={data.assignedTasks} title="Task được giao cho bạn" />
      </div>
      <CalendarList days={data.calendarDays} />
      <RecentProjectsList projects={data.recentProjects} />
    </div>
  );
}
