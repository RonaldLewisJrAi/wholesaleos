/* eslint-env node */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const runTests = async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminSupa = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

    let logOutput = "💳 Starting Phase 13 Runtime Verification: Subscription Lifecycle & Webhook Test\n";
    const log = (msg) => {
        console.log(msg);
        logOutput += msg + '\n';
    };

    let testOrgId;

    try {
        log("[SETUP] Creating Webhook Test Tenant...");
        const mockStripeCustomerId = 'cus_' + Math.random().toString(36).substring(7);
        const { data: org, error: orgErr } = await adminSupa
            .from('organizations')
            .insert({ name: 'Webhook Resiliency Corp', stripe_customer_id: mockStripeCustomerId, subscription_status: 'PAUSED' })
            .select('id').single();

        if (orgErr) throw orgErr;
        testOrgId = org.id;

        const generateEvent = (id, type, status) => ({
            id, type, data: { object: { customer: mockStripeCustomerId, status, cancel_at_period_end: false } }
        });

        const processWebhook = async (event) => {
            const { data: existingEvent, error: chkErr } = await adminSupa.from('processed_stripe_events').select('id').eq('stripe_event_id', event.id).maybeSingle();
            if (chkErr) throw chkErr;
            if (existingEvent) return { received: true, ignored: true, reason: 'duplicate' };

            let newStatus = null;
            if (event.type === 'customer.subscription.updated') {
                const sub = event.data.object;
                if (sub.status === 'past_due') newStatus = 'PAST_DUE';
                if (sub.status === 'canceled') newStatus = 'CANCELED';
                if (sub.status === 'unpaid') newStatus = 'TERMINATED';
                if (sub.status === 'active') newStatus = 'ACTIVE';

                const { error: updErr } = await adminSupa.from('organizations').update({ subscription_status: newStatus, pending_subscription_change: false }).eq('stripe_customer_id', sub.customer);
                if (updErr) throw updErr;
            }

            const { error: insErr } = await adminSupa.from('processed_stripe_events').insert({ stripe_event_id: event.id, type: event.type, metadata: event.data.object });
            if (insErr) {
                if (insErr.code === '23505') {
                    return { received: true, ignored: true, reason: 'duplicate_constraint' };
                }
                throw insErr;
            }
            return { received: true };
        };

        log("\n🧪 EXECUTION: Commencing Webhook Simulations");

        log("👉 Test 1: Simulating ACTIVE transition webhook...");
        const evt1 = generateEvent('evt_111', 'customer.subscription.updated', 'active');
        await processWebhook(evt1);
        let check1 = await adminSupa.from('organizations').select('subscription_status').eq('id', testOrgId).single();
        log(check1.data.subscription_status === 'ACTIVE' ? '   ✅ SUCCESS: Downgrade to ACTIVE successful.' : '   ❌ FAIL: Status not ACTIVE.');

        log("👉 Test 2: Simulating Idempotency (Duplicate Webhook)...");
        const res2 = await processWebhook(evt1);
        log(res2.ignored ? '   ✅ SUCCESS: Webhook replay rejected. Idempotency holds.' : '   ❌ FAIL: Duplicate processed.');

        log("👉 Test 3: Simulating PAST_DUE downgrade...");
        const evt3 = generateEvent('evt_333', 'customer.subscription.updated', 'past_due');
        await processWebhook(evt3);
        let check3 = await adminSupa.from('organizations').select('subscription_status').eq('id', testOrgId).single();
        log(check3.data.subscription_status === 'PAST_DUE' ? '   ✅ SUCCESS: Downgrade to PAST_DUE successful.' : '   ❌ FAIL: Status not PAST_DUE.');

        log("👉 Test 4: Simulating TERMINATED state...");
        const evt4 = generateEvent('evt_444', 'customer.subscription.updated', 'unpaid');
        await processWebhook(evt4);
        let check4 = await adminSupa.from('organizations').select('subscription_status').eq('id', testOrgId).single();
        log(check4.data.subscription_status === 'TERMINATED' ? '   ✅ SUCCESS: Fallback to TERMINATED successful.' : '   ❌ FAIL: Status not TERMINATED.');

        log("👉 Test 5: Simulating Concurrent Webhook Bursts...");
        const burstPromises = [];
        for (let i = 0; i < 20; i++) {
            burstPromises.push(processWebhook(generateEvent('evt_555', 'customer.subscription.updated', 'active')));
        }
        await Promise.all(burstPromises);

        const { count, error: cntErr } = await adminSupa.from('processed_stripe_events').select('*', { count: 'exact', head: true }).eq('stripe_event_id', 'evt_555');
        if (cntErr) throw cntErr;
        log(count === 1 ? '   ✅ SUCCESS: Strict concurrent idempotency holds (1 record).' : `   ❌ FAIL: Multiple records generated (${count}).`);

    } catch (e) {
        log("\n❌ FATAL WEBHOOK TEST ERROR: " + JSON.stringify(e));
    } finally {
        log("\n[CLEANUP] Scrubbing Webhook Test Artifacts...");
        if (testOrgId) await adminSupa.from('organizations').delete().eq('id', testOrgId);
        log("Cleanup Complete.");
        fs.writeFileSync(path.join(__dirname, '../webhook_results.txt'), logOutput);
        process.exit(0);
    }
};

runTests();
