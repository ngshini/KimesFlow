"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type StatusDatum = {
  name: string;
  tasks: number;
  fill: string;
};

type PriorityDatum = {
  name: string;
  priority: string;
  tasks: number;
};

type DashboardChartsProps = {
  tasksByStatus: StatusDatum[];
  tasksByPriority: PriorityDatum[];
  tasksByAssignee: { name: string; tasks: number }[];
  tasksByDeadline: { name: string; tasks: number }[];
};

const priorityColors: Record<string, string> = {
  low: "#64748b",
  medium: "#2563eb",
  high: "#d97706",
  urgent: "#e11d48",
};

export function DashboardCharts({ tasksByStatus, tasksByPriority, tasksByAssignee, tasksByDeadline }: DashboardChartsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">Task theo trạng thái</h2>
        </CardHeader>
        <CardContent className="h-80">
          {tasksByStatus.some((item) => item.tasks > 0) ? (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={tasksByStatus} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} />
                <YAxis allowDecimals={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="tasks" radius={[6, 6, 0, 0]}>
                  {tasksByStatus.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500">Chưa có task để hiển thị biểu đồ.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">Task theo priority</h2>
        </CardHeader>
        <CardContent className="h-80">
          {tasksByPriority.some((item) => item.tasks > 0) ? (
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie data={tasksByPriority} dataKey="tasks" innerRadius={56} nameKey="name" outerRadius={96} paddingAngle={2}>
                  {tasksByPriority.map((entry) => (
                    <Cell key={entry.priority} fill={priorityColors[entry.priority] ?? "#2563eb"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500">Chưa có task để hiển thị biểu đồ.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">Task theo người phụ trách</h2>
        </CardHeader>
        <CardContent className="h-80">
          {tasksByAssignee.some((item) => item.tasks > 0) ? (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={tasksByAssignee} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} />
                <YAxis allowDecimals={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="tasks" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500">Chưa có task được gán người phụ trách.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">Task theo deadline</h2>
        </CardHeader>
        <CardContent className="h-80">
          {tasksByDeadline.some((item) => item.tasks > 0) ? (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={tasksByDeadline} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} />
                <YAxis allowDecimals={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="tasks" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500">Chưa có deadline để hiển thị.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
