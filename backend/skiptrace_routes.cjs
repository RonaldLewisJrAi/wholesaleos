const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { skipTraceLogger } = require('./logging/logger.cjs');

const router = express.Router();

const supabaseAdmin = process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

router.post('/', async (req, res) => {
    try {
        const { userId, propertyId, ownerName, address, city, state, zip } = req.body;

        if (!userId || !propertyId) {
            return res.status(400).json({ success: false, error: 'User ID and Property ID required.' });
        }

        if (!supabaseAdmin) {
            skipTraceLogger.error('Missing Supabase Admin context.', { userId, propertyId });
            return res.status(500).json({ success: false, error: 'Missing Supabase Admin context.' });
        }

        skipTraceLogger.info("Skip trace requested", { userId, propertyId, ownerName });

        // --- MOCK SKIP TRACE PROVIDER CALL ---
        // In reality we would call a 3rd party API (DirectSkip, TLO, BatchSkipTracing, etc.)
        const mockPhones = ['(214) 555-2143', '(214) 555-9981'];
        const mockEmail = `${ownerName?.toLowerCase().replace(/\s+/g, '') || 'owner'}@gmail.com`;
        const mockConfidence = Math.random() > 0.3 ? 'HIGH' : 'MEDIUM';

        skipTraceLogger.info("Skip trace mock response generated", { mockConfidence });

        // Save Results to the Database
        const { data, error } = await supabaseAdmin
            .from('owner_contacts')
            .insert({
                property_id: propertyId,
                owner_name: ownerName || 'Unknown Owner',
                phone_number: mockPhones.join(', '),
                email: mockEmail,
                confidence_score: mockConfidence,
                source: 'DealRadar_Internal_API'
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
            metadata: { property_id: propertyId, confidence: mockConfidence }
        });

        return res.status(200).json({
            success: true,
            contact: data
        });

    } catch (err) {
        skipTraceLogger.error("Internal API route exception", { error: err.message, stack: err.stack });
        return res.status(500).json({ success: false, error: 'Internal skip trace error.' });
    }
});

module.exports = router;
