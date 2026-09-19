// Supabase Client Wrapper (if credentials are provided in frontend)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isClientSupabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
