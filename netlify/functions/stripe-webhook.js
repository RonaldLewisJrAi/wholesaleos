import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export default async (req) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;
    const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

    if (!STRIPE_SECRET || !WEBHOOK_SECRET) {
        return new Response(JSON.stringify({ error: 'Stripe configuration missing.' }), { status: 500 });
    }

    const stripe = new Stripe(STRIPE_SECRET);
    const signature = req.headers.get('stripe-signature');

    let rawBody;
    let event;

    try {
        rawBody = await req.text();
        event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
    } catch (err) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: existingEvent, error: checkError } = await supabaseAdmin
        .from('processed_stripe_events')
        .select('event_id')
        .eq('event_id', event.id)
        .maybeSingle();

    if (existingEvent) return new Response(JSON.stringify({ received: true, ignored: true, reason: 'duplicate' }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const supabaseUserId = session.metadata?.supabase_user_id;

                if (supabaseUserId) {
                    const { data: userOrg } = await supabaseAdmin
                        .from('user_organizations')
                        .select('organization_id')
                        .eq('user_id', supabaseUserId)
                        .maybeSingle();

                    if (userOrg && userOrg.organization_id) {
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

                        await supabaseAdmin.from('profiles').update({
                            allowed_personas: ['WHOLESALER', 'REALTOR', 'INVESTOR', 'VIRTUAL_ASSISTANT']
                        }).eq('id', supabaseUserId);
                    }
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const customerId = event.data.object.customer;
                const { data: subData } = await supabaseAdmin
                    .from('subscriptions')
                    .select('organization_id')
                    .eq('stripe_customer_id', customerId)
                    .maybeSingle();

                if (subData && subData.organization_id) {
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

                    await supabaseAdmin.from('system_logs').insert({
                        organization_id: subData.organization_id,
                        log_type: 'INFO',
                        source: 'WEBHOOK',
                        message: `Subscription Deleted via webhook. Organization downgraded to BASIC tier.`
                    });
                }
                break;
            }
            case 'invoice.payment_failed':
            case 'invoice.paid':
                break;
        }

        const { error: insertError } = await supabaseAdmin.from('processed_stripe_events').insert({ event_id: event.id });
        if (insertError) throw insertError;

    } catch (err) {
        await supabaseAdmin.from('stripe_event_failures').insert({
            event_id: event.id,
            payload: event.data.object,
            error_msg: err.message,
            retry_count: 0
        }).catch(() => { });
        return new Response(JSON.stringify({ error: "Failed to process webhook state." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export const config = {
    path: "/api/stripe/webhook"
};
