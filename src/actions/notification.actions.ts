"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(formData: FormData) {
  const notificationId = String(formData.get("notificationId") ?? "");
  if (!notificationId) return;

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({
      is_read: true,
      status: "read",
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId);

  revalidatePath("/dashboard");
}
