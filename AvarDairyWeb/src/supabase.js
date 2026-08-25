import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zqnhkjzgbsgprnkskhzv.supabase.co'
const supabaseAnonKey = 'sb_publishable_Tk_PzmpYpUCnyUjfQpmZ3Q_PW9W45ox'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
