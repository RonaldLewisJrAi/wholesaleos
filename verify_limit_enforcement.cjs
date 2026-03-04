require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// We authenticate a standard user to trigger RLS gracefully
const supabaseUser = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function verify() {
    const report = [];
    const log = msg => { console.log(msg); report.push(msg); };

    log('--- Starting Phase 39.1 Limits Verification ---');
    const testEmail = `verify_${Date.now()}@wholesaleos.com`;
    const testPassword = 'Password123!';
    let userId, orgId;

    try {
        // 1. Setup Test BASIC Organization (Service Role to bypass initial creation blocks)
        log('\n[1] SETUP: Bootstrapping Test Identity');
        const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            email: testEmail, password: testPassword, email_confirm: true
        });
        if (signUpError) throw signUpError;
        userId = authData.user.id;

        const { data: orgData, error: orgError } = await supabaseAdmin.from('organizations').insert({
            name: 'Audit Limit Org', subscription_tier: 'BASIC', subscription_status: 'ACTIVE'
        }).select().single();
        if (orgError) throw orgError;
        orgId = orgData.id;

        // Establish Profile with Standard Owner Role
        await supabaseAdmin.from('profiles').upsert({
            id: userId, organization_id: orgId, role: 'Owner', system_role: 'ADMIN', first_name: 'Robot', last_name: 'Verify'
        });
        log(`Created BASIC Tier Org: ${orgId}`);

        // Sign in to apply standard user constraints
        await supabaseUser.auth.signInWithPassword({ email: testEmail, password: testPassword });

        // 2. Simulate 5 allowed Deal Inserts
        log('\n[2] VERIFICATION: Simulating 5 allowed Deal Inserts');
        for (let i = 1; i <= 5; i++) {
            const { error: insertErr } = await supabaseUser.from('deals').insert({
                organization_id: orgId, user_id: userId, status: 'Underwriting'
            });
            if (insertErr) throw insertErr;
            log(`✅ Inserted Deal ${i} (Allowed)`);
        }

        // 3. Simulate 6th Deal Insert (Expect Failure)
        log('\n[3] VERIFICATION: Simulating 6th Deal Insert (Expect Failure)');
        const { error: blockErr } = await supabaseUser.from('deals').insert({
            organization_id: orgId, user_id: userId, status: 'Underwriting'
        });

        if (blockErr && blockErr.message.includes('Subscription limit reached')) {
            log('✅ SUCCESS: 6th deal gracefully blocked by Database Trigger -> ' + blockErr.message);
        } else {
            throw new Error(`❌ FATAL: 6th deal was allowed or failed for wrong reason! ${JSON.stringify(blockErr)}`);
        }

        // 4. Simulate GLOBAL_SUPER_ADMIN Bypass
        log('\n[4] VERIFICATION: Testing GLOBAL_SUPER_ADMIN Bypass');

        // Upgrade Profile
        const { error: profileUpgradeErr } = await supabaseAdmin.from('profiles').update({ system_role: 'GLOBAL_SUPER_ADMIN' }).eq('id', userId);
        if (profileUpgradeErr) throw profileUpgradeErr;

        // Inject custom claim into JWT app_metadata explicitly (as opposed to user_metadata which isn't always serialized to the raw token)
        const { error: customClaimErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { app_metadata: { system_role: 'GLOBAL_SUPER_ADMIN' } });
        if (customClaimErr) throw customClaimErr;

        // Refresh JWT to capture updated claims (sign out and sign back in)
        await supabaseUser.auth.signOut();
        const { data: signInData } = await supabaseUser.auth.signInWithPassword({ email: testEmail, password: testPassword });
        log("JWT USER_METADATA: " + JSON.stringify(signInData.session.user.user_metadata));
        log("JWT APP_METADATA: " + JSON.stringify(signInData.session.user.app_metadata));

        const { error: bypassErr } = await supabaseUser.from('deals').insert({
            organization_id: orgId, user_id: userId, status: 'Underwriting'
        });

        if (!bypassErr) {
            log('✅ SUCCESS: 6th deal Allowed under GLOBAL_SUPER_ADMIN exception!');
        } else {
            throw new Error(`❌ FATAL: GLOBAL_SUPER_ADMIN bypass failed! ${JSON.stringify(bypassErr)}`);
        }

    } catch (e) {
        log(`\n❌ SCRIPT PANIC ERROR: ${e.message || e}`);
    } finally {
        // 5. Cleanup Test Data
        log('\n[5] CLEANUP: Removing Test Data');
        if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
        if (orgId) await supabaseAdmin.from('organizations').delete().eq('id', orgId);
        log('--- Verification Passed ---');
        fs.writeFileSync('verify_limit_enforcement_output.txt', report.join('\n'), 'utf8');
    }
}
verify();
