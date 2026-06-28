import Link from "next/link";
import { BarChart3, FolderKanban, LayoutDashboard, Settings, Workflow } from "lucide-react";
import { routes } from "@/constants/routes";

const navItems = [
  { href: routes.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: routes.workspaces, label: "Workspaces", icon: Workflow },
  { href: routes.projects, label: "Projects", icon: FolderKanban },
  { href: "/dashboard#reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard#settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <Link className="text-lg font-semibold text-slate-950" href={routes.dashboard}>
          Kimes Flow
        </Link>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            href={item.href}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
