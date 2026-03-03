/* eslint-env node */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing DB credentials in .env.local - Service Role Key Required");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    try {
        console.log("Checking organizations table structure for signup constraint failures...");

        // Try an insert that we expect to fail or check column existence
        // Easiest is to select 1 row and print keys, but an empty table won't return keys if no row.
        // Let's force an error on insert and read the message, or just insert a dummy and rollback/delete.

        const testId = '00000000-0000-0000-0000-000000000001';

        const { data, error } = await supabase
            .from('organizations')
            .insert({
                name: 'Schema Test',
                subscription_tier: 'BASIC',
                subscription_status: 'DEMO',
                team_seat_limit: 1
            })
            .select();

        if (error) {
            console.error("Insert Failed. Error Diagnostics:");
            console.error(error);
        } else {
            console.log("Insert Succeeded. Deleting test org.");
            console.log(data);
            await supabase.from('organizations').delete().eq('id', data[0].id);
        }

    } catch (e) {
        console.error("Execution Failed:", e.message);
    }
}

checkSchema();
