const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { skipTraceLogger } = require('./logging/logger.cjs');
const { runSkipTrace } = require('./services/skipTraceEngine.cjs');

const router = express.Router();

const supabaseAdmin = process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// Simple in-memory rate limiting: Max 10 requests per user per hour
const requestCounts = new Map();

function checkRateLimit(userId) {
    const now = Date.now();
    const userRequests = requestCounts.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < 3600000); // 1 hour

    if (recentRequests.length >= 10) return false;

    recentRequests.push(now);
    requestCounts.set(userId, recentRequests);
    return true;
}

router.post('/', async (req, res) => {
    try {
        const { userId, propertyId, ownerName, address, city, state, zip } = req.body;

        if (!userId || !propertyId) {
            return res.status(400).json({ success: false, error: 'User ID and Property ID required.' });
        }

        if (!checkRateLimit(userId)) {
            skipTraceLogger.warn('Rate limit exceeded for user', { userId });
            return res.status(429).json({ success: false, error: 'Rate limit exceeded. Max 10 skip traces per hour.' });
        }

        if (!supabaseAdmin) {
            skipTraceLogger.error('Missing Supabase Admin context.', { userId, propertyId });
            return res.status(500).json({ success: false, error: 'Missing Supabase Admin context.' });
        }

        // --- PHASE 51: TRACE CACHING (30-DAY GUARD) ---
        // Check if a skip trace has been successfully run on this property in the last 30 days.
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: existingTrace } = await supabaseAdmin
            .from('owner_contacts')
            .select('created_at, phone_number, email, confidence_score, source')
            .eq('property_id', propertyId)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingTrace) {
            skipTraceLogger.info("Skip trace cache hit. Rejecting redundant scrape.", { propertyId });

            // Format phones/emails back into arrays so the frontend parser works smoothly
            const cachedPhones = (existingTrace.phone_number || '').split(',').map(p => ({ number: p.trim(), confidence: existingTrace.confidence_score }));
            const cachedEmails = (existingTrace.email || '').split(',').map(e => ({ email: e.trim(), confidence: existingTrace.confidence_score }));

            return res.status(200).json({
                success: true,
                message: "Retrieved from recent cache.",
                contact: existingTrace,
                phones: cachedPhones.filter(p => p.number),
                emails: cachedEmails.filter(e => e.email),
                provider: existingTrace.source,
                confidenceAverage: existingTrace.confidence_score
            });
        }

        skipTraceLogger.info("Skip trace requested. No cache found. Offloading to background worker.", { userId, propertyId, ownerName });

        // --- PHASE 52: UPGRADE TO ASYNC BULLMQ WORKER ---
        // Vercel serverless has a 10s-60s limit. Multi-source scraping takes longer. Offload to persistent Node worker.
        try {
            const { Queue } = require('bullmq');
            const Redis = require('ioredis');
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

            const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
            const skipTraceQueue = new Queue('skipTraceQueue', { connection });

            // Ensure property reflects 'processing' in UI immediately
            await supabaseAdmin.from('properties').update({ skiptrace_status: 'processing' }).eq('id', propertyId);

            // Dispatch to the persistent Node worker
            await skipTraceQueue.add('execute-skiptrace', {
                userId,
                propertyId,
                ownerName,
                address,
                city,
                state,
                zip
            });

            // Close connection to prevent hanging Vercel serverless functions
            await connection.quit();

            return res.status(202).json({
                success: true,
                message: "Skip trace sent to background processor. Status updated to 'processing'.",
                backgroundProcessing: true
            });

        } catch (err) {
            skipTraceLogger.error("Failed to enqueue skip trace job", { err: err.message });
            return res.status(500).json({ success: false, error: 'Failed to enqueue background skip trace.' });
        }

    } catch (err) {
        skipTraceLogger.error("Internal API route exception", { error: err.message, stack: err.stack });
        return res.status(500).json({ success: false, error: 'Internal skip trace error.' });
    }
});

module.exports = router;
