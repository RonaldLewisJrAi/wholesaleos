/* eslint-disable no-undef */
/* eslint-env node */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
    const email = `test_signup_${Date.now()}@example.com`;
    console.log("Trying to sign up", email);
    try {
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password: 'Password123!',
            email_confirm: true
        });

        if (error) {
            console.log("Got error, writing to err.json");
            fs.writeFileSync('err.json', JSON.stringify(error, null, 2));
        } else {
            console.log("Success");
            await supabase.auth.admin.deleteUser(data.user.id);
        }
    } catch (err) {
        fs.writeFileSync('err.json', JSON.stringify(err, null, 2));
    }
}

testSignup();
