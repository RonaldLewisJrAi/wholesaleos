/* eslint-env node */
/* global process */
import Stripe from 'stripe';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

        if (!STRIPE_SECRET) {
            return res.status(500).json({ error: 'Stripe Secret Key missing.' });
        }

        const stripe = new Stripe(STRIPE_SECRET);

        const { plan, userEmail, userId } = req.body;

        if (!plan || !userEmail || !userId) {
            return res.status(400).json({ error: 'Missing required parameters: plan, userEmail, userId' });
        }

        // 🔒 SERVER-SIDE LOCKED LIVE PRICE IDS
        const PRICE_MAP = {
            BASIC: 'price_1T4jBDK2qPJKpuPcwhetQdJy',
            PRO: 'price_1T4jL6K2qPJKpuPcOeMWLk04',
            SUPER: 'price_1T4jOFK2qPJKpuPcVKh0BG4W',
        };

        const selectedPrice = PRICE_MAP[plan];

        if (!selectedPrice) {
            return res.status(400).json({ error: 'Invalid plan selected.' });
        }

        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers.host;
        const siteUrl = `${protocol}://${host}`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: userEmail,
            line_items: [
                {
                    price: selectedPrice,
                    quantity: 1,
                },
            ],
            metadata: {
                supabase_user_id: userId,
                selected_plan: plan
            },
            success_url: `${siteUrl}/profile?success=true`,
            cancel_url: `${siteUrl}/pricing?canceled=true`,
        });

        return res.status(200).json({ url: session.url });

    } catch (err) {
        console.error('Stripe checkout error:', err);
        return res.status(500).json({ error: err.message });
    }
}
