import type { ReactNode } from "react";
import Link from "next/link";
import { Bot, KanbanSquare, LayoutDashboard, MessageSquare, ShieldCheck, Workflow } from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description: string;
  switchHref: string;
  switchLabel: string;
  next?: string;
  children: ReactNode;
};

export function AuthCard({ title, description, switchHref, switchLabel, next = "", children }: AuthCardProps) {
  const features = [
    { label: "Quản lý dự án", icon: Workflow },
    { label: "Kanban kéo thả", icon: KanbanSquare },
    { label: "Task, subtask và file", icon: ShieldCheck },
    { label: "Chat trong task", icon: MessageSquare },
    { label: "Dashboard realtime", icon: LayoutDashboard },
    { label: "AI tạo task tiếng Việt", icon: Bot },
  ];

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.35),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(124,58,237,0.24),transparent_28%)]" />
        <div className="relative">
          <div className="flex items-center gap-3 text-xl font-semibold">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500">K</span>
            KimesFlow
          </div>
          <h1 className="mt-16 max-w-xl text-4xl font-semibold tracking-tight">Điều hành dự án, task và cộng tác nhóm trong một không gian rõ ràng.</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">Kanban, dashboard, subtask, comment, file và thông báo được gom thành workflow thống nhất cho đội ngũ vận hành nhanh hơn.</p>
        </div>
        <div className="relative grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-100">
              <feature.icon className="h-4 w-4 text-blue-300" />
              {feature.label}
            </div>
          ))}
        </div>
      </section>
      <main className="grid place-items-center px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </CardHeader>
          <CardContent>
            <GoogleAuthButton next={next} />
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">hoặc</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            {children}
            <Link className="mt-5 block text-center text-sm font-medium text-blue-600 hover:text-blue-700" href={switchHref}>
              {switchLabel}
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
