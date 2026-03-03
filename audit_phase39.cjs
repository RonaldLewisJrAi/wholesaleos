require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

console.log("Environment check:", { url: process.env.VITE_SUPABASE_URL, keyLen: process.env.SUPABASE_SERVICE_ROLE_KEY?.length });

// Must use Service Role key to bypass RLS initially for setup,
// but the actual tests require an authenticated user session to trigger RLS.
const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseUser = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function runAudit() {
    const report = [];

    function log(msg) {
        console.log(msg);
        report.push({ type: 'info', message: msg });
    }

    function err(msg, data) {
        console.error(msg, data);
        report.push({ type: 'error', message: msg, data: data?.message || data?.code || data });
    }

    log("🚀 Starting Phase 39 Subscription Lifecycle Enforcement Audit\n");

    const testEmail = `audit_${Date.now()}@wholesaleos.com`;
    const testPassword = 'TestPassword123!';
    let userId;
    let orgId;

    try {
        // --- SETUP PHASE ---
        log("=== 0. SETUP: Bootstrapping DEMO Identity ===");
        const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true,
            user_metadata: { first_name: 'Audit', last_name: 'Robot', company: 'Audit Corp' }
        });
        if (signUpError) throw signUpError;
        userId = authData.user.id;
        log(`✅ Created test user: ${userId}`);

        // Create Organization
        const { data: orgData, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert({
                name: 'Audit Corp',
                subscription_tier: 'BASIC',
                subscription_status: 'DEMO',
                team_seat_limit: 1
            })
            .select()
            .single();
        if (orgError) throw orgError;
        orgId = orgData.id;
        log(`✅ Created DEMO organization: ${orgId}`);

        // Link Profile (simulate DB Trigger just in case)
        await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                organization_id: orgId,
                role: 'Owner',
                system_role: 'ADMIN',
                first_name: 'Audit',
                last_name: 'Robot'
            });

        // Authenticate the user client so RLS applies to it
        const { error: signInError } = await supabaseUser.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });
        if (signInError) throw signInError;
        console.log("✅ Authenticated User Client (RLS Active)\n");


        // --- TEST 1: DEMO HARD CAP TEST ---
        console.log("=== 1. DEMO HARD CAP TEST ===");

        // 1A. Leads
        console.log("Inserting 25 allowed leads...");
        const leadsToInsert = Array(25).fill(0).map((_, i) => ({
            organization_id: orgId,
            property_address: `Test Lead ${i}`,
            seller_name: `Test Seller ${i}`,
            marketing_source: 'Auditor'
        }));

        const { error: leadInsertError } = await supabaseUser.from('leads').insert(leadsToInsert);
        if (leadInsertError) err("❌ Failed to insert initial 25 leads:", leadInsertError);
        else log("✅ Successfully inserted 25 leads.");

        log("Attempting 26th lead (Should 403)...");
        const { error: lead26Error } = await supabaseUser.from('leads').insert({
            organization_id: orgId,
            property_address: `Test Lead 26`,
            seller_name: `Test Seller 26`,
            marketing_source: 'Auditor'
        });

        if (lead26Error && lead26Error.code === '42501') {
            console.log("✅ 26th lead blocked by RLS (42501 expected).");
        } else {
            console.error("❌ 26th lead was NOT blocked correctly! Error:", lead26Error);
        }

        // 1B. Deals
        console.log("\nInserting 5 allowed active deals...");
        const dealsToInsert = Array(5).fill(0).map((_, i) => ({
            organization_id: orgId,
            user_id: userId,
            status: 'Underwriting'
        }));

        const { error: dealInsertError } = await supabaseUser.from('deals').insert(dealsToInsert);
        if (dealInsertError) err("❌ Failed to insert initial 5 deals:", dealInsertError);
        else log("✅ Successfully inserted 5 deals.");

        log("Attempting 6th active deal (Should 403)...");
        const { error: deal6Error } = await supabaseUser.from('deals').insert({
            organization_id: orgId,
            user_id: userId,
            status: 'Underwriting'
        });

        if (deal6Error && deal6Error.code === '42501') {
            log("✅ 6th deal blocked by RLS (42501 expected).");
        } else {
            err("❌ 6th deal was NOT blocked correctly! Error:", deal6Error);
        }

        // 1C. Closed Deal Bypass
        log("\nAttempting 6th deal but with 'Closed' status (Should Succeed)...");
        const { error: dealClosedError } = await supabaseUser.from('deals').insert({
            organization_id: orgId,
            user_id: userId,
            status: 'Closed' // RLS Policy says: AND d.status != 'Closed'
        });

        if (!dealClosedError) {
            console.log("✅ Closed deal successfully inserted (bypasses active deal limit).");
        } else {
            console.error("❌ Closed deal failed to insert. Error:", dealClosedError);
        }


        // --- TEST 2: UPGRADE FLOW TEST ---
        console.log("\n=== 2. UPGRADE FLOW TEST ===");
        console.log("Simulating Stripe Webhook: Upgrading tier to PRO...");

        await supabaseAdmin.from('organizations').update({
            subscription_tier: 'PRO',
            subscription_status: 'ACTIVE'
        }).eq('id', orgId);

        log("✅ Upgraded org to PRO natively.");

        log("Attempting 27th lead (Should Succeed because tier is PRO)...");
        const { error: lead27Error } = await supabaseUser.from('leads').insert({
            organization_id: orgId,
            property_address: `Test Lead 27`,
            seller_name: `Test Seller 27`,
            marketing_source: 'Auditor'
        });

        if (!lead27Error) {
            log("✅ 27th lead inserted successfully! PRO unlocks the limit.");
        } else {
            err("❌ 27th lead failed to insert despite PRO tier! Error:", lead27Error);
        }

        log("Attempting 7th active deal (Should Succeed because tier is PRO)...");
        const { error: deal7Error } = await supabaseUser.from('deals').insert({
            organization_id: orgId,
            user_id: userId,
            status: 'Underwriting'
        });

        if (!deal7Error) {
            log("✅ 7th deal inserted successfully! PRO unlocks the limit.");
        } else {
            err("❌ 7th deal failed to insert despite PRO tier! Error:", deal7Error);
        }


        // --- TEST 3: DOWNGRADE FLOW TEST ---
        log("\n=== 3. DOWNGRADE FLOW TEST ===");
        log("Simulating Stripe Webhook: Canceling PRO / Resetting to DEMO...");

        await supabaseAdmin.from('organizations').update({
            subscription_tier: 'BASIC',
            subscription_status: 'DEMO'
        }).eq('id', orgId);
        log("✅ Downgraded org to BASIC natively.");

        log("Attempting 28th lead (Should 403 because we are over the limit again)...");
        const { error: lead28Error } = await supabaseUser.from('leads').insert({
            organization_id: orgId,
            property_address: `Test Lead 28`,
            seller_name: `Test Seller 28`,
            marketing_source: 'Auditor'
        });

        if (lead28Error && lead28Error.code === '42501') {
            log("✅ 28th lead correctly blocked! Soft lock is active after downgrade.");
        } else {
            err("❌ 28th lead was NOT blocked correctly after downgrade! Error:", lead28Error);
        }

    } catch (e) {
        err("SCRIPT PANIC ERROR:", e);
    } finally {
        log("\n=== CLEANUP ===");
        if (userId) {
            await supabaseAdmin.auth.admin.deleteUser(userId);
            if (orgId) {
                await supabaseAdmin.from('organizations').delete().eq('id', orgId);
            }
            log("✅ Deleted test user and organization data.");
        }
        log("🏁 Audit Script Completed.");
        fs.writeFileSync('audit_report.json', JSON.stringify(report, null, 2), 'utf-8');
    }
}

runAudit();
