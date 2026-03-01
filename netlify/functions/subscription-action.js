import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export default async (req) => {
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY);
    const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    const token = authHeader.replace('Bearer ', '');

    try {
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) throw new Error('Invalid User Token');

        const { organization_id, action, password } = await req.json();
        if (!organization_id || !action) return new Response(JSON.stringify({ error: 'Missing organization_id or action' }), { status: 400 });

        const { data: profile } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .eq('organization_id', organization_id)
            .single();

        if (profile?.role !== 'ADMIN' && profile?.role !== 'GLOBAL_SUPER_ADMIN') {
            return new Response(JSON.stringify({ error: 'Only Administrators can manage subscriptions.' }), { status: 403 });
        }

        const { data: org } = await supabaseAdmin
            .from('organizations')
            .select('stripe_customer_id, stripe_subscription_id, subscription_status')
            .eq('id', organization_id)
            .single();

        if (!org || !org.stripe_subscription_id) return new Response(JSON.stringify({ error: 'No active Stripe subscription found.' }), { status: 400 });

        const subId = org.stripe_subscription_id;
        let finalStatus = org.subscription_status;
        let updatePayload = { pending_subscription_change: true };

        switch (action) {
            case 'PAUSE':
                await stripe.subscriptions.update(subId, { pause_collection: { behavior: 'void' } });
                finalStatus = 'PAUSED';
                updatePayload = { ...updatePayload, subscription_status: 'PAUSED', pause_requested_at: new Date().toISOString() };
                break;
            case 'RESUME':
                await stripe.subscriptions.update(subId, { pause_collection: '' });
                finalStatus = 'ACTIVE';
                updatePayload = { ...updatePayload, subscription_status: 'ACTIVE', pause_requested_at: null };
                break;
            case 'CANCEL':
                await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
                updatePayload = { ...updatePayload, canceled_at: new Date().toISOString() };
                break;
            case 'TERMINATE': {
                if (!password) return new Response(JSON.stringify({ error: 'Password required' }), { status: 400 });
                await stripe.subscriptions.cancel(subId);
                finalStatus = 'TERMINATED';
                const retentionDate = new Date();
                retentionDate.setDate(retentionDate.getDate() + 90);
                updatePayload = { ...updatePayload, subscription_status: 'TERMINATED', terminated_at: new Date().toISOString(), data_retention_until: retentionDate.toISOString() };

                await supabaseAdmin.from('users').update({ seat_status: 'LOCKED' }).eq('organization_id', organization_id).neq('id', user.id);
                break;
            }
            default:
                return new Response(JSON.stringify({ error: 'Invalid action provided.' }), { status: 400 });
        }

        await supabaseAdmin.from('organizations').update(updatePayload).eq('id', organization_id);

        await supabaseAdmin.from('audit_logs').insert({
            organization_id, user_id: user.id, action_type: `SUBSCRIPTION_${action}`, metadata: { previous_status: org.subscription_status, new_status: finalStatus }
        });

        await supabaseAdmin.from('system_logs').insert({
            organization_id, log_type: 'SECURITY', source: 'API', message: `User ${user.id} initiated ${action} on Subscription. Status set to ${finalStatus}.`
        });

        return new Response(JSON.stringify({ message: `Successfully executed ${action}.`, status: finalStatus }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

export const config = {
    path: "/api/subscription/action"
};
