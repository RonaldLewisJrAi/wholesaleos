const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const Redis = require('ioredis');

const router = express.Router();

// Initialize Redis for Quota Tracking
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
});

// Initialize Supabase Admin auth
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

router.post('/track', async (req, res) => {
    try {
        const { userId, isDemoMode } = req.body;

        if (isDemoMode) {
            return res.status(403).json({ allowed: false, error: 'Document generation is strictly disabled in Demo Mode.' });
        }

        if (!userId) {
            return res.status(400).json({ allowed: false, error: 'User ID required.' });
        }

        if (!supabaseAdmin) {
            console.warn('[Doc API] Supabase Admin not configured. Bypassing limits for local dev.');
            return res.status(200).json({ allowed: true });
        }

        // 0. Fetch Organization ID from User ID securely
        const { data: userOrg, error: userOrgError } = await supabaseAdmin
            .from('user_organizations')
            .select('organization_id')
            .eq('user_id', userId)
            .single();

        if (userOrgError || !userOrg) {
            return res.status(404).json({ allowed: false, error: 'User not attached to an active organization.' });
        }

        const organizationId = userOrg.organization_id;

        // 1. Fetch Organization Subscription Tier
        const { data: org, error } = await supabaseAdmin
            .from('organizations')
            .select('subscription_tier, subscription_status')
            .eq('id', organizationId)
            .single();

        if (error || !org) {
            return res.status(404).json({ allowed: false, error: 'Organization not found.' });
        }

        if (org.subscription_status !== 'ACTIVE') {
            return res.status(402).json({ allowed: false, error: `Subscription is ${org.subscription_status}. Please renew your plan.` });
        }

        // 2. Define Limits based on Tier
        let monthlyLimit = 0;
        switch (org.subscription_tier) {
            case 'BASIC':
                monthlyLimit = 5;
                break;
            case 'ADVANCED':
                monthlyLimit = 20;
                break;
            case 'SUPER':
            case 'ELITE':
                monthlyLimit = 999999; // Unlimited
                break;
            default:
                monthlyLimit = 0; // Free / Unpaid
        }

        if (monthlyLimit === 0) {
            return res.status(402).json({ allowed: false, error: 'Upgrade required to generate official documents.' });
        }

        // 3. Track Usage in Redis (Reset monthly)
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const usageKey = `document_usage:${organizationId}:${currentMonth}`;

        const currentUsage = await redis.incr(usageKey);

        // Set TTL to 32 days if this is the first increment this month
        if (currentUsage === 1) {
            await redis.expire(usageKey, 60 * 60 * 24 * 32);
        }

        if (currentUsage > monthlyLimit) {
            // Revert the increment since the generation is blocked
            await redis.decr(usageKey);
            return res.status(429).json({
                allowed: false,
                error: `Monthly document limit reached (${monthlyLimit}/${monthlyLimit}). Upgrade for more capacity.`
            });
        }

        // 4. Allowed
        return res.status(200).json({
            allowed: true,
            usage: currentUsage,
            limit: monthlyLimit
        });

    } catch (error) {
        console.error('[Document Generator] Quota Tracker Error:', error);
        return res.status(500).json({ allowed: false, error: 'Internal server error verifying quotas.' });
    }
});

module.exports = router;
