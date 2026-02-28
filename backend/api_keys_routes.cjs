const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;
if (supabaseUrl && supabaseKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
}

// POST /api/keys/generate
router.post('/generate', async (req, res) => {
    try {
        const { organization_id, created_by } = req.body;

        if (!organization_id) {
            return res.status(400).json({ error: 'organization_id is required' });
        }

        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Backend Supabase configuration is missing.' });
        }

        // 1. Generate a raw, secure 32-byte API key
        const rawKeyBuffer = crypto.randomBytes(32);
        const rawKey = `whos_live_${rawKeyBuffer.toString('hex')}`;

        // 2. Hash the key with SHA-256 for secure storage (Node.js crypto)
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

        // Extract a prefix to show in the UI (first 12 chars: 'whos_live_XX')
        const prefix = rawKey.substring(0, 12);

        // 3. Store ONLY the hash and prefix in the database
        const { data, error } = await supabaseAdmin
            .from('api_keys')
            .insert({
                organization_id,
                key_hash: keyHash,
                prefix,
                created_by: created_by || null,
                status: 'ACTIVE'
            })
            .select('*')
            .single();

        if (error) {
            console.error('[API Key Error]: DB Insert Failed', error);
            return res.status(500).json({ error: 'Failed to generate API Key' });
        }

        // 4. Return the RAW key exactly ONCE. It is never stored in plaintext.
        res.status(201).json({
            message: 'API Key generated successfully. Save this key, it will not be shown again.',
            apiKey: rawKey,
            dbRecord: data
        });

    } catch (err) {
        console.error('[API Key Error]:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
