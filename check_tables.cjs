const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const conString = `postgresql://postgres.hhjzoufgoifvihuydnxq:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
const c = new Client({ connectionString: conString, ssl: { rejectUnauthorized: false } });

async function check() {
    await c.connect();
    const res = await c.query(`
        SELECT trigger_name, action_statement 
        FROM information_schema.triggers 
        WHERE event_object_table = 'deals';
    `);
    console.log("DEALS TRIGGERS:");
    res.rows.forEach(r => console.log(r.trigger_name));
    await c.end();
}
check().catch(console.error);
