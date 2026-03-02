const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase variables in .env.vercel.local");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const SUPER_ADMIN_EMAIL = 'ronald_lewis_jr@live.com';

async function syncSuperAdmin() {
    console.log(`Starting Phase 36 Auth Sync for ${SUPER_ADMIN_EMAIL}...`);

    try {
        // 1. Check if user exists in auth.users
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) throw usersError;

        let authUser = usersData.users.find(u => u.email === SUPER_ADMIN_EMAIL);
        let password = crypto.randomBytes(16).toString('hex') + "A!1"; // High entropy + complex

        if (!authUser) {
            console.log("Super Admin not found in auth.users. Creating...");
            const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: SUPER_ADMIN_EMAIL,
                password: password,
                email_confirm: true,
                user_metadata: { role: 'GLOBAL_SUPER_ADMIN' }
            });
            if (createError) throw createError;
            authUser = createData.user;
            console.log(`✅ Auth user created successfully. ID: ${authUser.id}`);
            console.log(`\n\n🚨 IMPORTANT: Super Admin Password Generated: ${password}\n\n`);
        } else {
            console.log(`✅ Auth user already exists. ID: ${authUser.id}`);
            // Force reset password so user knows it
            console.log("Force resetting password for safety...");
            const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
                password: password,
                email_confirm: true,
                user_metadata: { role: 'GLOBAL_SUPER_ADMIN' }
            });
            if (resetError) throw resetError;
            console.log(`✅ Password reset. ID: ${authUser.id}`);
            console.log(`\n\n🚨 IMPORTANT: NEW Super Admin Password Generated: ${password}\n\n`);
        }

        // 2. Synchronize Profiles Table
        console.log("Checking profiles table...");
        const { data: existingProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
        }

        if (existingProfile) {
            if (existingProfile.id !== authUser.id) {
                console.log(`⚠️ UUID Mismatch Detected! Profile ID: ${existingProfile.id}, Auth ID: ${authUser.id}`);
                console.log("Deleting old orphaned profile...");

                // Need to remove old profile and recreate or update
                // RLS or foreign keys might complicate naive update. Best is to insert a unified record.
                const { error: delError } = await supabaseAdmin.from('profiles').delete().eq('id', existingProfile.id);
                if (delError) throw delError;

                console.log("Creating new synced profile row...");
                const { error: insertError } = await supabaseAdmin.from('profiles').insert({
                    id: authUser.id,
                    first_name: 'Ronald',
                    last_name: 'Lewis Jr.',
                    system_role: 'GLOBAL_SUPER_ADMIN',
                    mfa_enabled: true
                });
                if (insertError) throw insertError;
                console.log(`✅ Profile synchronized successfully with id: ${authUser.id}`);
            } else {
                console.log(`✅ Profile UUID perfectly matches Auth UUID.`);
                // Ensure role is exactly right
                await supabaseAdmin.from('profiles').update({
                    system_role: 'GLOBAL_SUPER_ADMIN',
                    mfa_enabled: true
                }).eq('id', authUser.id);
            }
        } else {
            console.log("No profile found. Creating synchronized profile...");
            const { error: insertError } = await supabaseAdmin.from('profiles').insert({
                id: authUser.id,
                first_name: 'Ronald',
                last_name: 'Lewis Jr.',
                system_role: 'GLOBAL_SUPER_ADMIN',
                mfa_enabled: true
            });
            if (insertError) throw insertError;
            console.log(`✅ Profile created successfully with id: ${authUser.id}`);
        }

        // 3. Purge anomalous Super Admins
        console.log("Verifying SINGLE super admin constraint...");
        const { data: anomalousProfiles, error: anomalyError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('system_role', 'GLOBAL_SUPER_ADMIN')
            .neq('id', authUser.id);

        if (anomalyError) throw anomalyError;

        if (anomalousProfiles && anomalousProfiles.length > 0) {
            console.warn(`⚠️ Found ${anomalousProfiles.length} rogue GLOBAL_SUPER_ADMINs. Demoting them...`);
            for (let p of anomalousProfiles) {
                await supabaseAdmin.from('profiles').update({ system_role: 'USER' }).eq('id', p.id);
                console.log(`Demoted rogue admin: ${p.id}`);
            }
        } else {
            console.log("✅ Single Super Admin integrity verified.");
        }

        console.log("\n==============================");
        console.log("PHASE 36 SYNCHRONIZATION COMPLETE!");
        console.log("==============================");

    } catch (error) {
        console.error("❌ Synchronization Failed:", error);
    }
}

syncSuperAdmin();
