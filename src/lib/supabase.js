import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
// If env vars are missing (e.g., local dev without .env setup), it won't crash the UI
export const supabase = (supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
