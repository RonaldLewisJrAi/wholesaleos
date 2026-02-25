require('dotenv').config();
const express = require('express');

const STRIPE_SECRET = process.env.VITE_STRIPE_SECRET_KEY || 'sk_test_mock_fallback';
const stripe = require('stripe')(STRIPE_SECRET);
const cors = require('cors');

const router = express.Router();

// Middleware to parse raw bodies for Stripe Webhook signature verification
const rawBodyParser = express.raw({ type: 'application/json' });

// =========================================================================
// 1. CREATE CHECKOUT SESSION (Protected API)
// =========================================================================
router.post('/create-checkout-session', express.json(), async (req, res) => {
    try {
        const { priceId, userEmail, userId } = req.body;

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
                supabase_user_id: userId
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

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const supabaseUserId = session.metadata.supabase_user_id;
            const customerId = session.customer;
            const subscriptionId = session.subscription;

            console.log(`[Webhook] Session Completed for User: ${supabaseUserId} | Sub: ${subscriptionId}`);
            // TODO: Use internal Supabase Admin Client to securely update `user_profiles.subscription_tier`
            break;
        }

        case 'invoice.paid': {
            const invoice = event.data.object;
            console.log(`[Webhook] Invoice Paid for Customer: ${invoice.customer}. Resetting Document Limits.`);
            // TODO: Reset `user_profiles.monthly_document_count` to 0
            // TODO: Update `user_profiles.billing_cycle_start_date` to NOW()
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object;
            console.log(`[Webhook] Payment Failed for Customer: ${invoice.customer}. Suspending Account.`);
            // TODO: Update `user_profiles.account_status` to 'Suspended'
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            console.log(`[Webhook] Subscription Cancelled: ${subscription.id}. Downgrading to Basic.`);
            // TODO: Update `user_profiles.subscription_tier` to 'BASIC'
            // TODO: Update `user_profiles.account_status` to 'Expired'
            break;
        }

        default:
            console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
});

module.exports = router;
