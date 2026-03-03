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
    console.error("Missing DB credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function removeDemoAccount() {
    try {
        console.log("Searching for demo@wholesale-os.com...");

        let page = 1;
        let demoUser = null;

        while (true) {
            const { data: { users: authUsers }, error: listErr } = await supabase.auth.admin.listUsers({
                page: page,
                perPage: 100
            });

            if (listErr) throw listErr;

            if (!authUsers || authUsers.length === 0) {
                break; // No more users
            }

            demoUser = authUsers.find(u => u.email === 'demo@wholesale-os.com');
            if (demoUser) {
                break;
            }

            page++;
        }

        if (!demoUser) {
            console.log("Demo user not found in auth.users.");
        } else {
            console.log(`Found demo user with ID: ${demoUser.id} on page ${page}. Deleting...`);
            const { error: delErr } = await supabase.auth.admin.deleteUser(demoUser.id);
            if (delErr) {
                console.error("Failed to delete from auth:", delErr.message);
            } else {
                console.log("Successfully deleted demo user from Supabase Auth.");
            }
        }

    } catch (e) {
        console.error("Execution Failed:", e.message);
    }
}

removeDemoAccount();
