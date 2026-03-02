import { createClient } from '@supabase/supabase-js';
import withApiAuth from '../middleware/auth.js';

/**
 * WHOLESALE OS - PHASE 31 OPEN API
 * GET /api/v1/deals
 * 
 * Returns a read-only list of deals for the authenticated organization.
 */

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { organizationId, permissions } = req.apiContext;

        if (!permissions.includes('read_only') && !permissions.includes('full_access')) {
            return res.status(403).json({ error: 'Insufficient token permissions' });
        }

        // Allow basic pagination
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const { data: deals, error } = await supabaseAdmin
            .from('deals')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return res.status(200).json({
            meta: {
                organization_id: organizationId,
                timestamp: new Date().toISOString(),
                count: deals.length,
                limit,
                offset
            },
            data: deals
        });

    } catch (error) {
        console.error('[API Deals Error]', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export default withApiAuth(handler);
