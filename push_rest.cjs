const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function run() {
    try {
        console.log("Preparing to push Phase 16 schemas directly via fetch API...");

        const sql = fs.readFileSync('supabase/migrations/20261117000000_marketplace_integrity.sql', 'utf8');
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Remote Credentials");
        }

        // We use the REST API to execute PostgreSQL statements if pg pooler is down and RPC is missing
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Execution Failed: ${response.status} - ${errText}`);
        }

        console.log("Phase 16 Market Integrity schema applied successfully on the remote server.");
    } catch (err) {
        console.error(err);
    }
}

run();
