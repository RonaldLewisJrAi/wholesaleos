import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

// We will use the standard REST /pg API if exposed, or RPC.
// Alternatively, since we are constrained to HTTP, we will try to use the Deno Edge Function API proxy 
// or simply instruct the user to execute it via the Dashboard if all else fails.

async function runPatch() {
    try {
        const sql = fs.readFileSync('supabase/migrations/20261125000000_fix_org_bootstrap.sql', 'utf8');

        console.log('Sending SQL Payload to Supabase REST endpoint...');

        // Supabase has a hidden /pg REST endpoint for service keys on newer instances.
        const res = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ query: sql })
        });

        if (!res.ok) {
            console.error("Direct SQL execution failed. (HTTP REST API may restrict raw schema mutations).");
            console.log("Response:", await res.text());
        } else {
            console.log('Successfully pushed SQL Migration.');
        }

    } catch (err) {
        console.error('Error applying patch:', err);
    }
}

runPatch();
