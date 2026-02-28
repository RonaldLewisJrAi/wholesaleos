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
        const { priceId, userEmail, userId, tier } = req.body;

        if (!priceId || !userEmail || !userId) {
            return res.status(400).json({ error: 'Missing required parameters.' });
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
                subscription_tier: tier || 'SUPER'
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

                if (supabaseUserId) {
                    console.log(`[Webhook] Equipping User: ${supabaseUserId} with ${subscriptionTier} tier.`);
                    const { error: updateError } = await supabaseAdmin
                        .from('profiles')
                        .update({
                            subscription_tier: subscriptionTier,
                            account_status: 'Active'
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
                break;
            }

            case 'invoice.payment_failed': {
                console.log(`[Webhook] Payment Failed for Customer ID: ${event.data.object.customer}.`);
                break;
            }

            case 'customer.subscription.deleted': {
                console.log(`[Webhook] Subscription Cancelled for Customer ID: ${event.data.object.customer}.`);
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
        return res.status(500).json({ error: "Failed to process webhook state." });
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
});

module.exports = router;
