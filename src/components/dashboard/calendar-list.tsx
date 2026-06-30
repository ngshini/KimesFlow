import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DashboardData } from "@/lib/data/dashboard";

export function CalendarList({ days }: { days: DashboardData["calendarDays"] }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">Calendar deadline</h2>
      </CardHeader>
      <CardContent>
        {days.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có task nào có deadline.</p>
        ) : (
          <div className="space-y-4">
            {days.map((day) => (
              <div key={day.date} className="rounded-md border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{day.label}</p>
                <div className="mt-2 space-y-2">
                  {day.tasks.map((task) => (
                    <Link key={task.id} className="block text-sm text-blue-600 hover:text-blue-700" href={`/tasks/${task.id}`}>
                      {task.title} · {task.projectName}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
