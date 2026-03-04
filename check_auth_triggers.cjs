const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const connectionString = process.env.VITE_SUPABASE_URL
    ? process.env.VITE_SUPABASE_URL.replace('https://', 'postgres://postgres.').replace('.supabase.co', ':6543/postgres')
    : '';

async function run() {
    const password = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;
    if (!connectionString || !password) {
        console.log("Missing DB connection info to check triggers directly.");
        return;
    }

    // Attempt connecting via pg
    const pool = new Pool({
        connectionString: connectionString.replace('postgres:', `postgres:${password}@`) // naive replace for testing
    });

    try {
        const client = await pool.connect();

        // Let's inspect triggers on auth.users
        const res = await client.query(`
            SELECT 
                tgname AS trigger_name,
                action_statement
            FROM information_schema.triggers
            WHERE event_object_schema = 'auth' 
            AND event_object_table = 'users';
        `);
        console.log("Auth Users Triggers:", res.rows);

        // Also let's look at recent logs for auth webhook errors if possible

        client.release();
    } catch (e) {
        console.log("Failed DB query:", e.message);
    }
}
run();
