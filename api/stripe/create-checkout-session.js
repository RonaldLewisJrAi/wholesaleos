/* eslint-env node */
/* global process */
import Stripe from 'stripe';

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    // Set CORS headers for actual request
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;

    console.log("[Create Checkout] Environment Verification:");
    console.log(" - STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY);
    console.log(" - VITE_STRIPE_PUBLISHABLE_KEY exists:", !!process.env.VITE_STRIPE_PUBLISHABLE_KEY);
    console.log(" - STRIPE_WEBHOOK_SECRET exists:", !!process.env.STRIPE_WEBHOOK_SECRET);

    if (!STRIPE_SECRET) {
        console.error("[Create Checkout] FATAL: Stripe Secret Key is missing from the environment.");
        return res.status(500).json({ error: 'Stripe Secret Key is missing from the environment.' });
    }

    const stripe = new Stripe(STRIPE_SECRET);

    try {
        const { priceId, userEmail, userId } = req.body;

        if (!priceId || !userEmail || !userId) {
            console.error('[Create Checkout] Missing required parameters:', { priceId, userEmail, userId });
            return res.status(400).json({ error: 'Missing required parameters: priceId, userEmail, userId' });
        }

        console.log(`[Create Checkout] Payload Received | User: ${userId} | Email: ${userEmail} | Price ID: ${priceId}`);

        // Use the origin from the request to build the return URLs dynamically
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host || 'localhost:5173';
        const siteUrl = process.env.VITE_SITE_URL || `${protocol}://${host}`;

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
            metadata: {
                supabase_user_id: userId
            },
            success_url: `${siteUrl}/profile?session_id={CHECKOUT_SESSION_ID}&success=true&onboarding=true`,
            cancel_url: `${siteUrl}/profile?canceled=true`,
        });

        console.log(`[Create Checkout] SUCCESS: Stripe session created perfectly. Session ID: ${session.id}`);

        return res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('[Stripe API Error] Create Checkout:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
