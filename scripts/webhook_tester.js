/* eslint-env node */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const runTests = async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminSupa = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

    console.log("🚀 Starting Phase 13 Runtime Verification: Outbound Webhook Resilience");

    try {
        console.log("[SETUP] Provisioning Test Organization for Webhooks...");
        // 1. Create a SUPER tier org to bypass the Webhook tier gate
        const { data: org, error: orgErr } = await adminSupa.from('organizations').insert({
            name: 'Webhook Resilience Corp',
            subscription_tier: 'SUPER',
            account_status: 'active'
        }).select().single();
        if (orgErr) throw orgErr;

        // 2. Mock a test target URL (e.g. localhost, or a stub API) that will definitely timeout/fail to test DLQ persistence
        const { data: integration, error: intErr } = await adminSupa.from('integrations').insert({
            organization_id: org.id,
            type: 'WEBHOOK',
            status: 'ACTIVE',
            config: {
                target_url: 'https://httpstat.us/404', // Forces a failure response
                secret_key: 'test_secret_for_signing'
            }
        }).select().single();
        if (intErr) throw intErr;

        // 3. Trigger the Edge Function
        console.log("👉 Dispatching Edge Function payload to fail-target...");
        const payloadParams = {
            org_id: org.id,
            event_type: 'lead.created',
            payload: { lead_id: 1234, name: "Stress Test Lead" }
        };

        const response = await fetch(`${supabaseUrl}/functions/v1/dispatch-webhook`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadParams)
        });

        const resultJson = await response.json();
        console.log(`📡 Function Response [${response.status}]: `, JSON.stringify(resultJson));

        if (response.status === 200 && resultJson.results?.[0]?.status === 'FAILED') {
            console.log("✅ SUCCESS: Edge Function correctly trapped the target failure and didn't crash.");

            // 4. Verify the DLQ / integration_logs table
            console.log("👉 Checking integration_logs for persistent failure traces...");
            const { data: logs, error: logErr } = await adminSupa.from('integration_logs')
                .select('*')
                .eq('integration_id', integration.id);

            if (logErr) throw logErr;

            if (logs.length > 0 && logs[0].status === 'FAILED') {
                console.log(`✅ SUCCESS: Engine safely logged the failure! Reason: ${logs[0].error_message}`);
            } else {
                console.log("❌ FAILURE: Engine failed to write the failure log trace.");
            }
        } else {
            console.log("❌ FAILURE: Edge function misbehaved or crashed abruptly.", resultJson);
        }

        // Cleanup
        await adminSupa.from('organizations').delete().eq('id', org.id);

    } catch (e) {
        console.error("\n❌ FATAL WEBHOOK TEST ERROR: " + String(e));
    } finally {
        process.exit(0);
    }
};

runTests();
