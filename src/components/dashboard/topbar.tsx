import { LogOut, Search } from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/dashboard/notification-dropdown";
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
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
      <form action="/tasks" className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" name="query" placeholder="Tìm task..." />
      </form>
      <div className="ml-4 flex items-center gap-3">
        <NotificationDropdown notifications={unreadNotifications} />
        <form action={logoutAction}>
          <Button aria-label="Đăng xuất" className="h-10 w-10 p-0" type="submit" variant="secondary">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
        <Avatar name={displayName} src={profile?.avatar_url} />
      </div>
    </header>
  );
}
