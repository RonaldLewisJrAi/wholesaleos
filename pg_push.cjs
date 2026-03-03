const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const conString = `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.hhjzoufgoifvihuydnxq.supabase.co:5432/postgres`;

const c = new Client({
    connectionString: conString,
    ssl: { rejectUnauthorized: false }
});

async function r() {
    console.log("Connecting securely directly to db.hhjzoufgoifvihuydnxq.supabase.co...");
    await c.connect();
    console.log("Connected.");
    const q = fs.readFileSync('./supabase/migrations/phase_39_2_fix_rls_recursion.sql', 'utf8');
    await c.query(q);
    console.log('Successfully pushed SQL Migration 39.2 bypassing PostgREST!');
    await c.end();
}
r().catch(e => { console.error("FATAL ERROR", e); process.exit(1); });
