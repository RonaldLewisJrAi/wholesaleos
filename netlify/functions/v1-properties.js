import { authorizeRequest } from './auth-helper.js';

export default async (req) => {
    if (req.method !== 'GET') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });

    try {
        const { errorResponse, context, supabaseAdmin } = await authorizeRequest(req);
        if (errorResponse) return errorResponse;

        const { organizationId, permissions } = context;
        if (!permissions.includes('read_only') && !permissions.includes('full_access')) {
            return new Response(JSON.stringify({ error: 'Insufficient token permissions' }), { status: 403 });
        }

        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get('limit')) || 50;
        const offset = parseInt(url.searchParams.get('offset')) || 0;

        const { data: properties, error } = await supabaseAdmin
            .from('properties')
            .select('id, address, city, state, zip, beds, baths, sqft, created_at, status')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return new Response(JSON.stringify({
            meta: { organization_id: organizationId, timestamp: new Date().toISOString(), count: properties.length },
            data: properties
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}

export const config = {
    path: "/api/v1/properties"
};
