/**
 * Platform Resilience Layer
 * Centralized environment configuration gateway.
 * Never use `import.meta.env` directly outside of this file.
 */
export const ENV = {
    // Mapbox GIS Render Engine
    MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN || null,

    // Core Backend / Authentication
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || null,
    SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || null,

    // AI Intelligence Endpoints
    GEMINI_KEY: import.meta.env.VITE_GEMINI_API_KEY || null,

    // API Routing Fallbacks
    API_URL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001'),

    // Platform Context
    IS_PROD: import.meta.env.PROD,
    IS_DEV: import.meta.env.DEV
};
