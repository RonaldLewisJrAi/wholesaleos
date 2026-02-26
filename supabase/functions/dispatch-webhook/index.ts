import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

/**
 * WHOLESALE OS - PHASE 31 WEBHOOK DISPATCHER (EDGE FUNCTION)
 * 
 * This function handles outbound payloads fired from database triggers or UI actions.
 * It looks up active `WEBHOOK` integrations for the specified organization, signs the payload,
 * attempts delivery, and logs the result heavily.
 * 
 * Expected Input: { "org_id": "uuid", "event_type": "deal.created", "payload": { ... } }
 */

serve(async (req) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { org_id, event_type, payload } = await req.json();

        if (!org_id || !event_type || !payload) {
            return new Response(JSON.stringify({ error: 'Missing required parameters: org_id, event_type, payload' }), { status: 400 });
        }

        // Initialize Supabase Admin Client
        // We use the service_role key to bypass RLS and read integration configs securely
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase configuration missing in Edge Function environment.');
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // 1. Validate Organization Tier Constraints
        // Webhooks are locked to PRO and SUPER tiers.
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('subscription_tier, account_status')
            .eq('id', org_id)
            .single();

        if (orgError || !orgData) {
            throw new Error(`Failed to validate organization: ${org_id}`);
        }

        if (orgData.account_status !== 'active') {
            return new Response(JSON.stringify({ error: 'Organization account is not active' }), { status: 403 });
        }

        if (orgData.subscription_tier === 'BASIC') {
            return new Response(JSON.stringify({ error: 'Webhooks are not permitted on the BASIC tier.' }), { status: 403 });
        }

        // 2. Lookup Active Webhook Integrations for the Organization
        const { data: integrations, error: intError } = await supabase
            .from('integrations')
            .select('id, config')
            .eq('organization_id', org_id)
            .eq('type', 'WEBHOOK')
            .eq('status', 'ACTIVE');

        if (intError) throw new Error('Failed to query integrations');

        if (!integrations || integrations.length === 0) {
            return new Response(JSON.stringify({ message: "No active webhooks found for org.", delivery_count: 0 }), { status: 200 });
        }

        console.log(`[Webhook Dispatch] Found ${integrations.length} active webhooks for Org: ${org_id}`);

        const deliveryResults = [];

        // 3. Dispatch to all active endpoints
        for (const integration of integrations) {
            const { target_url, secret_key } = integration.config;

            if (!target_url) continue;

            const timestamp = Math.floor(Date.now() / 1000);
            const payloadString = JSON.stringify(payload);

            // Construct Stripe-like Signature: t=timestamp,v1=HMAC
            let signatureHeader = `t=${timestamp}`;
            if (secret_key) {
                const signedPayload = `${timestamp}.${payloadString}`;
                const hmac = createHmac('sha256', secret_key);
                hmac.update(signedPayload);
                const hash = hmac.digest('hex');
                signatureHeader += `,v1=${hash}`;
            }

            let deliveryStatus = 'FAILED';
            let errorMessage = null;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sec timeout

                const response = await fetch(target_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'WholesaleOS-Signature': signatureHeader,
                        'WholesaleOS-Event': event_type
                    },
                    body: payloadString,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    deliveryStatus = 'SUCCESS';
                } else {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
            } catch (err) {
                errorMessage = err.message || 'Network error or timeout';
            }

            // 4. Log the dispatch attempt
            await supabase.from('integration_logs').insert({
                organization_id: org_id,
                integration_id: integration.id,
                event_type: event_type,
                payload_snapshot: payload,
                status: deliveryStatus,
                error_message: errorMessage
            });

            deliveryResults.push({
                target: target_url,
                status: deliveryStatus,
                error: errorMessage
            });
        }

        return new Response(JSON.stringify({
            message: "Dispatch cycle completed.",
            results: deliveryResults
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error(`[Webhook Dispatch Error]: ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});
