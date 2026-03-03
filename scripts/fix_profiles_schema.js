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

async function checkAndFixProfiles() {
    try {
        console.log("Checking if 'organization_id' exists on 'profiles'...");

        // Attempt an update with a fake ID to see if the column exists
        const { error: testError } = await supabase
            .from('profiles')
            .update({ organization_id: '00000000-0000-0000-0000-000000000000' })
            .eq('id', '00000000-0000-0000-0000-000000000000');

        if (testError && testError.message.includes("Could not find the 'organization_id' column")) {
            console.log("Column 'organization_id' is genuinely missing from Supabase!");
            console.log("To fix this, please run the following SQL in your Supabase Dashboard SQL Editor:");
            console.log(`
-- Add the organization_id column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Add system_role if missing as well (just in case since it's also updated in Signup)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS system_role TEXT DEFAULT 'USER';

-- Reload the PostgREST API schema cache
NOTIFY pgrst, 'reload schema';
`);
        } else {
            console.log("Column appears to exist or threw a different error relative to data:");
            console.log(testError?.message || "No error returned on column check.");
            console.log("We will force a schema cache reload instruction just in case.");
            console.log("Run this in SQL Editor: NOTIFY pgrst, 'reload schema';");
        }

    } catch (e) {
        console.error("Execution Failed:", e.message);
    }
}

checkAndFixProfiles();
