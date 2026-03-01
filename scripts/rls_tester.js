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
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || !anonKey) {
    console.error("Missing DB credentials");
    process.exit(1);
}

const adminSupa = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const anonSupa = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function runRLSTest() {
    console.log("🛡️ Starting Phase 13 Runtime Verification: RLS & Tenant Isolation Test\n");

    let testEntities = {
        users: [],
        orgs: [],
        deals: []
    };

    try {
        console.log("[SETUP] Creating Test Tenants...");
        const { data: orgA, error: errA } = await adminSupa.from('organizations').insert({ name: 'Tenant A' }).select().single();
        const { data: orgB, error: errB } = await adminSupa.from('organizations').insert({ name: 'Tenant B' }).select().single();
        if (errA || errB) throw (errA || errB);
        testEntities.orgs.push(orgA.id, orgB.id);

        console.log("[SETUP] Provisioning 3 Test Personas (Tenant A User, Tenant B User, Super Admin)...");
        const pw = 'RLSTestPassword123!';

        const { data: userA, error: euA } = await adminSupa.auth.admin.createUser({ email: 'tenantA_13@test.com', password: pw, email_confirm: true });
        const { data: userB, error: euB } = await adminSupa.auth.admin.createUser({ email: 'tenantB_13@test.com', password: pw, email_confirm: true });
        const { data: userS, error: euS } = await adminSupa.auth.admin.createUser({ email: 'super_13@test.com', password: pw, email_confirm: true });

        if (euA || euB || euS) throw (euA || euB || euS);
        testEntities.users.push(userA.user.id, userB.user.id, userS.user.id);

        console.log("[SETUP] Assigning Org Profiles and Rules...");
        // Assign to organizations and set roles
        await adminSupa.from('profiles').update({ organization_id: orgA.id, role: 'User' }).eq('id', userA.user.id);
        await adminSupa.from('profiles').update({ organization_id: orgB.id, role: 'User' }).eq('id', userB.user.id);

        // Super Admin gets NO organization, but role = SUPER_ADMIN
        await adminSupa.from('profiles').update({ role: 'SUPER_ADMIN' }).eq('id', userS.user.id);

        console.log("[SETUP] Creating Tenant Data (Deals)...");
        // We find a valid deal stage to use
        const { data: stages } = await adminSupa.from('deal_stages').select('id').limit(1);
        const stageId = stages.length ? stages[0].id : null;

        const { data: dealA } = await adminSupa.from('deals').insert({ organization_id: orgA.id, stage_id: stageId, contract_price: 100 }).select().single();
        const { data: dealB } = await adminSupa.from('deals').insert({ organization_id: orgB.id, stage_id: stageId, contract_price: 200 }).select().single();
        testEntities.deals.push(dealA.id, dealB.id);

        console.log("\n-------------------------------------------");
        console.log("🧪 EXECUTION: Commencing RLS Penetration Tests");
        console.log("-------------------------------------------\n");

        // TEST 1: User A Access
        console.log("👉 Test 1: Authenticating as Tenant A...");
        await anonSupa.auth.signInWithPassword({ email: 'tenantA_13@test.com', password: pw });
        const { data: fetchA } = await anonSupa.from('deals').select('*');
        const hasA = fetchA?.some(d => d.id === dealA.id);
        const hasBLeak = fetchA?.some(d => d.id === dealB.id);

        if (hasA && !hasBLeak) {
            console.log("   ✅ SUCCESS: Tenant A sees only Tenant A deals. Zero cross-tenant leakage.");
        } else {
            console.error(`   ❌ FAIL: Tenant A RLS broken. (Sees A: ${hasA}, Sees B: ${hasBLeak})`);
        }
        await anonSupa.auth.signOut();

        // TEST 2: User B Access
        console.log("👉 Test 2: Authenticating as Tenant B...");
        await anonSupa.auth.signInWithPassword({ email: 'tenantB_13@test.com', password: pw });
        const { data: fetchB } = await anonSupa.from('deals').select('*');
        const hasB = fetchB?.some(d => d.id === dealB.id);
        const hasALeak = fetchB?.some(d => d.id === dealA.id);

        if (hasB && !hasALeak) {
            console.log("   ✅ SUCCESS: Tenant B sees only Tenant B deals. Zero cross-tenant leakage.");
        } else {
            console.error(`   ❌ FAIL: Tenant B RLS broken. (Sees B: ${hasB}, Sees A: ${hasALeak})`);
        }
        await anonSupa.auth.signOut();

        // TEST 3: Cross-tenant swap attempt (Manual API manipulation simulation)
        console.log("👉 Test 3: Simulating Manual ID Swap via API...");
        await anonSupa.auth.signInWithPassword({ email: 'tenantB_13@test.com', password: pw });

        // Tenant B trying to update Tenant A's deal
        const { error: hackAttempt } = await anonSupa.from('deals').update({ contract_price: 999999 }).eq('id', dealA.id);
        const { data: checkDealA } = await adminSupa.from('deals').select('contract_price').eq('id', dealA.id).single();

        if (checkDealA.contract_price !== 999999) {
            console.log("   ✅ SUCCESS: Cross-tenant UPDATE rejected by RLS. Data immutable.");
        } else {
            console.error("   ❌ FAIL: Cross-tenant UPDATE succeeded. Critical Vulnerability.");
        }
        await anonSupa.auth.signOut();

        // TEST 4: Global Super Admin Bypass
        console.log("👉 Test 4: Authenticating as GLOBAL_SUPER_ADMIN...");
        await anonSupa.auth.signInWithPassword({ email: 'super_13@test.com', password: pw });
        const { data: fetchS } = await anonSupa.from('deals').select('*');
        const seesA = fetchS?.some(d => d.id === dealA.id);
        const seesB = fetchS?.some(d => d.id === dealB.id);

        if (seesA && seesB) {
            console.log("   ✅ SUCCESS: SUPER_ADMIN bypass verified. Complete visibility across orgs.");
        } else {
            console.error(`   ❌ FAIL: SUPER_ADMIN bypass failed. (Sees A: ${seesA}, Sees B: ${seesB})`);
        }
        await anonSupa.auth.signOut();

    } catch (e) {
        console.error("\n❌ FATAL RLS TEST ERROR:");
        console.error(e);
    } finally {
        console.log("\n[CLEANUP] Scrubbing Test Artifacts...");
        for (let uid of testEntities.users) {
            await adminSupa.auth.admin.deleteUser(uid);
        }
        for (let oid of testEntities.orgs) {
            await adminSupa.from('organizations').delete().eq('id', oid);
        }
        console.log("Cleanup Complete.");
        process.exit(0);
    }
}

runRLSTest();
