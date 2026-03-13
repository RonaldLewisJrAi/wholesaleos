const { radarLogger, aiLogger, logger } = require('../../backend/logging/logger.cjs');

export default async (req) => {
    // Only accept POST
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
    }

    try {
        const payload = await req.json();
        const { channel = 'app', level = 'info', message, metadata = {} } = payload;

        if (!message) {
            return new Response(JSON.stringify({ error: 'Message is required for telemetry relay.' }), { status: 400 });
        }

        const CHANNELS = {
            'radar': radarLogger,
            'ai': aiLogger,
            'app': logger
        };

        const targetLogger = CHANNELS[channel] || logger;

        // Ensure level is valid Winston method
        if (typeof targetLogger[level] === 'function') {
            targetLogger[level](message, metadata);
        } else {
            targetLogger.info(message, metadata);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (err) {
        console.error("Telemetry Relay Crash:", err);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}

export const config = {
    path: "/api/telemetry"
};
