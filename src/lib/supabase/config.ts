export const SUPABASE_URL = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  "https://qadbvrwtdugxfeoojkuh.supabase.co";

export const SUPABASE_ANON_KEY = 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  "sb_publishable_rAzfBavYElWK0WYPNqCrEg_vzd5l-JE";

export const SUPABASE_SERVICE_ROLE_KEY = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  SUPABASE_ANON_KEY;
