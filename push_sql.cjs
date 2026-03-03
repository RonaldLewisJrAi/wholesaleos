const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function push() {
    console.log("Pushing Phase 39.1 via direct REST Query...");

    // Replace postgres:// url parsing logic, use pure query
    const query = fs.readFileSync('./supabase/migrations/phase_39_1_fix_rls_recursion.sql', 'utf8');

    // Run custom SQL via POST to the undocumented /query endpoint on Supabase PostgRest or raw RPC
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/run_sql`, {
        method: 'POST',
        headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: query })
    });

    console.log(response.status, response.statusText);
    const text = await response.text();
    console.log(text);
}

push();
