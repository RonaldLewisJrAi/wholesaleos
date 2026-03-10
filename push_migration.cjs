require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const sql = fs.readFileSync('supabase/migrations/20261117000000_marketplace_integrity.sql', 'utf8');
    console.log('Executing SQL payload via explicitly mapped .env.local...');

    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
        console.error('Fatal Database Error:', error);
    } else {
        console.log('Phase 16 Migration successfully mapped to Remote Database!');
    }
}

run();
