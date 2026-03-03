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
    console.error("Missing DB credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    try {
        console.log("Fetching profiles schema...");

        // We'll query a single row to see its keys, or try an update with dummy data
        const { data, error } = await supabase.from('profiles').select('*').limit(1);

        if (error) {
            console.error("Error fetching profiles:", error);
            return;
        }

        if (data && data.length > 0) {
            console.log("Columns found on profiles table:");
            console.log(Object.keys(data[0]).join(', '));
        } else {
            console.log("Profiles table is empty. Trying to insert and rollback to get keys...");
            const testId = '00000000-0000-0000-0000-000000000000';
            const { data: insertData, error: insertError } = await supabase
                .from('profiles')
                .insert({ id: testId })
                .select();

            if (insertError) {
                console.log("Insert failed, but error might tell us missing fields:", insertError);
            } else {
                console.log("Columns found:");
                console.log(Object.keys(insertData[0]).join(', '));
                await supabase.from('profiles').delete().eq('id', testId);
            }
        }

    } catch (e) {
        console.error("Execution Failed:", e.message);
    }
}

checkSchema();
