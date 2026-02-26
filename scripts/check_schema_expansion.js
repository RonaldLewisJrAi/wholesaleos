import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, './.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing DB credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('id')
            .limit(1);

        if (error) {
            console.error('Schema check failed (likely not executed):', error.message);
        } else {
            console.log('Schema expansion HAS been executed. Organizations table exists.');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkSchema();
