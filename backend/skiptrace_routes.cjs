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

        skipTraceLogger.info("Skip trace requested. No cache found. Executing engine.", { userId, propertyId, ownerName });

        // --- EXECUTE OSINT ENGINE ---
        const results = await runSkipTrace({ ownerName, address, city, state, zip });

        if (!results.phones || (results.phones.length === 0 && results.emails.length === 0)) {
            return res.status(200).json({
                success: false,
                message: results.message || "No contacts found",
                phones: [],
                emails: []
            });
        }

        const phoneNumber = results.phones.map(p => p.number).join(', ');
        const emailAddress = results.emails.map(e => e.email).join(', ');
        const confidence = results.confidenceAverage || 0;
        const source = results.provider || 'unknown';

        // Save Results to the Database
        const { data, error } = await supabaseAdmin
            .from('owner_contacts')
            .insert({
                property_id: propertyId,
                owner_name: ownerName || 'Unknown Owner',
                phone_number: phoneNumber,
                email: emailAddress,
                confidence_score: confidence,
                source: source
            })
            .select()
            .single();

        if (error) {
            skipTraceLogger.error("Supabase trace db insert error", { error, propertyId });
            return res.status(500).json({ success: false, error: 'Failed to save trace results' });
        }

        // Log the Event
        await supabaseAdmin.from('platform_events').insert({
            user_id: userId,
            event_type: 'OWNER_SKIP_TRACED',
            metadata: {
                property_id: propertyId,
                provider_used: source,
                contacts_found: results.phones.length + results.emails.length,
                confidence_average: confidence
            }
        });

        return res.status(200).json({
            success: true,
            contact: data,
            phones: results.phones,
            emails: results.emails,
            provider: source,
            confidenceAverage: confidence
        });

    } catch (err) {
        skipTraceLogger.error("Internal API route exception", { error: err.message, stack: err.stack });
        return res.status(500).json({ success: false, error: 'Internal skip trace error.' });
    }
});

module.exports = router;
