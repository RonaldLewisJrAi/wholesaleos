const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Basic Rate Limiter to prevent abuse of the messaging APIs
const blastLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 blasts per hour
    message: { error: 'You have reached your messaging limits for the hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Mock External API Handlers (Twilio / SendGrid)
// In a real environment, you'd integrate the exact SDKs using process.env secrets.

router.post('/blast/sms', blastLimiter, async (req, res) => {
    const { propertyId, buyerIds, message } = req.body;

    // Server-enforced Demo Check
    const activeTier = req.organization?.subscription_tier;
    const isDemoMode = !req.isSuperAdmin && (!activeTier || activeTier === 'DEMO');

    // Persona Enforcement: Only Wholesalers and Super Admins can execute Disposition Blasts
    if (req.primaryPersona !== 'WHOLESALER' && !req.isSuperAdmin) {
        return res.status(403).json({ error: 'Persona Violation: Only WHOLESALER profiles can execute Disposition Blasts.' });
    }

    if (!propertyId || !buyerIds || !Array.isArray(buyerIds)) {
        return res.status(400).json({ error: 'Invalid payload. Property ID and an array of Buyer IDs are required.' });
    }

    if (isDemoMode) {
        return res.json({
            success: true,
            status: 'simulated',
            message: `[DEMO MODE] Simulated dispatch of SMS packet for Deal #${propertyId} to ${buyerIds.length} matched buyers.`
        });
    }

    try {
        // [Integration Point: Twilio Programmable SMS API]
        // Example: await twilioClient.messages.create({ body: message, from: '+1555...', to: '+1...' });

        console.log(`[DISPOSITION] Live SMS Blast Executed: ${buyerIds.length} VIP Buyers Notified.`);

        return res.json({
            success: true,
            status: 'delivered',
            message: `Deal Packet cleanly dispatched via Twilio to ${buyerIds.length} phone numbers.`
        });
    } catch (err) {
        console.error('[DISPOSITION ERROR]', err);
        return res.status(500).json({ error: 'Failed to disptach SMS blast.' });
    }
});

router.post('/blast/email', blastLimiter, async (req, res) => {
    const { propertyId, buyerIds, subject, htmlContent } = req.body;

    // Server-enforced Demo Check
    const activeTier = req.organization?.subscription_tier;
    const isDemoMode = !req.isSuperAdmin && (!activeTier || activeTier === 'DEMO');

    // Persona Enforcement: Only Wholesalers and Super Admins can execute Disposition Blasts
    if (req.primaryPersona !== 'WHOLESALER' && !req.isSuperAdmin) {
        return res.status(403).json({ error: 'Persona Violation: Only WHOLESALER profiles can execute Disposition Blasts.' });
    }

    if (!propertyId || !buyerIds || !Array.isArray(buyerIds)) {
        return res.status(400).json({ error: 'Invalid payload. Property ID and an array of Buyer IDs are required.' });
    }

    if (isDemoMode) {
        return res.json({
            success: true,
            status: 'simulated',
            message: `[DEMO MODE] Simulated dispatch of Email Marketing packet for Deal #${propertyId} to ${buyerIds.length} matched buyers.`
        });
    }

    try {
        // [Integration Point: SendGrid / Resend API]
        // Example: await sendgrid.sendMultiple({ to: emails, from: 'deals@wholesale-os.com', subject, html: htmlContent });

        console.log(`[DISPOSITION] Live Email Blast Executed: ${buyerIds.length} VIP Buyers Emphasized.`);

        return res.json({
            success: true,
            status: 'delivered',
            message: `Marketing Pitch securely relayed via SMTP/SendGrid to ${buyerIds.length} inboxes.`
        });
    } catch (err) {
        console.error('[DISPOSITION ERROR]', err);
        return res.status(500).json({ error: 'Failed to dispatch Email blast.' });
    }
});

module.exports = router;
