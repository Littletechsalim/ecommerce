"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export type AuthFormState = { error?: string; message?: string } | undefined

function sanitizeRedirectUrl(url: string | null | undefined): string {
  if (!url) return "/"
  // Ensure same-origin relative path, prevent open redirect attacks
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url
  }
  return "/"
}

export async function login(_prevState: AuthFormState, formData: FormData) {
  const email = formData.get("email")
  const password = formData.get("password")
  const rawNext = formData.get("next")?.toString()
  const next = sanitizeRedirectUrl(rawNext)

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: "Email and password are required." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect(next)
}

export async function signup(_prevState: AuthFormState, formData: FormData) {
  const email = formData.get("email")
  const password = formData.get("password")
  const rawNext = formData.get("next")?.toString()
  const next = sanitizeRedirectUrl(rawNext)

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: "Email and password are required." }
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  if (!data.session) {
    return { message: "Check your email to confirm your account, then sign in." }
  }

  redirect(next)
}

export async function signInWithGoogle(formData?: FormData) {
  const headersList = await headers()
  const origin = headersList.get("origin") ?? `https://${headersList.get("host")}`
  const rawNext = formData?.get("next")?.toString()
  const next = sanitizeRedirectUrl(rawNext)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  })

  if (error || !data.url) {
    redirect("/login?error=oauth_failed")
  }

  redirect(data.url)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}
