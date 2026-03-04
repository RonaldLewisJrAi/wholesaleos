const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Using Supabase Session Pooler (IPv6/v4 resilient)
const conString = `postgresql://postgres.hhjzoufgoifvihuydnxq:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
const c = new Client({
    connectionString: conString,
    ssl: { rejectUnauthorized: false }
});

async function r() {
    try {
        console.log("Connecting securely directly to Postgres session pooler...");
        await c.connect();

        console.log("Deploying Phase 39.1 Hard Limits Triggers...");
        const limits_sql = fs.readFileSync('supabase/migrations/20261103000002_phase_39_1_hard_limits.sql', 'utf8');
        await c.query(limits_sql);
        console.log("SUCCESS");

        console.log("\nExecuting Verification Script (DO Block)...");
        const verify_sql = fs.readFileSync('verify_limit_enforcement.sql', 'utf8');

        // Capture NOTICE logs from PostgreSQL natively
        c.on('notice', msg => console.log('POSTGRES:', msg.message));

        await c.query(verify_sql);
        console.log("VERIFICATION SUCCESS");

        await c.end();
    } catch (e) {
        console.error("FATAL ERROR:", e);
        process.exit(1);
    }
}
r();
