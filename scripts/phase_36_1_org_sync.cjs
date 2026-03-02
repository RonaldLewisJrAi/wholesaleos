const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase variables in .env.local");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const SUPER_ADMIN_EMAIL = 'ronald_lewis_jr@live.com';

async function syncProfileAndOrg() {
    console.log(`Starting Phase 36.1 Org Sync for ${SUPER_ADMIN_EMAIL}...`);

    try {
        // 1. Fetch Auth User
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) throw usersError;

        const authUser = usersData.users.find(u => u.email === SUPER_ADMIN_EMAIL);

        if (!authUser) {
            console.error("❌ Auth user not found! Did Phase 36 run correctly?");
            process.exit(1);
        }

        console.log(`✅ Found Auth User: ${authUser.id}`);

        // 2. Fetch Profile
        let { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (profileError) {
            console.log("⚠️ Profile fetch error or not found by exact ID:", profileError.message);
            // Safety fallback just in case UUID got severed, look by role as a last resort fallback sync
            const { data: roleProfile } = await supabaseAdmin.from('profiles').select('*').eq('system_role', 'GLOBAL_SUPER_ADMIN').single();
            if (roleProfile) {
                console.log(`⚠️ Recovering severed profile ID: ${roleProfile.id} -> ${authUser.id}`);
                await supabaseAdmin.from('profiles').delete().eq('id', roleProfile.id);

                const { error: insertError } = await supabaseAdmin.from('profiles').insert({
                    id: authUser.id,
                    first_name: 'Ronald',
                    last_name: 'Lewis Jr.',
                    system_role: 'GLOBAL_SUPER_ADMIN',
                    mfa_enabled: true
                });
                if (insertError) throw insertError;
            }

            // Re-fetch
            const refetch = await supabaseAdmin.from('profiles').select('*').eq('id', authUser.id).single();
            profile = refetch.data;
        }

        if (!profile) {
            console.error("❌ Profile entirely missing for the Auth ID.");
            process.exit(1);
        }

        console.log(`✅ Profile correctly bound to UUID ${profile.id} with Role [${profile.system_role}]`);

        // 3. Ensure Role is EXACTLY GLOBAL_SUPER_ADMIN
        if (profile.system_role !== 'GLOBAL_SUPER_ADMIN') {
            console.log(`⚠️ Fixing malformed role: ${profile.system_role} -> GLOBAL_SUPER_ADMIN`);
            const { error: roleUpdateError } = await supabaseAdmin.from('profiles').update({ system_role: 'GLOBAL_SUPER_ADMIN' }).eq('id', profile.id);
            if (roleUpdateError) throw roleUpdateError;
            console.log("✅ Role strictly enforced.");
        }

        // 4. Organization Binding
        if (!profile.organization_id) {
            console.log("⚠️ Organization ID is NULL. Provisioning strictly bound Root Organization...");
            // Create root org
            const { data: org, error: orgError } = await supabaseAdmin.from('organizations').insert({
                name: 'Wholesale Mavericks LLC (Root)',
                owner_id: profile.id,
                subscription_status: 'active', // Super admin skips billing, but structurally enforce active
                subscription_tier: 'enterprise'
            }).select().single();

            if (orgError) throw orgError;

            console.log(`✅ Root Organization Created: ${org.id}`);

            // Bind profile to org
            const { error: bindError } = await supabaseAdmin.from('profiles').update({ organization_id: org.id }).eq('id', profile.id);
            if (bindError) throw bindError;
            console.log("✅ Profile firmly bound to Root Organization.");
        } else {
            console.log(`✅ Profile already bound to Organization ID: ${profile.organization_id}`);

            // Just double check the org exists
            const { data: orgCheck } = await supabaseAdmin.from('organizations').select('id').eq('id', profile.organization_id).single();
            if (!orgCheck) {
                console.log("⚠️ Orphaned Organization ID detected! Repairing...");
                const { data: org, error: orgError } = await supabaseAdmin.from('organizations').insert({
                    name: 'Wholesale Mavericks LLC (Root)',
                    owner_id: profile.id,
                    subscription_status: 'active',
                    subscription_tier: 'enterprise'
                }).select().single();
                if (orgError) throw orgError;

                await supabaseAdmin.from('profiles').update({ organization_id: org.id }).eq('id', profile.id);
                console.log(`✅ Root Organization Reprovisioned and Bound: ${org.id}`);
            }
        }

        console.log("\n==============================");
        console.log("PHASE 36.1 SYNCHRONIZATION COMPLETE!");
        console.log("Identity and Organization Authority restored.");
        console.log("==============================");

    } catch (error) {
        console.error("❌ Synchronization Failed:", error);
    }
}

syncProfileAndOrg();
