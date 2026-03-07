import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function queryDB() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const sqlStr = `
        INSERT INTO auth.users (id, instance_id, aud, role, email) 
        VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_rpc_insert@example.com');
    `;

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
        console.log(result);
    } catch (e) {
        console.error("RPC Pipeline Error:", e);
    }
}
queryDB();
