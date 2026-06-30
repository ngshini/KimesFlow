import Link from "next/link";
import dynamic from "next/dynamic";
import { AlertTriangle, CheckCircle2, Clock, FolderKanban, ListTodo, Plus, UserPlus, Workflow } from "lucide-react";
import { CalendarList } from "@/components/dashboard/calendar-list";
import { DashboardTaskList, RecentProjectsList } from "@/components/dashboard/dashboard-lists";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardData } from "@/lib/data/dashboard";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const DashboardCharts = dynamic(() => import("@/components/dashboard/dashboard-charts").then((mod) => mod.DashboardCharts), {
  loading: () => (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent>
            <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
          </CardContent>
        </Card>
      ))}
    </div>
  ),
});

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
  const today = new Intl.DateTimeFormat("vi-VN", { dateStyle: "full" }).format(new Date());

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-blue-100">{today}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Chào mừng trở lại KimesFlow</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Theo dõi tiến độ, deadline và công việc của đội ngũ từ dữ liệu Supabase realtime.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/projects">
              <Button className="bg-white text-blue-700 hover:bg-blue-50" type="button">
                <Plus className="h-4 w-4" />
                Tạo task
              </Button>
            </Link>
            <Link href="/projects">
              <Button className="border-white/20 bg-white/10 text-white hover:bg-white/15" type="button" variant="secondary">
                <FolderKanban className="h-4 w-4" />
                Tạo project
              </Button>
            </Link>
            <Link href="/workspaces">
              <Button className="border-white/20 bg-white/10 text-white hover:bg-white/15" type="button" variant="secondary">
                <UserPlus className="h-4 w-4" />
                Mời thành viên
              </Button>
            </Link>
          </div>
        </div>
      </section>
      {!hasData ? (
        <EmptyState
          action={
            <Link href="/workspaces">
              <Button type="button">Tạo workspace đầu tiên</Button>
            </Link>
          }
          description="Hãy tạo workspace, project và task để dashboard bắt đầu hiển thị thống kê thật."
          icon={Workflow}
          title="Dashboard đang chờ dữ liệu"
        />
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
