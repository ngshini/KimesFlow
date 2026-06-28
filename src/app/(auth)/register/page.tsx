import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { routes } from "@/constants/routes";

export default function RegisterPage() {
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
