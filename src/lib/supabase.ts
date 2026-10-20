import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};

const supabaseUrl = 
  metaEnv.NEXT_PUBLIC_SUPABASE_URL || 
  metaEnv.VITE_SUPABASE_URL || 
  'https://zowpgsfupecvzxirzqti.supabase.co';

const supabaseAnonKey = 
  metaEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  metaEnv.VITE_SUPABASE_ANON_KEY || 
  'sb_publishable_HtwW8FpC1YE97ceq0dzwfQ_i7gxAwFd';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
