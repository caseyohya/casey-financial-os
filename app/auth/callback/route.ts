import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/executive-dashboard";
  const safeNext = next.startsWith("/") ? next : "/executive-dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    if (process.env.NODE_ENV === "development") {
      console.error("[auth:callback]", error);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
