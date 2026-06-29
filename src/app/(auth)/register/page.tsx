import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { routes } from "@/constants/routes";
import { createClient } from "@/lib/supabase/server";

export default async function RegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect(routes.dashboard);

  return (
    <AuthCard
      description="Tạo tài khoản để bắt đầu quản lý nhóm của bạn."
      switchHref={routes.login}
      switchLabel="Đã có tài khoản? Đăng nhập"
      title="Đăng ký"
    >
      <RegisterForm />
    </AuthCard>
  );
}
