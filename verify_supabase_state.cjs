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
        console.log("Missing DB connection info to check status directly.");
        return;
    }

    const pool = new Pool({
        connectionString: connectionString.replace('postgres:', `postgres:${password}@`)
    });

    try {
        const client = await pool.connect();

        console.log("--- Supabase Integrity Check ---");

        // 1. Check if the RLS policies on organizations are intact
        const rlsOrg = await client.query(`
            SELECT policyname, permissive, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE tablename = 'organizations';
        `);
        console.log("\n[Organizations RLS Policies]:", rlsOrg.rows.length);
        rlsOrg.rows.forEach(r => console.log(`  - ${r.policyname} (${r.cmd})`));

        // 2. Check Profiles RLS
        const rlsProf = await client.query(`
            SELECT policyname, permissive, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE tablename = 'profiles';
        `);
        console.log("\n[Profiles RLS Policies]:", rlsProf.rows.length);
        rlsProf.rows.forEach(r => console.log(`  - ${r.policyname} (${r.cmd})`));

        // 3. Verify the public.profiles trigger is still active
        const trig = await client.query(`
            SELECT tgname, action_statement
            FROM information_schema.triggers
            WHERE event_object_schema = 'auth' 
            AND event_object_table = 'users';
        `);
        console.log("\n[Auth Users Triggers]:", trig.rows.length);
        trig.rows.forEach(r => console.log(`  - ${r.tgname}: ${r.action_statement}`));

        client.release();
        console.log("\nVerification Complete.");
    } catch (e) {
        console.log("Failed DB query:", e.message);
    } finally {
        pool.end();
    }
}
run();
