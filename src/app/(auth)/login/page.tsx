import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { routes } from "@/constants/routes";

export default function LoginPage() {
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
