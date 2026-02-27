import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function authorizeRequest(req) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { errorResponse: new Response(JSON.stringify({ error: 'Missing or malformed Authorization header' }), { status: 401 }) };
    }
    const apiKey = authHeader.split(' ')[1];
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const { data: keyData, error: keyError } = await supabaseAdmin
        .from('api_keys')
        .select('organization_id, status, permissions')
        .eq('key_hash', keyHash)
        .single();

    if (keyError || !keyData) return { errorResponse: new Response(JSON.stringify({ error: 'Invalid API Key' }), { status: 401 }) };
    if (keyData.status !== 'ACTIVE') return { errorResponse: new Response(JSON.stringify({ error: 'API Key is revoked or suspended' }), { status: 401 }) };

    const orgId = keyData.organization_id;
    const { data: orgData, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select('subscription_tier, account_status, subscription_status')
        .eq('id', orgId)
        .single();

    if (orgError) return { errorResponse: new Response(JSON.stringify({ error: 'Failed to resolve organization context' }), { status: 500 }) };
    if (orgData.account_status !== 'active') return { errorResponse: new Response(JSON.stringify({ error: 'Organization account is disabled' }), { status: 403 }) };
    if (orgData.subscription_status !== 'ACTIVE') return { errorResponse: new Response(JSON.stringify({ error: 'Organization subscription is not ACTIVE.', status: orgData.subscription_status }), { status: 403 }) };
    if (orgData.subscription_tier !== 'SUPER') return { errorResponse: new Response(JSON.stringify({ error: 'Open API access is only available on the SUPER tier.' }), { status: 403 }) };

    supabaseAdmin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key_hash', keyHash).then();

    return {
        context: {
            organizationId: orgId,
            permissions: keyData.permissions
        },
        supabaseAdmin
    };
}
