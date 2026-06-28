import { Bell, LogOut, Search } from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" placeholder="Tìm project, task, workspace..." />
      </div>
      <div className="ml-4 flex items-center gap-3">
        <Button aria-label="Thông báo" className="h-10 w-10 p-0" type="button" variant="secondary">
          <Bell className="h-4 w-4" />
        </Button>
        <form action={logoutAction}>
          <Button aria-label="Đăng xuất" className="h-10 w-10 p-0" type="submit" variant="secondary">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
        <Avatar name="Demo User" />
      </div>
    </header>
  );
}
