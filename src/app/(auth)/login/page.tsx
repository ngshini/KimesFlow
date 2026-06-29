import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { routes } from "@/constants/routes";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect(routes.dashboard);

  return (
    <AuthCard
      description="Đăng nhập để tiếp tục quản lý workspace, project và task."
      switchHref={routes.register}
      switchLabel="Chưa có tài khoản? Đăng ký"
      title="Đăng nhập"
    >
      <LoginForm />
    </AuthCard>
  );
}
