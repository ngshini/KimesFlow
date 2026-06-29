import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { routes } from "@/constants/routes";
import { createClient } from "@/lib/supabase/server";

export default async function AppDashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(routes.login);

  return <DashboardLayout>{children}</DashboardLayout>;
}
