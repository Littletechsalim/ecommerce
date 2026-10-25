export function parseAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS ?? ""
  return envEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isUserAdminByEmailOrMetadata(
  user: { email?: string | null; app_metadata?: Record<string, unknown> } | null
): boolean {
  if (!user) return false

  const adminEmails = parseAdminEmails()
  if (user.email && adminEmails.includes(user.email.toLowerCase())) {
    return true
  }

  if (user.app_metadata && user.app_metadata.role === "admin") {
    return true
  }

  return false
}
