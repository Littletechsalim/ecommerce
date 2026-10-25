import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { isUserAdminByEmailOrMetadata } from "@/lib/auth-checks"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the auth token cookie on every request. Server Components can't
  // set cookies themselves, so this is the only place the session gets renewed.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Guard /admin and all subpaths
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/login"
      const nextParam = request.nextUrl.pathname + request.nextUrl.search
      redirectUrl.searchParams.set("next", nextParam)
      const redirectResponse = NextResponse.redirect(redirectUrl)
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie)
      })
      return redirectResponse
    }

    let isAdmin = isUserAdminByEmailOrMetadata(user)
    if (!isAdmin) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()

        if (profile?.role === "admin") {
          isAdmin = true
        }
      } catch {
        isAdmin = false
      }
    }

    if (!isAdmin) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/"
      redirectUrl.search = ""
      const redirectResponse = NextResponse.redirect(redirectUrl)
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie)
      })
      return redirectResponse
    }
  }

  return response
}
