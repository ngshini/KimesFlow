import Link from "next/link";
import { Check, Bell } from "lucide-react";
import { markNotificationReadAction } from "@/actions/notification.actions";
import { Button } from "@/components/ui/button";

type NotificationItem = {
  id: string;
  title: string;
  message: string | null;
  channel: string;
  createdAt: string;
  taskId: string | null;
};

type NotificationDropdownProps = {
  notifications: NotificationItem[];
};

export function NotificationDropdown({ notifications }: NotificationDropdownProps) {
  return (
    <div className="group relative">
      <Button aria-label="Thông báo" className="relative h-10 w-10 p-0" type="button" variant="secondary">
        <Bell className="h-4 w-4" />
        {notifications.length > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        ) : null}
      </Button>
      <div className="invisible absolute right-0 z-30 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
        <div className="mb-2 text-sm font-semibold text-slate-950">Thông báo</div>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500">Không có thông báo mới.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div key={notification.id} className="rounded-md border border-slate-100 p-3">
                <Link className="block text-sm font-medium text-slate-950 hover:text-blue-600" href={notification.taskId ? `/tasks/${notification.taskId}` : "/dashboard"}>
                  {notification.title}
                </Link>
                {notification.message ? <p className="mt-1 line-clamp-2 text-xs text-slate-500">{notification.message}</p> : null}
                <form action={markNotificationReadAction} className="mt-2">
                  <input name="notificationId" type="hidden" value={notification.id} />
                  <button className="inline-flex items-center gap-1 text-xs font-medium text-blue-600" type="submit">
                    <Check className="h-3 w-3" />
                    Đã đọc
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
