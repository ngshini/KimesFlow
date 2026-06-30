"use client";

import Link from "next/link";
import { Bell, Bot, CalendarDays, FolderKanban, LayoutDashboard, ListTodo, Settings, Workflow } from "lucide-react";
import { usePathname } from "next/navigation";
import { routes } from "@/constants/routes";
import { cn } from "@/lib/utils";

const navItems = [
  { href: routes.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: routes.workspaces, label: "Workspaces", icon: Workflow },
  { href: routes.projects, label: "Projects", icon: FolderKanban },
  { href: routes.tasks, label: "My Tasks", icon: ListTodo },
  { href: "/dashboard#calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard#notifications", label: "Notifications", icon: Bell },
  { href: "/projects#ai", label: "AI Assistant", icon: Bot },
  { href: "/dashboard#settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur lg:block">
      <div className="flex h-16 items-center border-b border-slate-200/80 px-6">
        <Link className="flex items-center gap-3 text-lg font-semibold text-slate-950" href={routes.dashboard}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">K</span>
          KimesFlow
        </Link>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              pathname === item.href || (item.href !== routes.dashboard && pathname.startsWith(item.href.split("#")[0]))
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            )}
            href={item.href}
            prefetch
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 p-2 backdrop-blur lg:hidden">
      <nav className="grid grid-cols-4 gap-1">
        {navItems.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium",
              pathname === item.href || pathname.startsWith(item.href) ? "bg-blue-50 text-blue-700" : "text-slate-500",
            )}
            href={item.href}
            prefetch
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
