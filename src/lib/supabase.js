import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    if (import.meta.env.PROD) {
        throw new Error('Supabase environment configuration is missing. Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    } else {
        console.warn('Supabase environment configuration is missing. Ensure .env is set up for local development.');
    }
}

// Create a single supabase client for interacting with your database
export const supabase = (supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
