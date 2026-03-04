const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function push() {
    console.log("Deploying RLS Fix via Admin RPC Pipeline...");

    const sqlStr = fs.readFileSync('./supabase/migrations/20261103000005_fix_user_orgs_recursion.sql', 'utf8');

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/run_sql`, {
            method: 'POST',
            headers: {
                'apikey': process.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${adminKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ query: sqlStr })
        });

        console.log(`RPC Status: ${response.status} ${response.statusText}`);
        const result = await response.text();
        console.log("RPC Payload Result:");
        console.log(result);
    } catch (e) {
        console.error("RPC Pipeline Error:", e);
    }
}
push();
