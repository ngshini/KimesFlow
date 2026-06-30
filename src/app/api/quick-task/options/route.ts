import { NextResponse } from "next/server";
import { getQuickTaskOptions } from "@/lib/data/quick-task-options";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const projects = await getQuickTaskOptions();
  return NextResponse.json({ ok: true, projects });
}
