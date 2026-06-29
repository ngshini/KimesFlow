import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function ensureUserProfile(supabase: SupabaseClient<Database>, user: User, fullName?: string | null) {
  const metadata = user.user_metadata;
  const resolvedName = fullName ?? metadata.full_name ?? metadata.name ?? user.email ?? null;
  const avatarUrl = metadata.avatar_url ?? metadata.picture ?? null;

  return supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: resolvedName,
      avatar_url: avatarUrl,
    },
    { onConflict: "id" },
  );
}
