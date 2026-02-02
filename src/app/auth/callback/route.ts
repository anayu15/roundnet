import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(`${origin}/es?error=auth_callback_failed`);
    }
  }

  // Redirect to the default locale home page after successful verification
  return NextResponse.redirect(`${origin}/es`);
}
