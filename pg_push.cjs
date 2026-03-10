const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Using direct remote database cluster connection avoiding the pooler
const conString = `postgresql://postgres.hhjzoufgoifvihuydnxq:${encodeURIComponent('Pluck4eva1981!')}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
const c = new Client({
    connectionString: conString,
    ssl: { rejectUnauthorized: false }
});

async function r() {
    try {
        console.log("Connecting securely directly to Postgres session pooler...");
        await c.connect();

        console.log("Deploying Phase 16 Marketplace Integrity schemas...");
        const limits_sql = fs.readFileSync('supabase/migrations/20261117000000_marketplace_integrity.sql', 'utf8');
        await c.query(limits_sql);
        console.log("SUCCESS");

        await c.end();
    } catch (e) {
        console.error("FATAL ERROR:", e);
        process.exit(1);
    }
}
r();
