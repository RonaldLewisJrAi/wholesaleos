const fs = require('fs');
const dotenv = require('dotenv');

// We merge both environments. Vercel has the Service Key, Local has the authentic Database URL.
const localEnv = dotenv.config({ path: '.env.local' }).parsed;
const vercelEnv = dotenv.config({ path: '.env.vercel.local' }).parsed;

async function push() {
    try {
        console.log("Pushing Phase 16 schemas via raw RPC run_sql API...");

        const query = fs.readFileSync('./supabase/migrations/20261117000000_marketplace_integrity.sql', 'utf8');

        const url = localEnv.VITE_SUPABASE_URL; // Guarantee Authentic REST Base
        const key = vercelEnv.SUPABASE_SERVICE_ROLE_KEY; // The only place Service Role is hosted
        const anon = localEnv.VITE_SUPABASE_ANON_KEY;

        if (!url || !url.startsWith("http")) {
            console.error("CRITICAL: Invalid or missing VITE_SUPABASE_URL.");
            return;
        }

        const response = await fetch(`${url}/rest/v1/rpc/run_sql`, {
            method: 'POST',
            headers: {
                'apikey': anon,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ query: query })
        });

        console.log("Status: ", response.status, response.statusText);
        const text = await response.text();
        console.log("Payload: ", text);

    } catch (err) {
        console.error(err);
    }
}

push();
