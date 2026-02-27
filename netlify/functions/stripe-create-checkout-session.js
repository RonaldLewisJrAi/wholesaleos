import Stripe from 'stripe';

export default async (req) => {
    if (req.method === 'OPTIONS') {
        const headers = new Headers();
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type');
        return new Response(null, { status: 200, headers });
    }

    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Content-Type', 'application/json');

    const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET) return new Response(JSON.stringify({ error: 'Stripe Secret Key is missing.' }), { status: 500, headers });

    const stripe = new Stripe(STRIPE_SECRET);

    try {
        const body = await req.json();
        const { priceId, userEmail, userId } = body;

        if (!priceId || !userEmail || !userId) {
            return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400, headers });
        }

        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host') || 'localhost:5173';
        const siteUrl = process.env.VITE_SITE_URL || `${protocol}://${host}`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: userEmail,
            line_items: [{ price: priceId, quantity: 1 }],
            metadata: { supabase_user_id: userId },
            success_url: `${siteUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${siteUrl}/profile?canceled=true`,
        });

        return new Response(JSON.stringify({ id: session.id, url: session.url }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}

export const config = {
    path: "/api/stripe/create-checkout-session"
};
