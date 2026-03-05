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

// --- [WHOLESALEOS TELEMETRY] MONKEY PATCH ---
if (supabase) {
    const originalFrom = supabase.from.bind(supabase);
    supabase.from = (table) => {
        console.log(`[WHOLESALEOS TELEMETRY] supabase.from('${table}') called`);
        const queryBuilder = originalFrom(table);

        // Intercept .insert()
        if (queryBuilder.insert) {
            const originalInsert = queryBuilder.insert.bind(queryBuilder);
            queryBuilder.insert = (payload, options) => {
                console.log(`[WHOLESALEOS TELEMETRY] supabase.from('${table}').insert() called with payload:`, payload);
                return originalInsert(payload, options);
            };
        }

        return queryBuilder;
    };
}

// Global fetch interceptor for granular REST traffic
if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        const method = args[1]?.method || 'GET';

        if (url.includes('/rest/v1/organizations') || url.includes('/rest/v1/user_organizations') || url.includes('/rest/v1/profiles')) {
            console.log(`[WHOLESALEOS TELEMETRY] OUTGOING ${method} REQUEST to ${url}`, args[1]?.body ? JSON.parse(args[1].body) : 'No Body');
        }

        return originalFetch(...args);
    };
}
// --- END MONKEY PATCH ---
