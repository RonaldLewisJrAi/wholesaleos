const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.VITE_STRIPE_SECRET_KEY || 'sk_test_mock_fallback');

const router = express.Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;
if (supabaseUrl && supabaseKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
}

// Helper: Securely authenticate user via JWT and ensure they are an ADMIN for their organization
const verifyOrgAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

    const token = authHeader.replace('Bearer ', '');
    // In a real production setup, we verify the JWT. For Phase 31.5, we'll extract the uid
    // and query the DB to mock the JWT verification natively.

    // Simulating token decryption to get user_id (In production use supabaseAdmin.auth.getUser(token))
    // We expect the client to send user_id and org_id in the body for this demonstration.
    const { user_id, org_id } = req.body;

    if (!user_id || !org_id) {
        return res.status(400).json({ error: 'user_id and org_id required in request body for validation.' });
    }

    try {
        const { data: orgData, error } = await supabaseAdmin
            .from('user_organizations')
            .select('role')
            .eq('user_id', user_id)
            .eq('organization_id', org_id)
            .single();

        if (error || !orgData || orgData.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden. Must be Organization ADMIN to modify subscription.' });
        }

        req.org_id = org_id;
        req.user_id = user_id;
        next();
    } catch (err) {
        res.status(500).json({ error: 'Internal server error during validation.' });
    }
};

// POST /api/subscription/action (Generic Handler for Pause, Resume, Cancel, Terminate)
router.post('/action', verifyOrgAdmin, async (req, res) => {
    try {
        const { action, stripe_subscription_id, password } = req.body;
        const org_id = req.org_id;

        if (!action) return res.status(400).json({ error: 'Action parameter required.' });

        // In reality, we'd verify the password here against Supabase Auth.
        if (!password && action !== 'resume') {
            return res.status(401).json({ error: 'Password re-entry verification required for destructive actions.' });
        }

        // 1. Log the initiation attempt (Immutable Audit Trail)
        await supabaseAdmin.from('system_logs').insert({
            organization_id: org_id,
            user_id: req.user_id,
            action: `subscription_${action}_attempt`,
            metadata: { stripe_subscription_id, ip: req.ip }
        });

        // Normally we'd call Stripe here:
        // if (action === 'pause') await stripe.subscriptions.update(stripe_subscription_id, { pause_collection: { behavior: 'void' } });
        // if (action === 'cancel') await stripe.subscriptions.update(stripe_subscription_id, { cancel_at_period_end: true });
        // if (action === 'terminate') await stripe.subscriptions.cancel(stripe_subscription_id);

        console.log(`[Subscription API] Executing Stripe ${action.toUpperCase()} for Org: ${org_id}`);

        // 2. Set 'pending_subscription_change' lock on the Org
        // We do NOT mutate 'subscription_status' here. Stripe Webhook does that.
        const { error: updateError } = await supabaseAdmin
            .from('organizations')
            .update({ pending_subscription_change: true })
            .eq('id', org_id);

        if (updateError) throw updateError;

        // Mocking Stripe Webhook firing for the demo since we don't have live Stripe IDs seeded locally
        // In production, we just return 200 and let Webhook do the work asynchronously.
        setTimeout(async () => {
            const simulatedEventMap = {
                'pause': 'PAUSED',
                'resume': 'ACTIVE',
                'cancel': 'CANCELED',
                'terminate': 'TERMINATED'
            };

            const newStatus = simulatedEventMap[action.toLowerCase()];
            if (newStatus) {
                const updatePayload = {
                    subscription_status: newStatus,
                    pending_subscription_change: false
                };

                if (newStatus === 'PAUSED') updatePayload.pause_requested_at = new Date();
                if (newStatus === 'CANCELED') updatePayload.canceled_at = new Date();
                if (newStatus === 'TERMINATED') {
                    updatePayload.terminated_at = new Date();
                    const retentionDate = new Date();
                    retentionDate.setDate(retentionDate.getDate() + 90);
                    updatePayload.data_retention_until = retentionDate;
                }

                await supabaseAdmin.from('organizations').update(updatePayload).eq('id', org_id);
                console.log(`[Mock Webhook] Org ${org_id} mutated to ${newStatus}`);
            }
        }, 1000);

        return res.status(200).json({
            success: true,
            message: `Stripe ${action.toUpperCase()} initiated. Awaiting webhook confirmation.`
        });

    } catch (err) {
        console.error('[Subscription API Error]:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
