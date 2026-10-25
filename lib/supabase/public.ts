import "server-only"
import { createClient } from "@supabase/supabase-js"

// Cookie-less anon client for reads of public data (products have a
// public-read RLS policy). 'use cache' scopes can't call cookies(), so cached
// data functions must use this instead of lib/supabase/server.ts. Never use it
// for anything user-specific: with no session it only ever sees public rows.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
