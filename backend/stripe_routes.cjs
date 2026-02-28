require('dotenv').config();
const express = require('express');

const STRIPE_SECRET = process.env.VITE_STRIPE_SECRET_KEY || 'sk_test_mock_fallback';
const stripe = require('stripe')(STRIPE_SECRET);
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Middleware to parse raw bodies for Stripe Webhook signature verification
const rawBodyParser = express.raw({ type: 'application/json' });

// =========================================================================
// 1. CREATE CHECKOUT SESSION (Protected API)
// =========================================================================
router.post('/create-checkout-session', express.json(), async (req, res) => {
    try {
        const { priceId, userEmail, userId, tier, tosAccepted } = req.body;

        if (!priceId || !userEmail || !userId || !tier) {
            return res.status(400).json({ error: 'Missing required parameters. Subscription tier must be explicitly selected.' });
        }

        if (String(tosAccepted) !== 'true') {
            return res.status(400).json({ error: 'Terms of Service must be explicitly accepted to proceed.' });
        }

        // Create the Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: userEmail,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            // Map the Supabase User ID to the Stripe Session metadata for webhook retrieval
            metadata: {
                supabase_user_id: userId,
                subscription_tier: tier,
                tos_accepted: tosAccepted ? 'true' : 'false'
            },
            success_url: `${process.env.VITE_SITE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${process.env.VITE_SITE_URL}/profile?canceled=true`,
        });

        res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error('[Stripe API Error] Create Checkout:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// =========================================================================
// 2. STRIPE WEBHOOK LISTENER (The Source of Truth)
// =========================================================================
// Warning: Webhooks require the RAW body, not the parsed JSON body.
router.post('/webhook', rawBodyParser, async (req, res) => {
    const defaultSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const signature = req.headers['stripe-signature'];

    let event;

    try {
        // Cryptographically verify the event originated from Stripe
        event = stripe.webhooks.constructEvent(req.body, signature, defaultSecret);
    } catch (err) {
        console.error(`[Webhook Signature Error]: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Phase 30: Initialize Supabase Admin Client using service_role key to bypass RLS
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
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

    // Phase 30: IDEMPOTENCY CHECK
    const { data: existingEvent, error: checkError } = await supabaseAdmin
        .from('processed_stripe_events')
        .select('id')
        .eq('stripe_event_id', event.id)
        .maybeSingle();

    if (checkError) console.error('[Webhook Idempotency Query Error]', checkError.message);

    if (existingEvent) {
        console.log(`[Webhook Idempotency] Event ${event.id} already processed. Skipping.`);
        return res.status(200).json({ received: true, ignored: true, reason: 'duplicate' });
    }

    console.log(`[Webhook Processing] Received event: ${event.type} | ID: ${event.id}`);

    try {
        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const supabaseUserId = session.metadata?.supabase_user_id;
                const subscriptionTier = session.metadata?.subscription_tier || 'SUPER';
                const tosAccepted = session.metadata?.tos_accepted === 'true';

                if (supabaseUserId) {
                    console.log(`[Webhook] Equipping User: ${supabaseUserId} with ${subscriptionTier} tier. TOS: ${tosAccepted}`);
                    const { error: updateError } = await supabaseAdmin
                        .from('profiles')
                        .update({
                            subscription_tier: subscriptionTier,
                            account_status: 'Active',
                            tos_accepted: tosAccepted
                        })
                        .eq('id', supabaseUserId);

                    if (updateError) throw updateError;
                } else {
                    console.log('[Webhook Warning] checkout.session.completed fired without supabase_user_id in metadata.');
                }
                break;
            }

            case 'invoice.paid': {
                console.log(`[Webhook] Invoice Paid for Customer ID: ${event.data.object.customer}. Quotas should reset.`);
                // Phase 31.5: Enforce ACTIVE status on payment
                await supabaseAdmin.from('organizations').update({
                    subscription_status: 'ACTIVE',
                    pending_subscription_change: false
                }).eq('stripe_customer_id', event.data.object.customer);
                break;
            }

            case 'invoice.payment_failed': {
                console.log(`[Webhook] Payment Failed for Customer ID: ${event.data.object.customer}.`);
                // Phase 31.5: Downgrade to GRACE_PERIOD immediately upon invoice failure
                await supabaseAdmin.from('organizations').update({
                    subscription_status: 'GRACE_PERIOD'
                }).eq('stripe_customer_id', event.data.object.customer);
                break;
            }

            case 'customer.subscription.updated': {
                const sub = event.data.object;
                let newStatus = null;

                // Native Stripe status mapping
                if (sub.status === 'past_due') newStatus = 'PAST_DUE';
                if (sub.status === 'canceled') newStatus = 'CANCELED';
                if (sub.status === 'unpaid') newStatus = 'TERMINATED';
                if (sub.status === 'active') newStatus = 'ACTIVE';

                const updatePayload = { pending_subscription_change: false };
                if (newStatus) updatePayload.subscription_status = newStatus;

                // Overtake active status if collection is paused globally
                if (sub.pause_collection) {
                    updatePayload.subscription_status = 'PAUSED';
                }

                console.log(`[Webhook] Subscription Updated for Customer ID: ${sub.customer}. Mapping to ${updatePayload.subscription_status || 'Unchanged'}.`);
                await supabaseAdmin.from('organizations').update(updatePayload).eq('stripe_customer_id', sub.customer);

                break;
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                const customerId = sub.customer;

                if (sub.cancel_at_period_end) {
                    console.log(`[Webhook] Subscription CANCELED (End of Term). Customer: ${customerId}`);
                    await supabaseAdmin.from('organizations').update({
                        subscription_status: 'CANCELED',
                        pending_subscription_change: false
                    }).eq('stripe_customer_id', customerId);
                } else {
                    console.log(`[Webhook] Subscription TERMINATED Immediately. Customer: ${customerId}`);
                    const retentionDate = new Date();
                    retentionDate.setDate(retentionDate.getDate() + 90);

                    await supabaseAdmin.from('organizations').update({
                        subscription_status: 'TERMINATED',
                        pending_subscription_change: false,
                        data_retention_until: retentionDate
                    }).eq('stripe_customer_id', customerId);

                    // In Production: Trigger seat_status = 'LOCKED' RPC mapping here
                }
                break;
            }

            default:
                console.log(`[Webhook] Unhandled event type: ${event.type}`);
        }

        // Phase 30: Record Success in Idempotency Ledger
        const { error: insertError } = await supabaseAdmin.from('processed_stripe_events').insert({
            stripe_event_id: event.id,
            type: event.type,
            metadata: event.data.object
        });

        if (insertError) throw insertError;

        console.log(`[Webhook] Successfully processed and logged event: ${event.id}`);

    } catch (err) {
        console.error("[Webhook Database Error]:", err.message);

        // Phase 34: Robust DLQ Error Logging
        if (supabaseAdmin && event) {
            await supabaseAdmin.from('stripe_event_failures').insert({
                stripe_event_id: event.id || 'unknown',
                error_message: err.message || 'Unknown error occurred',
                metadata: event.data?.object || {}
            });
            console.log(`[DLQ Pipeline] System isolated the crash trace for ${event.id || 'unknown event'} into stripe_event_failures.`);
        }

        return res.status(500).json({ error: "Failed to process webhook state." });
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
});

module.exports = router;
