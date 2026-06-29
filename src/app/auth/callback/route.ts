import { NextResponse, type NextRequest } from "next/server";
import { routes } from "@/constants/routes";
import { ensureUserProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return routes.dashboard;
  return next;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL(`${routes.login}?error=missing_oauth_code`, requestUrl.origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL(`${routes.login}?error=oauth_callback_failed`, requestUrl.origin));
  }

  await ensureUserProfile(supabase, data.user);

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
