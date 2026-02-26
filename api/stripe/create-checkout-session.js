/* eslint-env node */
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

    if (!STRIPE_SECRET) {
        return res.status(500).json({ error: 'Stripe Secret Key is missing from the environment.' });
    }

    const stripe = new Stripe(STRIPE_SECRET);

    try {
        const { priceId, userEmail, userId } = req.body;

        if (!priceId || !userEmail || !userId) {
            return res.status(400).json({ error: 'Missing required parameters: priceId, userEmail, userId' });
        }

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
            success_url: `${siteUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${siteUrl}/profile?canceled=true`,
        });

        return res.status(200).json({ id: session.id, url: session.url });
    } catch (error) {
        console.error('[Stripe API Error] Create Checkout:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
