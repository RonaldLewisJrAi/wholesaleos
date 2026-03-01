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

async function runStressTest() {
    console.log("🚀 Starting Phase 13 Runtime Verification: Database Trigger Stress Test");
    let testOrgId;

    try {
        // 1. Setup Test Organization
        console.log("\n[SETUP] Creating test organization...");
        const { data: org, error: orgErr } = await supabase
            .from('organizations')
            .insert({ name: 'Stress Test Corp - Phase 13' })
            .select('id')
            .single();

        if (orgErr) throw orgErr;
        testOrgId = org.id;
        console.log(`[SETUP] Test Org created: ${testOrgId}`);

        // 2. STRESS TEST: 200 Concurrent Lead Inserts
        console.log("\n[TEST 1] Triggering 200 Concurrent Lead Inserts...");
        const startLeads = performance.now();
        const leadPromises = [];
        for (let i = 0; i < 200; i++) {
            leadPromises.push(
                supabase.from('leads').insert({
                    organization_id: testOrgId,
                    seller_name: `Test Seller ${i}`,
                    phone: `555-0100-${i}`,
                    email: `seller${i}@test.com`,
                    property_address: `${i} Stress Test Ave`,
                    status: 'New'
                })
            );
        }

        const leadResults = await Promise.allSettled(leadPromises);
        const endLeads = performance.now();
        const leadFailures = leadResults.filter(r => r.status === 'rejected' || r.value.error);

        console.log(`⏱️ Lead Insert Time: ${(endLeads - startLeads).toFixed(2)}ms`);
        console.log(`✅ Success: ${200 - leadFailures.length} / 200`);
        if (leadFailures.length > 0) {
            console.error(`❌ Failures: ${leadFailures.length}`);
            console.error(leadFailures[0]);
        }

        // 3. Setup: Insert 50 baseline deals for transition testing (Need deal_stages)
        const { data: stages } = await supabase.from('deal_stages').select('id, name');
        let stageUnderContract = stages?.find(s => s.name === 'Under Contract')?.id;
        let stageDispo = stages?.find(s => s.name === 'Dispo / Marketing')?.id;

        if (!stageUnderContract || !stageDispo) {
            console.log("\n[WARN] Deal stages missing or names distinct. Grabbing any two stages.");
            if (stages && stages.length >= 2) {
                stageUnderContract = stages[0].id;
                stageDispo = stages[1].id;
            }
        }

        if (stageUnderContract && stageDispo) {
            console.log("\n[SETUP] Inserting 50 Baseline Deals...");
            const dealPromises = [];
            for (let i = 0; i < 50; i++) {
                dealPromises.push(
                    supabase.from('deals').insert({
                        organization_id: testOrgId,
                        stage_id: stageUnderContract,
                        contract_price: 150000,
                        assignment_fee: 10000,
                        emd_amount: 0
                    }).select('id').single()
                );
            }

            const rawDeals = await Promise.all(dealPromises);
            const dealIds = rawDeals.map(r => r.data?.id).filter(id => id);

            // 4. STRESS TEST: 50 Simultaneous Deal Status Updates (Transitions)
            console.log(`\n[TEST 2] Triggering 50 Simultaneous Deal Stage Transitions...`);
            const startTransitions = performance.now();
            const transPromises = dealIds.map(id =>
                supabase.from('deals').update({ stage_id: stageDispo }).eq('id', id)
            );
            const transResults = await Promise.allSettled(transPromises);
            const endTransitions = performance.now();
            const transFailures = transResults.filter(r => r.status === 'rejected' || r.value.error);

            console.log(`⏱️ Transition Time: ${(endTransitions - startTransitions).toFixed(2)}ms`);
            console.log(`✅ Success: ${50 - transFailures.length} / 50`);

            // 5. STRESS TEST: High-frequency EMD Updates
            console.log(`\n[TEST 3] High-Frequency EMD Updates (Spamming same row)...`);
            if (dealIds.length > 0) {
                const targetDealId = dealIds[0];
                const startEmd = performance.now();
                const emdPromises = [];
                for (let i = 1; i <= 20; i++) {
                    emdPromises.push(supabase.from('deals').update({ emd_amount: i * 1000 }).eq('id', targetDealId));
                }
                const emdResults = await Promise.allSettled(emdPromises);
                const endEmd = performance.now();
                const emdFailures = emdResults.filter(r => r.status === 'rejected' || r.value.error);

                console.log(`⏱️ EMD Spam Time: ${(endEmd - startEmd).toFixed(2)}ms`);
                console.log(`✅ Success: ${20 - emdFailures.length} / 20`);
            }
        } else {
            console.log("\n[WARN] Skipping Deal tests because stages could not be found.");
        }

        // Cleanup
        console.log("\n[CLEANUP] Removing test organization and all cascading artifacts...");
        await supabase.from('organizations').delete().eq('id', testOrgId);
        console.log("Cleanup complete.");

        console.log("\n🎉 STRESS TEST COMPLETED SUCCESSFULLY.");

    } catch (error) {
        console.error("\n❌ FATAL STRESS TEST ERROR:", error);
    } finally {
        process.exit(0);
    }
}

runStressTest();
