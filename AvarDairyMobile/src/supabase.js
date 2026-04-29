import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zqnhkjzgbsgprnkskhzv.supabase.co';
const supabaseAnonKey = 'sb_publishable_Tk_PzmpYpUCnyUjfQpmZ3Q_PW9W45ox';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
