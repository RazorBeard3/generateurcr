import { createClient } from '@supabase/supabase-js'

// Clé anon (publique) — safe à exposer côté navigateur
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
