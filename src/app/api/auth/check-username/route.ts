import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username parameter is required" },
      { status: 400 }
    );
  }

  if (username.length < 2) {
    return NextResponse.json(
      { error: "Username must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .ilike("full_name", username)
      .maybeSingle();

    if (error) {
      // If table doesn't exist yet, treat username as available
      if (error.code === "42P01") {
        return NextResponse.json({ available: true });
      }
      throw error;
    }

    return NextResponse.json({ available: !data });
  } catch (error) {
    console.error("Error checking username:", error);
    return NextResponse.json(
      { error: "Failed to check username availability" },
      { status: 500 }
    );
  }
}
