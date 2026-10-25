import "server-only"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Bypasses Row Level Security entirely — every row, every table, no auth.uid()
// check. Only ever call this from trusted server-to-server code that has
// already verified its caller some other way (e.g. a Stripe webhook whose
// signature we've checked). Never import this into anything that runs in
// response to a request from the browser without that kind of verification
// first, and never expose SUPABASE_SERVICE_ROLE_KEY to client code.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
