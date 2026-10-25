import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isUserAdminByEmailOrMetadata } from "@/lib/auth-checks"

export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return { id: user.id, email: user.email ?? null }
})

export const getIsAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  if (isUserAdminByEmailOrMetadata(user)) {
    return true
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string }>()

    return profile?.role === "admin"
  } catch {
    return false
  }
})

export const requireAdmin = cache(async (redirectTo = "/admin/products") => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(redirectTo)}`)
  }

  let isAdmin = isUserAdminByEmailOrMetadata(user)
  if (!isAdmin) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle<{ role: string }>()

      if (profile?.role === "admin") {
        isAdmin = true
      }
    } catch {
      isAdmin = false
    }
  }

  if (!isAdmin) {
    redirect("/")
  }

  return { id: user.id, email: user.email ?? null }
})
