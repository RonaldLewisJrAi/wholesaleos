/* eslint-env node */
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

/**
 * WHOLESALE OS - PHASE 31.5 SUBSCRIPTION API
 * 
 * Handles Self-Service Admin Actions: Pause, Resume, Cancel, Terminate
 * Interacts directly with Stripe API, then immediately mirrors the state in Supabase.
 * Enforces strictly that the requester is an ADMIN of the Organization.
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.replace('Bearer ', '');

    try {
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) throw new Error('Invalid User Token');

        const { organization_id, action, password } = req.body;
        if (!organization_id || !action) return res.status(400).json({ error: 'Missing organization_id or action' });

        // 1. Validate User is Admin of Org
        const { data: profile } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .eq('organization_id', organization_id)
            .single();

        if (profile?.role !== 'ADMIN' && profile?.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Only Administrators can manage subscriptions.' });
        }

        // 2. Fetch Org & Stripe ID
        const { data: org } = await supabaseAdmin
            .from('organizations')
            .select('stripe_customer_id, stripe_subscription_id, subscription_status')
            .eq('id', organization_id)
            .single();

        if (!org || !org.stripe_subscription_id) {
            return res.status(400).json({ error: 'No active Stripe subscription found for this organization.' });
        }

        const subId = org.stripe_subscription_id;
        let finalStatus = org.subscription_status;
        let updatePayload = { pending_subscription_change: true };

        // 3. Execute Action securely via Stripe
        switch (action) {
            case 'PAUSE':
                // Note: Stripe Pause Collection allows holding invoices
                await stripe.subscriptions.update(subId, {
                    pause_collection: { behavior: 'void' },
                });
                finalStatus = 'PAUSED';
                updatePayload = { ...updatePayload, subscription_status: 'PAUSED', pause_requested_at: new Date().toISOString() };
                break;

            case 'RESUME':
                await stripe.subscriptions.update(subId, {
                    pause_collection: '', // Removes the pause
                });
                finalStatus = 'ACTIVE';
                updatePayload = { ...updatePayload, subscription_status: 'ACTIVE', pause_requested_at: null };
                break;

            case 'CANCEL':
                // Cancels at the end of the billing period.
                await stripe.subscriptions.update(subId, {
                    cancel_at_period_end: true,
                });
                // Status remains formally ACTIVE (or whatever it is) until the period boundary hits.
                updatePayload = { ...updatePayload, canceled_at: new Date().toISOString() };
                break;

            case 'TERMINATE': {
                // Immediate termination. Irreversible.
                // Requires password re-auth in real production environment, skipping direct hash check here for boilerplate
                if (!password) return res.status(400).json({ error: 'Password required for immediate termination' });

                await stripe.subscriptions.cancel(subId);

                finalStatus = 'TERMINATED';
                const retentionDate = new Date();
                retentionDate.setDate(retentionDate.getDate() + 90); // 90 days

                updatePayload = {
                    ...updatePayload,
                    subscription_status: 'TERMINATED',
                    terminated_at: new Date().toISOString(),
                    data_retention_until: retentionDate.toISOString()
                };

                // Fire async Seat Locker
                await handleSeatLocking(organization_id, user.id);
                break;
            }

            default:
                return res.status(400).json({ error: 'Invalid action provided.' });
        }

        // 4. Update Database
        await supabaseAdmin
            .from('organizations')
            .update(updatePayload)
            .eq('id', organization_id);

        // 5. Log Action
        await supabaseAdmin.from('audit_logs').insert({
            organization_id,
            user_id: user.id,
            action_type: `SUBSCRIPTION_${action}`,
            metadata: { previous_status: org.subscription_status, new_status: finalStatus }
        });

        // Phase 32: Log to system_logs for Observability
        await supabaseAdmin.from('system_logs').insert({
            organization_id,
            log_type: 'SECURITY',
            source: 'API',
            message: `User ${user.id} initiated ${action} on Subscription. Status set to ${finalStatus}.`
        });

        return res.status(200).json({ message: `Successfully executed ${action}.`, status: finalStatus });

    } catch (error) {
        console.error('[Subscription API Error]', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}

// Phase 31.5: Seat Locking Logic
// Locks all users EXCEPT the acting Admin to preserve data access
async function handleSeatLocking(orgId, adminUserId) {
    try {
        await supabaseAdmin
            .from('users')
            .update({ seat_status: 'LOCKED' })
            .eq('organization_id', orgId)
            .neq('id', adminUserId); // Preserve the Admin

        console.log(`[SeatLocker] Locked non-admin seats for Org ${orgId}`);
    } catch (e) {
        console.error('[SeatLocker Error]', e);
    }
}
