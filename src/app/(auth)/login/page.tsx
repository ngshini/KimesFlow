import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { routes } from "@/constants/routes";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

function getSafeNextPath(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "";
  return next;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = getSafeNextPath(params.next);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect(next || routes.dashboard);

  return (
    <AuthCard
      description="Đăng nhập để tiếp tục quản lý workspace, project và task."
      switchHref={routes.register}
      switchLabel="Chưa có tài khoản? Đăng ký"
      title="Đăng nhập"
      next={next}
    >
      <LoginForm next={next} />
    </AuthCard>
  );
}
