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

        // Find user by email (Wait, list users doesn't let us filter by email directly easily in older versions, 
        // let's do a raw database query or try the admin API)

        // Actually we can just do an RPC or just let's try calling auth.admin.deleteUser directly if we get ID

        // Let's query auth.users via database role (we have service key)
        const { data: users, error: selectErr } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', 'demo@wholesale-os.com');

        // Wait, profiles might not have email or it's out of sync.
        // Let's just try to query auth schema via supabase JS? supabase js does not allow auth query via from('auth.users').

        const { data: { users: authUsers }, error: listErr } = await supabase.auth.admin.listUsers();
        if (listErr) throw listErr;

        const demoUser = authUsers.find(u => u.email === 'demo@wholesale-os.com');

        if (!demoUser) {
            console.log("Demo user not found in auth.users.");
        } else {
            console.log(`Found demo user with ID: ${demoUser.id}. Deleting...`);
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
