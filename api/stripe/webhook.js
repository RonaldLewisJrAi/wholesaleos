/* eslint-env node */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Required for Vercel to allow us to read the raw body for Stripe signature validation
export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper to accumulate the raw request body stream
async function getRawBody(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;
    const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

    if (!STRIPE_SECRET || !WEBHOOK_SECRET) {
        console.error('[Webhook Error] Missing Stripe keys.');
        return res.status(500).json({ error: 'Stripe configuration missing.' });
    }

    const stripe = new Stripe(STRIPE_SECRET);
    const signature = req.headers['stripe-signature'];

    let rawBody;
    let event;

    try {
        rawBody = await getRawBody(req);
        event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
    } catch (err) {
        console.error(`[Webhook Signature Error]: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Phase 30: Initialize Supabase Admin Client using service_role key to bypass RLS
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[Webhook Error] Missing Supabase Service Role Key.');
        return res.status(500).json({ error: 'Database configuration missing.' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // Phase 32: IDEMPOTENCY CHECK
    const { data: existingEvent, error: checkError } = await supabaseAdmin
        .from('processed_stripe_events')
        .select('event_id')
        .eq('event_id', event.id)
        .maybeSingle();

    if (checkError) console.error('[Webhook Idempotency Query Error]', checkError.message);

    if (existingEvent) {
        console.log(`[Webhook Idempotency] Event ${event.id} already processed. Skipping.`);
        return res.status(200).json({ received: true, ignored: true, reason: 'duplicate' });
    }

    console.log(`[Webhook Processing] Received event: ${event.type} | ID: ${event.id}`);

    try {
        // Handle the specific Stripe Subscription Events
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const supabaseUserId = session.metadata?.supabase_user_id;

                if (supabaseUserId) {
                    // Phase 30: Multi-tenant upgrade applies to the Organization, not just the Profile
                    const { data: userOrg } = await supabaseAdmin
                        .from('user_organizations')
                        .select('organization_id')
                        .eq('user_id', supabaseUserId)
                        .maybeSingle();

                    if (userOrg && userOrg.organization_id) {
                        console.log(`[Webhook] Upgrading Organization ${userOrg.organization_id} to SUPER tier.`);

                        // Expand team seats and enable all personas
                        const { error: orgUpdateError } = await supabaseAdmin
                            .from('organizations')
                            .update({
                                subscription_tier: 'SUPER',
                                account_status: 'active',
                                team_seat_limit: 10,
                                enabled_personas: ['WHOLESALER', 'REALTOR', 'INVESTOR', 'VIRTUAL_ASSISTANT']
                            })
                            .eq('id', userOrg.organization_id);

                        if (orgUpdateError) throw orgUpdateError;

                        // Ensure the user who paid gets all personas unlocked in their profile
                        await supabaseAdmin.from('profiles').update({
                            allowed_personas: ['WHOLESALER', 'REALTOR', 'INVESTOR', 'VIRTUAL_ASSISTANT']
                        }).eq('id', supabaseUserId);
                    }
                } else {
                    console.log('[Webhook Warning] checkout.session.completed fired without supabase_user_id in metadata.');
                }
                break;
            }

            case 'customer.subscription.deleted': {
                // Phase 30: Downgrade logic restricting seat limits and personas
                const customerId = event.data.object.customer;
                const { data: subData } = await supabaseAdmin
                    .from('subscriptions')
                    .select('organization_id')
                    .eq('stripe_customer_id', customerId)
                    .maybeSingle();

                if (subData && subData.organization_id) {
                    console.log(`[Webhook] Downgrading Organization: ${subData.organization_id} to BASIC tier.`);
                    await supabaseAdmin
                        .from('organizations')
                        .update({
                            subscription_tier: 'BASIC',
                            team_seat_limit: 1,
                            enabled_personas: ['WHOLESALER'],
                            subscription_status: 'CANCELED',
                            pending_subscription_change: false
                        })
                        .eq('id', subData.organization_id);

                    // Phase 32: Log to system_logs
                    await supabaseAdmin.from('system_logs').insert({
                        organization_id: subData.organization_id,
                        log_type: 'INFO',
                        source: 'WEBHOOK',
                        message: `Subscription Deleted via webhook. Organization downgraded to BASIC tier.`
                    });
                } else {
                    console.log(`[Webhook] Subscription Cancelled for Customer ID: ${customerId}, but could not find mapped organization.`);
                }
                break;
            }

            case 'invoice.payment_failed': {
                console.log(`[Webhook] Payment Failed for Customer ID: ${event.data.object.customer}.`);
                break;
            }

            case 'invoice.paid': {
                console.log(`[Webhook] Invoice Paid for Customer ID: ${event.data.object.customer}. Quotas should reset.`);
                break;
            }

            default:
                console.log(`[Webhook] Unhandled event type: ${event.type}`);
        }

        // Phase 32: Record Success in Idempotency Ledger
        const { error: insertError } = await supabaseAdmin.from('processed_stripe_events').insert({
            event_id: event.id
        });

        if (insertError) throw insertError;

        console.log(`[Webhook] Successfully processed and logged event: ${event.id}`);

    } catch (err) {
        console.error("[Webhook Processing Error]:", err.message);

        // Phase 32: Insert into Dead-Letter Queue
        await supabaseAdmin.from('stripe_event_failures').insert({
            event_id: event.id,
            payload: event.data.object,
            error_msg: err.message,
            retry_count: 0
        }).catch(e => console.error("Failed to write to dead letter queue:", e.message));

        return res.status(500).json({ error: "Failed to process webhook state. Logged to DLQ." });
    }

    res.json({ received: true });
}
