/* eslint-env node */
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * WHOLESALE OS - PHASE 31 API MIDDLEWARE
 * 
 * Secures /api/v1/* routes.
 * 1. Extracts the Bearer token from the Authorization header.
 * 2. Hashes the incoming key to compare with securely stored `key_hash` in `api_keys`.
 * 3. Verifies Organization tier (Must be SUPER to access Public API).
 * 4. Injects context `req.org_id` for downstream route handlers.
 */

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function withApiAuth(handler) {
    return async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Missing or malformed Authorization header' });
            }

            const apiKey = authHeader.split(' ')[1];

            // 1. Hash the incoming API Key
            const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

            // 2. Validate against Database
            const { data: keyData, error: keyError } = await supabaseAdmin
                .from('api_keys')
                .select('organization_id, status, permissions')
                .eq('key_hash', keyHash)
                .single();

            if (keyError || !keyData) {
                return res.status(401).json({ error: 'Invalid API Key' });
            }

            if (keyData.status !== 'ACTIVE') {
                return res.status(401).json({ error: 'API Key is revoked or suspended' });
            }

            const orgId = keyData.organization_id;

            // 3. Verify Organization Tier & Status
            const { data: orgData, error: orgError } = await supabaseAdmin
                .from('organizations')
                .select('subscription_tier, account_status, subscription_status')
                .eq('id', orgId)
                .single();

            if (orgError) {
                return res.status(500).json({ error: 'Failed to resolve organization context' });
            }

            if (orgData.account_status !== 'active') {
                return res.status(403).json({ error: 'Organization account is disabled' });
            }

            // Phase 31.5: Subscription Lifecycle Enforcement
            // STRICT: Must be ACTIVE to use Open API.
            if (orgData.subscription_status !== 'ACTIVE') {
                return res.status(403).json({
                    error: 'Organization subscription is not ACTIVE.',
                    status: orgData.subscription_status
                });
            }

            if (orgData.subscription_tier !== 'SUPER') {
                return res.status(403).json({ error: 'Open API access is only available on the SUPER tier.' });
            }

            // 4. Update last_used_at (fire-and-forget to avoid blocking the request)
            supabaseAdmin.from('api_keys')
                .update({ last_used_at: new Date().toISOString() })
                .eq('key_hash', keyHash)
                .then();

            // 5. Inject Context and Proceed
            req.apiContext = {
                organizationId: orgId,
                permissions: keyData.permissions
            };

            return handler(req, res);

        } catch (error) {
            console.error('[API Auth Middleware Error]', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    };
}
