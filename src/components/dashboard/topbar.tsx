import Link from "next/link";
import { FolderPlus, LogOut, Search, Settings, User } from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/dashboard/notification-dropdown";
import { QuickTaskModal } from "@/components/task/quick-task-modal";
import { Input } from "@/components/ui/input";
import { getUnreadNotifications } from "@/lib/data/notifications";
import { createClient } from "@/lib/supabase/server";

export async function Topbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, unreadNotifications] = user
    ? await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url, email").eq("id", user.id).maybeSingle(),
        getUnreadNotifications(),
      ])
    : [{ data: null }, []];

  const displayName = profile?.full_name ?? profile?.email ?? user?.email ?? "Người dùng";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur lg:px-8">
      <form action="/tasks" className="relative w-full max-w-sm lg:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9" name="query" placeholder="Tìm project hoặc task..." />
      </form>
      <div className="ml-4 flex items-center gap-3">
        <QuickTaskModal />
        <Link href="/projects" className="hidden md:block">
          <Button type="button" variant="secondary">
            <FolderPlus className="h-4 w-4" />
            Tạo project
          </Button>
        </Link>
        <NotificationDropdown notifications={unreadNotifications} />
        <div className="group relative">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm" type="button">
            <Avatar className="h-8 w-8" name={displayName} src={profile?.avatar_url} />
            <span className="hidden max-w-28 truncate text-sm font-medium text-slate-700 xl:block">{displayName}</span>
          </button>
          <div className="invisible absolute right-0 z-30 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
            <Link className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50" href="/dashboard#profile">
              <User className="h-4 w-4" />
              Profile
            </Link>
            <Link className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50" href="/dashboard#settings">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <form action={logoutAction}>
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50" type="submit">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
