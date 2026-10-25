import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const rawNext = searchParams.get("next") ?? "/"
  // Only allow same-origin relative paths — a raw redirect target lets an
  // attacker bounce a freshly-authenticated user to an external site
  // (e.g. "next=@evil.com" turns "${origin}${next}" into a valid URL to evil.com).
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
