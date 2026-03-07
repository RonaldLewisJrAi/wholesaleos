import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("Testing insert into profiles to check constraints");
    const { data, error } = await supabase.from('profiles').insert([
        { id: '00000000-0000-0000-0000-000000000000' }
    ]);

    if (error) {
        console.error("Profiles Insert Error:", error);
    } else {
        console.log("Success?", data);
    }
}

testInsert();
