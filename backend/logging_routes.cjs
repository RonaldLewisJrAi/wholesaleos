const express = require('express');
const { radarLogger, aiLogger, logger } = require('./logging/logger.cjs');

const router = express.Router();

// Allowed backend logging channels
const CHANNELS = {
    'radar': radarLogger,
    'ai': aiLogger,
    'app': logger
};

/**
 * Proxy endpoint to allow Frontend services (like Deal Radar Agent React context) 
 * to pipe structured telemetry into the native Node.js Winston Winston rotating file transports.
 */
router.post('/relay', (req, res) => {
    try {
        const { channel = 'app', level = 'info', message, metadata = {} } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required for telemetry relay.' });
        }

        const targetLogger = CHANNELS[channel] || logger;

        // Ensure level is valid Winston method
        if (typeof targetLogger[level] === 'function') {
            targetLogger[level](message, metadata);
        } else {
            targetLogger.info(message, metadata);
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Failed to process telemetry relay payload:", err);
        res.status(500).json({ error: 'Telemetry parsing failure' });
    }
});

module.exports = router;
