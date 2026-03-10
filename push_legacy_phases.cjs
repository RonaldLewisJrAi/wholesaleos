const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDeploy() {
    console.log("Starting bulk deployment of legacy phase_*.sql files via RPC...");
    const migrationsDir = path.join(__dirname, 'supabase', 'migrations');

    // Read all files
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.startsWith('phase_') && f.endsWith('.sql'))
        .sort(); // sort alphabetically to hopefully maintain some semantic order

    console.log(`Found ${files.length} legacy phase files to process.`);

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
        console.log(`\n--- Processing: ${file} ---`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        // Execute via RPC
        const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

        if (error) {
            console.error(`ERROR running ${file}:`, error.message || error);
            failCount++;
        } else {
            console.log(`SUCCESS: ${file} executed successfully.`);
            successCount++;
        }
    }

    console.log(`\n=== DEPLOYMENT COMPLETE ===`);
    console.log(`Successfully applied: ${successCount}`);
    console.log(`Failed to apply: ${failCount}`);
}

runDeploy();
