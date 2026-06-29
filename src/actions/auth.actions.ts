"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { loginSchema, registerSchema } from "@/lib/validations/auth.schema";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/constants/routes";

export type AuthActionState = {
  error?: string;
  success?: string;
};

function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email hoặc mật khẩu không đúng.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.";
  }

  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "Email này đã được đăng ký.";
  }

  return message || "Không thể xử lý yêu cầu. Vui lòng thử lại.";
}

export async function loginAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: getAuthErrorMessage(error.message) };

  redirect(routes.dashboard);
}

export async function registerAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const supabase = await createClient();
  const { email, password, fullName } = parsed.data;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { error: getAuthErrorMessage(error.message) };

  if (data.user && data.session) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: fullName,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      return { error: "Tài khoản đã tạo nhưng chưa thể tạo hồ sơ người dùng. Vui lòng thử đăng nhập lại." };
    }
  }

  if (data.user && !data.session) {
    return { success: "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập." };
  }

  redirect(routes.dashboard);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(routes.login);
}

export async function googleLoginAction() {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin ?? ""}/auth/callback`,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    redirect(`${routes.login}?error=google_oauth_failed`);
  }

  redirect(data.url);
}
