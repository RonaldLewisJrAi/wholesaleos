import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import process from 'process';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("Testing insert with explicit INACTIVE status");
    const { data, error } = await supabase.from('organizations').insert([
        { name: 'test_org_status', subscription_status: 'INACTIVE', subscription_tier: 'FREE' }
    ]).select();

    if (error) {
        console.error("Organizations Insert Error:", error);
    } else {
        console.log("Success:", data);
        // Cleanup
        await supabase.from('organizations').delete().eq('id', data[0].id);
    }
}

testInsert();
