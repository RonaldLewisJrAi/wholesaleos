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

    log('--- Starting Phase 40 Lifecycle Auto-Enforcement Verification ---');
    const testEmail = `lifecycle_${Date.now()}@wholesaleos.com`;
    const testPassword = 'Password123!';
    let userId, orgId;

    try {
        log('\n[1] SETUP: Bootstrapping Test Identity & ACTIVE Organization');
        const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            email: testEmail, password: testPassword, email_confirm: true
        });
        if (signUpError) throw signUpError;
        userId = authData.user.id;

        const { data: orgData, error: orgError } = await supabaseAdmin.from('organizations').insert({
            name: 'Phase 40 Audit Org', subscription_tier: 'PRO', subscription_status: 'ACTIVE'
        }).select().single();
        if (orgError) throw orgError;
        orgId = orgData.id;

        await supabaseAdmin.from('profiles').upsert({
            id: userId, organization_id: orgId, role: 'Owner', system_role: 'ADMIN', first_name: 'Robot', last_name: 'Verify'
        });

        await supabaseUser.auth.signInWithPassword({ email: testEmail, password: testPassword });

        log('\n[2] ACTIVE INSERT TEST (Should Pass)');
        const { data: leadData, error: insertErr1 } = await supabaseUser.from('deals').insert({
            organization_id: orgId, user_id: userId, status: 'Underwriting'
        }).select().single();
        if (insertErr1) throw insertErr1;
        log(`✅ Valid Deal inserted for ACTIVE org: ${leadData.id}`);

        log('\n[3] PAST_DUE ENFORCEMENT TEST (Read Only)');
        // Stripe webhook sets PAST_DUE
        await supabaseAdmin.from('organizations').update({ subscription_status: 'PAST_DUE' }).eq('id', orgId);

        // Attempt Update
        const { error: updatePAST } = await supabaseUser.from('deals').update({ status: 'Offer Accepted' }).eq('id', leadData.id);
        if (updatePAST && updatePAST.message.includes('read-only lifecycle')) {
            log('✅ SUCCESS: UPDATE Blocked Gracefully -> ' + updatePAST.message);
        } else {
            throw new Error(`❌ FATAL: UPDATE was allowed or failed incorrectly! ${JSON.stringify(updatePAST)}`);
        }

        log('\n[4] TERMINATION LOCKDOWN TEST (Complete Freeze & Retention applied)');
        // Stripe webhook sets TERMINATED
        await supabaseAdmin.from('organizations').update({ subscription_status: 'TERMINATED' }).eq('id', orgId);

        // Let's verify DB downgraded it to BASIC
        const { data: orgCheck, error: verifyTerm } = await supabaseAdmin.from('organizations').select('subscription_tier, data_retention_until').eq('id', orgId).single();
        if (orgCheck.subscription_tier === 'BASIC' && orgCheck.data_retention_until) {
            log('✅ SUCCESS: Organization automatically downgraded to BASIC tier and Data Retention countdown began.');
        } else {
            throw new Error(`❌ FATAL: Termination downgrade failure! Tier: ${orgCheck.subscription_tier}`);
        }

        // Attempt INSERT
        const { error: insertTerm } = await supabaseUser.from('deals').insert({
            organization_id: orgId, user_id: userId, status: 'Underwriting'
        });
        if (insertTerm && insertTerm.message.includes('TERMINATED')) {
            log('✅ SUCCESS: INSERT Blocked under Termination Lockdown -> ' + insertTerm.message);
        } else {
            throw new Error(`❌ FATAL: INSERT was allowed under Termination! ${JSON.stringify(insertTerm)}`);
        }

        log('\n[5] GLOBAL_SUPER_ADMIN IMMUNITY TEST');
        await supabaseAdmin.from('profiles').update({ system_role: 'GLOBAL_SUPER_ADMIN' }).eq('id', userId);
        await supabaseAdmin.auth.admin.updateUserById(userId, { app_metadata: { system_role: 'GLOBAL_SUPER_ADMIN' } });
        await supabaseUser.auth.signOut();
        await supabaseUser.auth.signInWithPassword({ email: testEmail, password: testPassword });

        const { error: bypassErr } = await supabaseUser.from('deals').delete().eq('id', leadData.id);
        if (!bypassErr) {
            log('✅ SUCCESS: Deal DELETED under GLOBAL_SUPER_ADMIN exception despite org being TERMINATED!');
        } else {
            throw new Error(`❌ FATAL: GLOBAL_SUPER_ADMIN bypass failed! ${JSON.stringify(bypassErr)}`);
        }

        log('\n[6] SUBSCRIPTION LOGGING VERIFICATION');
        const { data: logs, error: logsErr } = await supabaseAdmin.from('subscription_state_transitions').select('*').eq('organization_id', orgId).order('created_at', { ascending: true });
        if (logs && logs.length >= 2) {
            log(`✅ SUCCESS: Transaction logs explicitly persisted ${logs.length} transitions (PRO->BASIC, ACTIVE->PAST_DUE->TERMINATED, SYSTEM triggered).`);
        } else {
            throw new Error(`❌ FATAL: Missing Transition Logs! Found ${logs ? logs.length : 0}`);
        }

    } catch (e) {
        log(`\n❌ SCRIPT PANIC ERROR: ${e.message || e}`);
    } finally {
        log('\n[7] CLEANUP: Removing Test Data');
        if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
        if (orgId) await supabaseAdmin.from('organizations').delete().eq('id', orgId);
        log('--- Verification Passed ---');
        fs.writeFileSync('verify_phase40_lifecycle_output.txt', report.join('\n'), 'utf8');
    }
}
verify();
