import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function queryDB() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !adminKey) {
        console.error("Missing process env SUPABASE URL/KEY");
        return;
    }

    const sqlStr = fs.readFileSync('./supabase/migrations/20261123000000_phase_28_tri_party_verification.sql', 'utf-8');

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/run_sql`, {
            method: 'POST',
            headers: {
                'apikey': adminKey,
                'Authorization': `Bearer ${adminKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ query: sqlStr })
        });

        const result = await response.text();
        console.log("Migration Result:", result);
    } catch (e) {
        console.error("RPC Pipeline Error:", e);
    }
}
queryDB();
