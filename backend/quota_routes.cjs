const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const Redis = require('ioredis');

const router = express.Router();

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
});

const supabaseAdmin = process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

router.post('/track', async (req, res) => {
    try {
        const { userId, type, isDemoMode } = req.body;

        if (isDemoMode) {
            return res.status(200).json({ allowed: true });
        }

        if (!userId || !type) {
            return res.status(400).json({ allowed: false, error: 'User ID and quota type required.' });
        }

        if (!supabaseAdmin) {
            console.warn('[Quota API] Missing Supabase Admin Key. Bypassing limits.');
            return res.status(200).json({ allowed: true });
        }

        // Fetch Tier
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('subscription_tier')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            return res.status(404).json({ allowed: false, error: 'User profile not found.' });
        }

        const tier = profile.subscription_tier || 'BASIC';
        let limit = 0;

        if (type === 'lead') {
            if (tier === 'BASIC') limit = 25;
            else limit = 999999;
        } else if (type === 'scrape') {
            if (tier === 'BASIC') limit = 5;
            else if (tier === 'ADVANCED' || tier === 'PRO') limit = 25;
            else limit = 999999;
        }

        const currentMonth = new Date().toISOString().slice(0, 7);
        const usageKey = `usage:${type}:${userId}:${currentMonth}`;

        const currentUsage = await redis.incr(usageKey);

        if (currentUsage === 1) {
            await redis.expire(usageKey, 60 * 60 * 24 * 32);
        }

        if (currentUsage > limit) {
            await redis.decr(usageKey);
            return res.status(429).json({
                allowed: false,
                error: `Monthly ${type} limit reached (${limit}/${limit}). Upgrade your plan to increase limits.`
            });
        }

        return res.status(200).json({ allowed: true, usage: currentUsage, limit });

    } catch (err) {
        console.error('[Quota API Error]:', err);
        return res.status(500).json({ allowed: false, error: 'Internal quota tracking error.' });
    }
});

module.exports = router;
