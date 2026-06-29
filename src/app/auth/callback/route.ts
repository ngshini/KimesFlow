import { NextResponse, type NextRequest } from "next/server";
import { routes } from "@/constants/routes";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? routes.dashboard;

  if (!code) {
    return NextResponse.redirect(new URL(`${routes.login}?error=missing_oauth_code`, requestUrl.origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL(`${routes.login}?error=oauth_callback_failed`, requestUrl.origin));
  }

  const metadata = data.user.user_metadata;
  const fullName = metadata.full_name ?? metadata.name ?? data.user.email ?? null;
  const avatarUrl = metadata.avatar_url ?? metadata.picture ?? null;

  await supabase.from("profiles").upsert(
    {
      id: data.user.id,
      full_name: fullName,
      avatar_url: avatarUrl,
    },
    { onConflict: "id" },
  );

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
