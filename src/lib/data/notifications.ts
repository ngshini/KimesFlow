import { createClient } from "@/lib/supabase/server";

export async function getUnreadNotifications(limit = 8) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, message, channel, created_at, task_id")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];

  return data.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message ?? notification.body,
    channel: notification.channel,
    createdAt: notification.created_at,
    taskId: notification.task_id,
  }));
}
