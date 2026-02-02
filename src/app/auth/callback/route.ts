import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  // Create a fresh Supabase client for server-side operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables");
    return NextResponse.redirect(`${origin}/es?error=config_error`);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  if (code) {
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(`${origin}/es?error=auth_callback_failed`);
    }

    // Check if the user has a profile with a username (full_name)
    if (sessionData?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", sessionData.user.id)
        .maybeSingle();

      // If no profile or no username, redirect to complete profile page
      if (!profile?.full_name) {
        return NextResponse.redirect(`${origin}/es/complete-profile`);
      }
    }
  }

  // Redirect to the default locale home page after successful verification
  return NextResponse.redirect(`${origin}/es`);
}
