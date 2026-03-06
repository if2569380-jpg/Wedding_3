import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Admin client for storage operations - bypasses RLS using service role key
export function createAdminClient() {
  return createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
